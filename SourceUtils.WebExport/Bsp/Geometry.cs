using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using SourceUtils.ValveBsp;
using Ziks.WebServer;
using PrimitiveType = OpenTK.Graphics.ES20.PrimitiveType;

namespace SourceUtils.WebExport.Bsp
{
    [JsonConverter(typeof(VertexAttributeConverter))]
    public class VertexAttribute : IEquatable<VertexAttribute>
    {
        private static int _sNextIndex = 1;

        public static VertexAttribute Position { get; } = new VertexAttribute( "position", 3 );
        public static VertexAttribute Normal { get; } = new VertexAttribute( "normal", 3 );
        public static VertexAttribute Uv { get; } = new VertexAttribute( "uv", 2 );
        public static VertexAttribute Uv2 { get; } = new VertexAttribute( "uv2", 2 );
        public static VertexAttribute Alpha { get; } = new VertexAttribute( "alpha", 1 );

        public int Index { get; }
        public string Name { get; }
        public int Size { get; }

        public VertexAttribute( string name, int size )
        {
            Index = _sNextIndex++;
            Name = name;
            Size = size;
        }

        public override int GetHashCode()
        {
            return Index;
        }

        public override string ToString()
        {
            return Name;
        }

        public bool Equals( VertexAttribute other )
        {
            return ReferenceEquals( other, this );
        }

        public override bool Equals( object obj )
        {
            return ReferenceEquals( obj, this );
        }
    }

    public class VertexAttributeConverter : JsonConverter
    {
        public override void WriteJson( JsonWriter writer, object value, JsonSerializer serializer )
        {
            writer.WriteValue( ((VertexAttribute) value).Name );
        }

        public override object ReadJson( JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer )
        {
            throw new NotImplementedException();
        }

        public override bool CanConvert( Type objectType )
        {
            return objectType == typeof(VertexAttribute);
        }
    }

    public class MeshElement
    {
        [JsonProperty("mode")]
        public PrimitiveType Mode { get; set; }

        [JsonProperty("material")]
        public int? Material { get; set; }

        [JsonProperty("indexOffset")]
        public int IndexOffset { get; set; }

        [JsonProperty("indexCount")]
        public int IndexCount { get; set; }

        [JsonProperty("vertexOffset")]
        public int? VertexOffset { get; set; }

        [JsonProperty("vertexCount")]
        public int? VertexCount { get; set; }
    }

    public class MeshData
    {
        public struct Vertex : IEquatable<Vertex>
        {
            public readonly IList<float> Buffer;
            public readonly int Index;
            public readonly int Size;
            public readonly int Hash;

            public Vertex( IList<float> buffer, int index, int size, int hash )
            {
                Buffer = buffer;
                Index = index;
                Size = size;
                Hash = hash;
            }

            public Vertex( IList<float> buffer, int index, int size )
                : this( buffer, index, size, 0 )
            {
                unchecked
                {
                    for ( var i = 0; i < size; ++i )
                    {
                        Hash ^= buffer[index + i].GetHashCode();
                        Hash *= 397;
                    }
                }
            }

            public override int GetHashCode()
            {
                return Hash;
            }

            public bool Equals( Vertex other )
            {
                if ( Hash != other.Hash ) return false;
                if ( Size != other.Size ) return false;

                for ( var i = 0; i < Size; ++i )
                {
                    if ( Buffer[Index + i] != other.Buffer[other.Index + i] ) return false;
                }

                return true;
            }

            public override bool Equals( object obj )
            {
                return obj is Vertex && Equals( (Vertex) obj );
            }
        }

        [JsonProperty("attributes")]
        public List<VertexAttribute> Attributes { get; } = new List<VertexAttribute>();

        [JsonProperty("elements")]
        public List<MeshElement> Elements { get; } = new List<MeshElement>();

        [JsonProperty("vertices")]
        public List<float> Vertices { get; } = new List<float>();

        [JsonProperty("indices")]
        public List<int> Indices { get; } = new List<int>();

        private readonly Dictionary<int, int> _attribOffsets = new Dictionary<int, int>();
        private readonly Dictionary<Vertex, int> _vertexIndices = new Dictionary<Vertex, int>();
        private float[] _vertex;
        private int _vertexSize;
        private readonly List<int> _primitiveIndices = new List<int>();

        public void BeginPrimitive()
        {
            if ( _vertex == null )
            {
                _attribOffsets.Clear();

                var offset = 0;
                foreach ( var attrib in Attributes )
                {
                    _attribOffsets.Add( attrib.Index, offset );
                    offset += attrib.Size;
                }

                _vertexSize = offset;
                _vertex = new float[_vertexSize];
            }

            _primitiveIndices.Clear();
        }

        public void VertexAttribute( VertexAttribute attrib, float value )
        {
            var offset = _attribOffsets[attrib.Index];
            _vertex[offset] = value;
        }

        public void VertexAttribute(VertexAttribute attrib, Vector2 value)
        {
            var offset = _attribOffsets[attrib.Index];
            _vertex[offset + 0] = value.X;
            _vertex[offset + 1] = value.Y;
        }

        public void VertexAttribute(VertexAttribute attrib, SourceUtils.Vector3 value)
        {
            var offset = _attribOffsets[attrib.Index];
            _vertex[offset + 0] = value.X;
            _vertex[offset + 1] = value.Y;
            _vertex[offset + 2] = value.Z;
        }

        public void CommitVertex()
        {
            var vert = new Vertex( _vertex, 0, _vertexSize );
            int index;
            if ( !_vertexIndices.TryGetValue( vert, out index ) )
            {
                index = Vertices.Count;
                Vertices.AddRange( _vertex );
                _vertexIndices.Add( new Vertex( Vertices, index, _vertexSize ), index );
            }

            _primitiveIndices.Add( index / _vertexSize );
        }

        private IEnumerable<int> GetTriangleStripEnumerable( IEnumerable<int> indices )
        {
            var a = -1;
            var b = -1;

            var i = 0;
            foreach ( var c in indices )
            {
                if ( a != -1 && b != -1 )
                {
                    yield return a;

                    if ( (++i & 1) == 0 )
                    {
                        yield return b;
                        yield return c;
                    }
                    else
                    {
                        yield return c;
                        yield return b;
                    }
                }

                a = b;
                b = c;
            }
        }

        private IEnumerable<int> GetTriangleFanEnumerable( IEnumerable<int> indices )
        {
            var a = -1;
            var b = -1;

            var i = 0;
            foreach (var c in indices)
            {
                if (a == -1)
                {
                    a = c;
                    continue;
                }

                if ( b != -1 )
                {
                    yield return a;
                    yield return b;
                    yield return c;
                }

                b = c;
            }
        }

        public void CommitPrimitive( PrimitiveType mode, IEnumerable<int> indices = null )
        {
            var enumerable = indices == null ? _primitiveIndices : indices.Select( x => _primitiveIndices[x] );

            switch ( mode )
            {
                case PrimitiveType.Triangles:
                    Indices.AddRange( enumerable );
                    break;
                case PrimitiveType.TriangleStrip:
                    Indices.AddRange( GetTriangleStripEnumerable( enumerable ) );
                    break;
                case PrimitiveType.TriangleFan:
                    Indices.AddRange( GetTriangleFanEnumerable( enumerable ) );
                    break;
                default:
                    throw new NotImplementedException();
            }
        }
    }

    public class MaterialGroup
    {
        [JsonProperty("materialUrl")]
        public Url MaterialUrl { get; set; }

        [JsonProperty("meshData")]
        public MeshData MeshData { get; } = new MeshData();
    }

    public struct LeafFace
    {
        [JsonProperty("material")]
        public int Material { get; set; }

        [JsonProperty("element")]
        public int Element { get; set; }
    }

    public class LeafGeometryPage
    {
        public const int LeavesPerPage = 512;

        public static int GetPageCount( int leaves )
        {
            return (leaves + LeavesPerPage - 1) / LeavesPerPage;
        }

        [JsonProperty( "leaves" )]
        public List<List<LeafFace>> Leaves { get; } = new List<List<LeafFace>>();

        [JsonProperty( "materials" )]
        public List<MaterialGroup> Materials { get; } = new List<MaterialGroup>();
    }

    [Prefix("/maps/{map}/geom")]
    class GeometryController : ResourceController
    {
        [Get("/leafpage{index}.json")]
        public LeafGeometryPage GetLeafPage( [Url] string map, [Url] int index )
        {
            var bsp = Program.GetMap( map );
            var first = index * LeafGeometryPage.LeavesPerPage;
            var count = Math.Min( first + LeafGeometryPage.LeavesPerPage, bsp.Leaves.Length ) - first;

            if ( count < 0 )
            {
                first = bsp.Leaves.Length;
                count = 0;
            }

            var page = new LeafGeometryPage();
            var matGroupIndices = new Dictionary<int, int>();
            var indices = new List<int>();

            const SurfFlags ignoreFlags = SurfFlags.NODRAW | SurfFlags.LIGHT;

            for ( var i = 0; i < count; ++i )
            {
                var leaf = bsp.Leaves[first + i];
                var leafFaces = new List<LeafFace>();

                page.Leaves.Add(leafFaces);

                for ( var j = 0; j < leaf.NumLeafFaces; ++j )
                {
                    var faceIndex = bsp.LeafFaces[leaf.FirstLeafFace + j];
                    var face = bsp.Faces[faceIndex];
                    var texInfo = bsp.TextureInfos[face.TexInfo];

                    if ( (texInfo.Flags & ignoreFlags) != 0 || texInfo.TexData < 0 ) continue;

                    var texData = bsp.TextureData[texInfo.TexData];

                    MaterialGroup matGroup;

                    int matIndex;
                    if ( !matGroupIndices.TryGetValue( texData.NameStringTableId, out matIndex ) )
                    {
                        var texName = bsp.GetTextureString( texData.NameStringTableId );
                        var path = $"materials/{texName.ToLower()}.vmt".Replace( '\\', '/' );
                        var url = bsp.PakFile.ContainsFile( path )
                            ? (Url) $"/maps/{bsp.Name}/{path}.json"
                            : (Url) $"/{path}.json";

                        matGroup = new MaterialGroup {MaterialUrl = url};
                        matGroupIndices.Add( texData.NameStringTableId, matIndex = page.Materials.Count );
                        page.Materials.Add( matGroup );

                        matGroup.MeshData.Attributes.Add( VertexAttribute.Position );
                        matGroup.MeshData.Attributes.Add( VertexAttribute.Uv );
                        matGroup.MeshData.Attributes.Add( VertexAttribute.Uv2 );

                        // TODO: check if material is normal mapped / lightmapped / 2 way blend etc
                    }
                    else
                    {
                        matGroup = page.Materials[matIndex];
                    }

                    if ( Skip ) continue;

                    var meshData = matGroup.MeshData;

                    MeshElement elem;
                    LeafFace leafFace;

                    var leafFaceIndex = leafFaces.FindIndex( x => x.Material == matIndex );
                    if ( leafFaceIndex != -1 )
                    {
                        leafFace = leafFaces[leafFaceIndex];
                        elem = meshData.Elements[leafFace.Element];
                    }
                    else
                    {
                        elem = new MeshElement
                        {
                            Mode = PrimitiveType.Triangles,
                            Material = 0,
                            IndexOffset = meshData.Indices.Count
                        };

                        leafFace = new LeafFace
                        {
                            Material = matIndex,
                            Element = meshData.Elements.Count
                        };

                        leafFaces.Add( leafFace );
                        meshData.Elements.Add( elem );
                    }

                    if ( face.DispInfo != -1 )
                    {
                        // TODO
                    }
                    else
                    {
                        var texScale = new Vector2( 1f / texData.Width, 1f / texData.Height );

                        meshData.BeginPrimitive();

                        for ( int k = face.FirstEdge, kEnd = face.FirstEdge + face.NumEdges; k < kEnd; ++k )
                        {
                            var vert = bsp.GetVertexFromSurfEdgeId( k );
                            var uv = new Vector2(
                                vert.Dot( texInfo.TextureUAxis.Normal ) + texInfo.TextureUAxis.Offset,
                                vert.Dot( texInfo.TextureVAxis.Normal ) + texInfo.TextureVAxis.Offset );

                            var uv2 = new Vector2(
                                vert.Dot( texInfo.LightmapUAxis.Normal ) + texInfo.LightmapUAxis.Offset,
                                vert.Dot( texInfo.LightmapVAxis.Normal ) + texInfo.LightmapVAxis.Offset );

                            Vector2 lmMin, lmSize;
                            bsp.LightmapLayout.GetUvs( faceIndex, out lmMin, out lmSize );

                            uv2.X -= face.LightMapOffsetX - .5f;
                            uv2.Y -= face.LightMapOffsetY - .5f;
                            uv2.X /= face.LightMapSizeX + 1f;
                            uv2.Y /= face.LightMapSizeY + 1f;

                            uv2 *= lmSize;
                            uv2 += lmMin;

                            meshData.VertexAttribute( VertexAttribute.Position, vert );
                            meshData.VertexAttribute( VertexAttribute.Uv, uv * texScale );
                            meshData.VertexAttribute( VertexAttribute.Uv2, uv2 );

                            meshData.CommitVertex();
                        }

                        var numPrimitives = face.NumPrimitives & 0x7fff;

                        if ( numPrimitives == 0 )
                        {
                            meshData.CommitPrimitive( PrimitiveType.TriangleFan );
                        }
                        else
                        {
                            for ( int k = face.FirstPrimitive, kEnd = face.FirstPrimitive + face.NumPrimitives;
                                k < kEnd;
                                ++k )
                            {
                                var primitive = bsp.Primitives[k];
                                for ( int l = primitive.FirstIndex, lEnd = primitive.FirstIndex + primitive.IndexCount;
                                    l < lEnd;
                                    ++l )
                                {
                                    indices.Add( bsp.PrimitiveIndices[l] );
                                }

                                PrimitiveType mode;
                                switch ( primitive.Type )
                                {
                                    case ValveBsp.PrimitiveType.TriangleStrip:
                                        mode = PrimitiveType.TriangleStrip;
                                        break;
                                    case ValveBsp.PrimitiveType.TriangleFan:
                                        mode = PrimitiveType.TriangleFan;
                                        break;
                                    case ValveBsp.PrimitiveType.TriangleList:
                                        mode = PrimitiveType.Triangles;
                                        break;
                                    default:
                                        throw new NotImplementedException();
                                }

                                meshData.CommitPrimitive( mode, indices );
                                indices.Clear();
                            }
                        }
                    }

                    elem.IndexCount = meshData.Indices.Count - elem.IndexOffset;
                }
            }

            return page;
        }
    }
}
