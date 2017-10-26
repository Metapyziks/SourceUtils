using System;
using System.Collections.Generic;
using System.Linq;

namespace SourceUtils.ValveBsp
{
    public class Displacement
    {
        private class Neighbor
        {
            private readonly NeighborOrientation _relativeOrientation;
            private readonly Vector2 _relativeMin;
            private readonly Vector2 _relativeMax;

            public Displacement Displacement { get; }

            public Neighbor( Displacement orig, Displacement disp, NeighborOrientation orientation, Vector2 min, Vector2 max )
            {
                Displacement = disp;
                _relativeOrientation = orientation;
                _relativeMin = min;
                _relativeMax = max;

                if ( orientation != NeighborOrientation.Unknown ) return;

                // Temp hack until I figure out how to correctly offset orientation
                var testPos = (min + max) * 0.5f;

                if ( testPos.X < 0f ) testPos.X = 0f;
                else if ( testPos.X > 1f ) testPos.X = 1f;
                if ( testPos.Y < 0f ) testPos.Y = 0f; 
                else if ( testPos.Y > 1f ) testPos.Y = 1f;

                var origSample = orig.GetInnerPosition( testPos );
                var bestDist2 = float.PositiveInfinity;
                var bestOrientation = NeighborOrientation.CounterClockwise0;

                for ( var i = 0; i < 4; ++i )
                {
                    _relativeOrientation = (NeighborOrientation) i;
                    var sample = GetPosition( testPos );
                    var dist2 = (sample - origSample).LengthSquared;

                    if ( dist2 < bestDist2 )
                    {
                        bestDist2 = dist2;
                        bestOrientation = _relativeOrientation;
                    }
                }

                _relativeOrientation = bestOrientation;
            }

            public bool Contains( Vector2 relativePos )
            {
                return relativePos.X >= _relativeMin.X && relativePos.Y >= _relativeMin.Y
                    && relativePos.X <= _relativeMax.X && relativePos.Y <= _relativeMax.Y;
            }

            public Vector3 GetPosition( Vector2 relativePos )
            {
                relativePos -= _relativeMin;
                relativePos /= _relativeMax - _relativeMin;

                switch ( _relativeOrientation )
                {
                    case NeighborOrientation.CounterClockwise90:
                        relativePos = new Vector2( relativePos.Y, 1f - relativePos.X );
                        break;
                    case NeighborOrientation.CounterClockwise180:
                        relativePos = new Vector2( 1f - relativePos.X, 1f - relativePos.Y );
                        break;
                    case NeighborOrientation.CounterClockwise270:
                        relativePos = new Vector2( 1f - relativePos.Y, relativePos.X );
                        break;
                }

                return Displacement.GetInnerPosition( relativePos );
            }
        }

        private readonly ValveBspFile _bspFile;
        private readonly DispInfo _dispInfo;
        private readonly Vector3[] _corners;
        private readonly int _firstCorner;
        private readonly IntVector2 _min;
        private readonly IntVector2 _max;
        
        private Vector3[] _positions;
        public float[] _alphas;
        private List<Neighbor> _neighbors;

        public int Subdivisions => 1 << _dispInfo.Power;
        public int Size => Subdivisions + 1;
        public Vector3 Normal { get; }

        internal Displacement( ValveBspFile bsp, int index )
            : this( bsp, bsp.DisplacementInfos[index] ) { }

        internal Displacement( ValveBspFile bsp, DispInfo dispInfo )
        {
            _bspFile = bsp;
            _dispInfo = dispInfo;
            _corners = new Vector3[8];

            _min = IntVector2.Zero;
            _max = new IntVector2( Subdivisions, Subdivisions );

            var faces = bsp.FacesHdr.Length > 0 ? bsp.FacesHdr : bsp.Faces;
            var face = faces[_dispInfo.MapFace];
            var firstCornerDist2 = float.MaxValue;

            Normal = bsp.Planes[face.PlaneNum].Normal;

            for ( var i = 0; i < 4; ++i )
            {
                var vert = bsp.GetVertexFromSurfEdgeId( face.FirstEdge + i );
                _corners[i] = vert;

                var dist2 = (_dispInfo.StartPosition - vert).LengthSquared;
                if ( dist2 < firstCornerDist2 )
                {
                    _firstCorner = i;
                    firstCornerDist2 = dist2;
                }
            }
        }

        private void AddEdgeNeighbor(NeighborEdge edge, DispSubNeighbor neighbor )
        {
            var min = new Vector2(0f, 0f);
            var size = 1f;

            if ( neighbor.Span != NeighborSpan.CornerToCorner || neighbor.NeighborSpan != NeighborSpan.CornerToCorner )
            {
                // TODO
                return;
            }

            switch ( edge )
            {
                case NeighborEdge.Left: min.X -= size; break;
                case NeighborEdge.Bottom: min.Y -= size; break;
                case NeighborEdge.Right: min.X += 1f; break;
                case NeighborEdge.Top: min.Y += 1f; break;
            }

            var disp = _bspFile.DisplacementManager[neighbor.NeighborIndex];
            if ( _neighbors.Any( x => x.Displacement == disp ) ) return;

            _neighbors.Add( new Neighbor( this, disp, neighbor.NeighborOrientation, min, min + new Vector2( size, size ) ) );
        }

        private void AddCornerNeighbor( NeighborCorner corner, ushort index )
        {
            var min = new Vector2(0f, 0f);
            var size = 1f;

            switch ( corner )
            {
                case NeighborCorner.LowerLeft:
                    min.X -= size;
                    min.Y -= size;
                    break;
                case NeighborCorner.LowerRight:
                    min.X += 1f;
                    min.Y -= size;
                    break;
                case NeighborCorner.UpperLeft:
                    min.X -= size;
                    min.Y += 1f;
                    break;
                case NeighborCorner.UpperRight:
                    min.X += 1f;
                    min.Y += 1f;
                    break;
            }

            var disp = _bspFile.DisplacementManager[index];
            if ( _neighbors.Any( x => x.Displacement == disp ) ) return;
            
            _neighbors.Add( new Neighbor( this, disp, NeighborOrientation.Unknown, min, min + new Vector2( size, size ) ) );
        }

        private void UpdateNeighbors()
        {
            if ( _neighbors != null ) return;
            _neighbors = new List<Neighbor>();

            for ( var i = 0; i < 4; ++i )
            {
                var edgeNeighbors = _dispInfo.GetEdgeNeighbor( (NeighborEdge) i );
                if ( edgeNeighbors[0].IsValid ) AddEdgeNeighbor( (NeighborEdge) i, edgeNeighbors[0] );
                if ( edgeNeighbors[1].IsValid ) AddEdgeNeighbor( (NeighborEdge) i, edgeNeighbors[1] );
            }

            for ( var i = 0; i < 4; ++i )
            {
                foreach ( var index in _dispInfo.GetCornerNeighbor( (NeighborCorner) i ) )
                {
                    AddCornerNeighbor( (NeighborCorner) i, index );
                }
            }
        }

        public bool Contains( IntVector2 pos )
        {
            return pos.X >= _min.X && pos.Y >= _min.Y && pos.X <= _max.X && pos.Y <= _max.Y;
        }

        public bool Contains( int x, int y )
        {
            return x >= _min.X && y >= _min.Y && x <= _max.X && y <= _max.Y;
        }

        public Vector3 GetPosition( int x, int y )
        {
            var total = 0;
            var sum = Vector3.Zero;

            if ( Contains( x, y ) )
            {
                sum += GetInnerPosition( x, y );
                ++total;
            }

            UpdateNeighbors();

            var relativePos = new Vector2( x / (float) Subdivisions, y / (float) Subdivisions );
            foreach ( var neighbor in _neighbors )
            {
                if ( neighbor.Contains( relativePos ) )
                {
                    sum += neighbor.GetPosition( relativePos );
                    ++total;
                }
            }

            if ( total == 0 ) return GetInnerPosition( x, y );

            return sum * (1f / total);
        }

        public Vector3 GetInnerPosition( Vector2 pos )
        {
            pos *= Subdivisions;

            var x0 = (int) Math.Floor( pos.X );
            var x1 = (int) Math.Ceiling( pos.X );
            var y0 = (int) Math.Floor( pos.Y );
            var y1 = (int) Math.Ceiling( pos.Y );

            var s00 = GetInnerPosition( x0, y0 );

            if ( x1 == x0 && y1 == y0 ) return s00;

            var s10 = x1 == x0 ? s00 : GetInnerPosition( x1, y0 );
            var s01 = y1 == y0 ? s00 : GetInnerPosition( x0, y1 );
            var s11 = x1 == x0 ? s01 : y1 == y0 ? s10 : GetInnerPosition( x1, y1 );

            var tx = pos.X - x0; var sx = 1f - tx;
            var ty = pos.Y - y0; var sy = 1f - ty;

            return (s00 * sx + s10 * tx) * sy + (s01 * sx + s11 * tx) * ty;
        }

        public void GetCorners( out Vector3 c0, out Vector3 c1, out Vector3 c2, out Vector3 c3 )
        {
            c0 = _corners[(0 + _firstCorner) & 3];
            c1 = _corners[(1 + _firstCorner) & 3];
            c2 = _corners[(2 + _firstCorner) & 3];
            c3 = _corners[(3 + _firstCorner) & 3];
        }

        private void UpdatePositions()
        {
            lock ( this )
            {
                if ( _positions != null ) return;

                var size = Size;

                _positions = new Vector3[size * size];
                _alphas = new float[size * size];

                const float alphaMul = 1f / 255f;

                for ( var y = 0; y < size; ++y )
                for ( var x = 0; x < size; ++x )
                {
                    var index = x + y * size;
                    var vert = _bspFile.DisplacementVerts[_dispInfo.DispVertStart + index];

                    var tx = x / (size - 1f);
                    var ty = y / (size - 1f);
                    var sx = 1f - tx;
                    var sy = 1f - ty;

                    var cornerA = _corners[(0 + _firstCorner) & 3];
                    var cornerB = _corners[(1 + _firstCorner) & 3];
                    var cornerC = _corners[(2 + _firstCorner) & 3];
                    var cornerD = _corners[(3 + _firstCorner) & 3];

                    var origin = ty * (sx * cornerB + tx * cornerC) + sy * (sx * cornerA + tx * cornerD);

                    _positions[index] = origin + vert.Vector * vert.Distance;
                    _alphas[index] = vert.Alpha * alphaMul;
                }
            }
        }

        public Vector3 GetInnerPosition( int x, int y )
        {
            if ( x < _min.X ) x = _min.X;
            else if ( x > _max.X ) x = _max.X;
            
            if ( y < _min.Y ) y = _min.Y;
            else if ( y > _max.Y ) y = _max.Y;

            if ( _positions == null ) UpdatePositions();
            return _positions[x + y * Size];
        }

        public float GetAlpha( int x, int y )
        {
            if (_alphas == null) UpdatePositions();
            return _alphas[x + y * Size];
        }

        [ThreadStatic]
        private static Vector3[] _sKernel;

        public Vector3 GetNormal( int x, int y )
        {
            if ( _sKernel == null ) _sKernel = new Vector3[9];

            for ( var i = 0; i < 3; ++i )
            for ( var j = 0; j < 3; ++j )
            {
                _sKernel[i + j * 3] = GetPosition( x + i - 1, y + j - 1 );
            }

            var sum = Vector3.Zero;

            for ( var i = 0; i < 2; ++i )
            for ( var j = 0; j < 2; ++j )
            {
                var a = _sKernel[i + 0 + (j + 0) * 3];
                var b = _sKernel[i + 1 + (j + 0) * 3];
                var c = _sKernel[i + 0 + (j + 1) * 3];
                var d = _sKernel[i + 1 + (j + 1) * 3];

                var abd = (b - a).Cross( d - a );
                var adc = (d - a).Cross( c - d );

                sum += abd + adc;
            }

            var normal = sum.Normalized;

            if ( normal.IsNaN ) normal = Normal;

            return normal;
        }
    }
}
