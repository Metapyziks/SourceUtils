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
                    case NeighborOrientation.CounterClockwise270:
                        relativePos = new Vector2( relativePos.Y, 1f - relativePos.X );
                        break;
                    case NeighborOrientation.CounterClockwise180:
                        relativePos = new Vector2( 1f - relativePos.X, 1f - relativePos.Y );
                        break;
                    case NeighborOrientation.CounterClockwise90:
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

            var face = bsp.FacesHdr[_dispInfo.MapFace];
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
                case NeighborEdge.Top: min.Y += 1f; break;
                case NeighborEdge.Right: min.X += 1f; break;
                case NeighborEdge.Bottom: min.Y -= size; break;
            }

            var disp = _bspFile.DisplacementManager[neighbor.NeighborIndex];
            if ( _neighbors.Any( x => x.Displacement == disp ) ) return;

            _neighbors.Add( new Neighbor( this, disp, neighbor.NeighborOrientation, min, min + new Vector2( size, size ) ) );
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

            // TODO: Corners
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

        public Vector3 GetInnerPosition( int x, int y )
        {
            if ( x < _min.X ) x = _min.X;
            else if ( x > _max.X ) x = _max.X;
            
            if ( y < _min.Y ) y = _min.Y;
            else if ( y > _max.Y ) y = _max.Y;

            var size = Size;
            var vert = _bspFile.DisplacementVerts[_dispInfo.DispVertStart + x + y * size];

            var tx = x / (size - 1f);
            var ty = y / (size - 1f);
            var sx = 1f - tx;
            var sy = 1f - ty;

            var cornerA = _corners[(0 + _firstCorner) & 3];
            var cornerB = _corners[(1 + _firstCorner) & 3];
            var cornerC = _corners[(2 + _firstCorner) & 3];
            var cornerD = _corners[(3 + _firstCorner) & 3];

            var origin = ty * (sx * cornerB + tx * cornerC) + sy * (sx * cornerA + tx * cornerD);

            return origin + vert.Vector * vert.Distance;
        }

        public Vector3 GetNormal( int x, int y )
        {
            var x0v = GetPosition( x - 1, y );
            var x1v = GetPosition( x + 1, y );
            
            var y0v = GetPosition( x, y - 1 );
            var y1v = GetPosition( x, y + 1 );

            var normal = (x1v - x0v).Cross( y1v - y0v ).Normalized;

            if ( normal.IsNaN ) normal = Normal;

            return normal;
        }
    }
}
