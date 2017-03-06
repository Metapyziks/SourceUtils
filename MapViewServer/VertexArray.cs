using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;

namespace MapViewServer
{
    [Flags]
    public enum MeshComponent
    {
        Position = 1,
        Normal = 2,
        Uv = 4,
        Uv2 = 8,
        Alpha = 16,
        Rgb = 32
    }

    public class VertexArray
    {
        private struct Vertex : IEquatable<Vertex>
        {
            public readonly Vector3 Position;
            public readonly Vector3 Normal;
            public readonly Vector2 TexCoord;
            public readonly Vector2 LightmapCoord;
            public readonly float Alpha;

            public Vertex( Vector3 position = default(Vector3), Vector3 normal = default(Vector3), Vector2 texCoord = default(Vector2), Vector2 lightmapCoord = default(Vector2), float alpha = 1f )
            {
                Position = position;
                Normal = normal;
                TexCoord = texCoord;
                LightmapCoord = lightmapCoord;
                Alpha = alpha;
            }

            public bool Equals( Vertex other )
            {
                return Position.Equals( other.Position )
                    && Normal.Equals( other.Normal )
                    && TexCoord.Equals( other.TexCoord )
                    && TexCoord.Equals( other.LightmapCoord )
                    && Alpha.Equals( other.Alpha );
            }

            public override bool Equals( object obj )
            {
                if ( ReferenceEquals( null, obj ) ) return false;
                return obj is Vertex && Equals( (Vertex) obj );
            }

            public override int GetHashCode()
            {
                return Position.GetHashCode();
            }

            public int Serialize( MeshComponent components, float[] dest )
            {
                var destIndex = 0;
                if ( components.HasFlag( MeshComponent.Position ) )
                {
                    dest[destIndex++] = Position.X;
                    dest[destIndex++] = Position.Y;
                    dest[destIndex++] = Position.Z;
                }

                if ( components.HasFlag( MeshComponent.Normal ) )
                {
                    dest[destIndex++] = Normal.X;
                    dest[destIndex++] = Normal.Y;
                    dest[destIndex++] = Normal.Z;
                }

                if ( components.HasFlag( MeshComponent.Uv ) )
                {
                    dest[destIndex++] = TexCoord.X;
                    dest[destIndex++] = TexCoord.Y;
                }

                if ( components.HasFlag( MeshComponent.Uv2 ) )
                {
                    dest[destIndex++] = LightmapCoord.X;
                    dest[destIndex++] = LightmapCoord.Y;
                }

                if ( components.HasFlag( MeshComponent.Alpha ) )
                {
                    dest[destIndex++] = Alpha;
                }

                return destIndex;
            }
        }

        private struct Element : IComparable<Element>
        {
            public readonly int TexStringId;
            public int Offset;
            public int Count;

            public Element( int texStringId, int offset, int count )
            {
                TexStringId = texStringId;
                Offset = offset;
                Count = count;
            }

            public int CompareTo( Element other )
            {
                var texStringIdComparison = TexStringId - other.TexStringId;
                return texStringIdComparison != 0 ? texStringIdComparison : Offset - other.Offset;
            }

            public JToken ToJson()
            {
                return new JObject
                {
                    {"type", (int) PrimitiveType.TriangleList},
                    {"material", TexStringId},
                    {"indexOffset", Offset},
                    {"indexCount", Count}
                };
            }
        }

        private readonly List<float> _vertices = new List<float>();
        private readonly List<int> _indices = new List<int>();
        private readonly Dictionary<Vertex, int> _indexMap = new Dictionary<Vertex, int>();
        private readonly List<int> _curPrimitive = new List<int>();
        private readonly List<Element> _elements = new List<Element>();

        private int _vertexCount;

        [ThreadStatic]
        private static float[] _sVertexBuffer;

        public MeshComponent ComponentMask { get; set; } = MeshComponent.Position;

        public JToken GetElements()
        {
            var array = new JArray();

            var indexCount = 0;
            var lastElement = new Element( int.MaxValue, -1, -1 );

            foreach ( var element in _elements )
            {
                if ( lastElement.TexStringId == element.TexStringId )
                {
                    lastElement.Count += element.Count;
                }
                else
                {
                    if ( lastElement.Count != -1 ) array.Add( lastElement.ToJson() );
                    lastElement = new Element( element.TexStringId, indexCount, element.Count );
                }

                indexCount += element.Count;
            }

            if ( lastElement.Count != -1 )
            {
                array.Add( lastElement.ToJson() );
            }

            return array;
        }

        public JToken GetVertices( bool compressed )
        {
            return Utils.SerializeArray( _vertices, compressed );
        }

        public JToken GetIndices( bool compressed )
        {
            return Utils.SerializeArray( _elements
                .SelectMany( x => Enumerable.Range( x.Offset, x.Count )
                    .Select( y => _indices[y] ) ), compressed );
        }

        public void Clear()
        {
            _vertices.Clear();
            _indices.Clear();
            _indexMap.Clear();
            _curPrimitive.Clear();
            _elements.Clear();

            _vertexCount = 0;
        }

        public int IndexCount => _indices.Count;

        public void AddVertex( Vector3 position = default(Vector3), Vector3 normal = default(Vector3), Vector2 texCoord = default(Vector2), Vector2 lightmapCoord = default(Vector2), float alpha = 1f )
        {
            var vertex = new Vertex( position, normal, texCoord, lightmapCoord, alpha );

            int index;
            if ( !_indexMap.TryGetValue( vertex, out index ) )
            {
                index = _vertexCount++;

                if ( _sVertexBuffer == null ) _sVertexBuffer = new float[256];

                var count = vertex.Serialize( ComponentMask, _sVertexBuffer );

                for ( var i = 0; i < count; ++i )
                {
                    _vertices.Add( _sVertexBuffer[i] );
                }

                _indexMap.Add( vertex, index );
            }

            _curPrimitive.Add( index );
        }

        public void BeginPrimitive()
        {
            _curPrimitive.Clear();
        }

        private IEnumerable<int> GetTriangleListIndices( IList<int> indices = null )
        {
            return indices?.Select( x => _curPrimitive[x] ) ?? _curPrimitive;
        }

        private IEnumerable<int> GetTriangleFanIndices( IList<int> indices = null )
        {
            if ( (indices ?? _curPrimitive).Count < 3 ) yield break;

            var first = _curPrimitive[indices?[0] ?? 0];
            var prev = _curPrimitive[indices?[1] ?? 1];

            for ( int i = 2, count = (indices ?? _curPrimitive).Count; i < count; ++i )
            {
                var next = _curPrimitive[indices?[i] ?? i];

                yield return first;
                yield return prev;
                yield return next;

                prev = next;
            }
        }

        private IEnumerable<int> GetTriangleStripIndices( IList<int> indices = null )
        {
            if ( (indices ?? _curPrimitive).Count < 3 ) yield break;

            var a = _curPrimitive[indices?[0] ?? 0];
            var b = _curPrimitive[indices?[1] ?? 1];

            for ( int i = 2, count = (indices ?? _curPrimitive).Count; i < count; ++i )
            {
                var c = _curPrimitive[indices?[i] ?? i];

                if ( (i & 1) == 0 )
                {
                    yield return a;
                    yield return b;
                }
                else
                {
                    yield return b;
                    yield return a;
                }

                yield return c;

                a = b;
                b = c;
            }
        }

        public void CommitPrimitive( PrimitiveType type, int texStringId, IList<int> indices = null )
        {
            var offset = _indices.Count;

            switch ( type )
            {
                case PrimitiveType.TriangleList:
                    _indices.AddRange( GetTriangleListIndices( indices ) );
                    break;
                case PrimitiveType.TriangleFan:
                    _indices.AddRange( GetTriangleFanIndices( indices ) );
                    break;
                case PrimitiveType.TriangleStrip:
                    _indices.AddRange( GetTriangleStripIndices( indices ) );
                    break;
            }

            var primitive = new Element( texStringId, offset, _indices.Count - offset );

            for ( var i = 0; i < _elements.Count; ++i )
            {
                if ( primitive.CompareTo( _elements[i] ) > 0 ) continue;
                _elements.Insert( i, primitive );
                return;
            }

            _elements.Add( primitive );
        }
    }
}
