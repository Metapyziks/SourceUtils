using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Newtonsoft.Json;
using OpenTK;
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

        [JsonProperty( "vertexOffset" )]
        public int? VertexOffset { get; set; }

        [JsonProperty( "vertexCount" )]
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

        [JsonIgnore]
        public int MaterialIndex { get; }

        [JsonIgnore]
        public bool CacheVertices { get; }

        [JsonProperty("attributes")]
        public List<VertexAttribute> Attributes { get; } = new List<VertexAttribute>();

        [JsonProperty("elements")]
        public List<MeshElement> Elements { get; } = new List<MeshElement>();

        [JsonProperty("vertices")]
        public CompressedList<float> Vertices { get; } = new CompressedList<float>();

        [JsonProperty("indices")]
        public CompressedList<int> Indices { get; } = new CompressedList<int>();

        [JsonIgnore]
        public int VertexSize { get; private set; }

        private readonly Dictionary<int, int> _attribOffsets = new Dictionary<int, int>();
        private readonly Dictionary<Vertex, int> _vertexIndices = new Dictionary<Vertex, int>();
        private float[] _vertex;
        private readonly List<int> _primitiveIndices = new List<int>();

        public MeshData( int index, bool cacheVertices )
        {
            MaterialIndex = index;
            CacheVertices = cacheVertices;
        }

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

                VertexSize = offset;
                _vertex = new float[VertexSize];
            }

            _primitiveIndices.Clear();
        }

        [Conditional("DEBUG")]
        private static void AssertFinite( float value )
        {
            if ( float.IsNaN( value ) || float.IsInfinity( value ) )
            {
                throw new NotFiniteNumberException();
            }
        }

        public void VertexAttribute( VertexAttribute attrib, float value )
        {
            AssertFinite( value );

            int offset;
            if ( !_attribOffsets.TryGetValue( attrib.Index, out offset ) ) return;
            _vertex[offset] = value;
        }

        public void VertexAttribute(VertexAttribute attrib, Vector2 value)
        {
            AssertFinite( value.X );
            AssertFinite( value.Y );

            int offset;
            if (!_attribOffsets.TryGetValue(attrib.Index, out offset)) return;
            _vertex[offset + 0] = value.X;
            _vertex[offset + 1] = value.Y;
        }

        public void VertexAttribute(VertexAttribute attrib, SourceUtils.Vector3 value)
        {
            AssertFinite( value.X );
            AssertFinite( value.Y );
            AssertFinite( value.Z );

            int offset;
            if (!_attribOffsets.TryGetValue(attrib.Index, out offset)) return;
            _vertex[offset + 0] = value.X;
            _vertex[offset + 1] = value.Y;
            _vertex[offset + 2] = value.Z;
        }

        public void CommitVertex()
        {
            var vert = new Vertex( _vertex, 0, VertexSize );
            int index;
            if ( !CacheVertices || !_vertexIndices.TryGetValue( vert, out index ) )
            {
                index = Vertices.Count;
                Vertices.AddRange( _vertex );

                if ( CacheVertices ) _vertexIndices.Add( new Vertex( Vertices, index, VertexSize ), index );
            }

            _primitiveIndices.Add( index / VertexSize );
        }

        private static IEnumerable<int> GetTriangleStripEnumerable( IEnumerable<int> indices )
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
                        yield return c;
                        yield return b;
                    }
                    else
                    {
                        yield return b;
                        yield return c;
                    }
                }

                a = b;
                b = c;
            }
        }

        private static IEnumerable<int> GetTriangleFanEnumerable( IEnumerable<int> indices )
        {
            var a = -1;
            var b = -1;

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
            var enumerable = indices?.Select( x => _primitiveIndices[x] ) ?? _primitiveIndices;

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
        [JsonProperty("material")]
        public int Material { get; set; }

        [JsonProperty("meshData")]
        public MeshData MeshData { get; }

        public MaterialGroup( int index, bool cacheVertices )
        {
            MeshData = new MeshData( index, cacheVertices );
        }
    }

    public struct Face
    {
        [JsonProperty("material")]
        public int Material { get; set; }

        [JsonProperty("element")]
        public int Element { get; set; }
    }

    public class StudioModel
    {
        [JsonProperty( "bodyParts" )]
        public List<SmdBodyPart> BodyParts { get; } = new List<SmdBodyPart>();
    }

    public class SmdBodyPart
    {
        [JsonProperty( "name" )]
        public string Name { get; set; }

        [JsonProperty( "models" )]
        public List<SmdModel> Models { get; } = new List<SmdModel>();
    }

    public class SmdModel
    {
        [JsonProperty( "meshes" )]
        public List<SmdMesh> Meshes { get; } = new List<SmdMesh>();
    }

    public class SmdMesh
    {
        [JsonProperty( "meshId" )]
        public int MeshId { get; set; }

        [JsonProperty( "material" )]
        public int Material { get; set; }

        [JsonProperty( "element" )]
        public int Element { get; set; }
    }

    public abstract class GeometryPage
    {
        [JsonIgnore]
        public Dictionary<int, int> MaterialIndices { get; } = new Dictionary<int, int>();

        [JsonProperty("materials")]
        public List<MaterialGroup> Materials { get; } = new List<MaterialGroup>();
    }

    public class LeafGeometryPage : GeometryPage
    {
        public const int LeavesPerPage = 8192;

        [JsonProperty( "leaves" )]
        public List<List<Face>> Leaves { get; } = new List<List<Face>>();
    }

    public class DispGeometryPage : GeometryPage
    {
        public const int DisplacementsPerPage = 8192;

        [JsonProperty( "displacements" )]
        public List<Face> Displacements { get; } = new List<Face>();
    }

    public class StudioModelPage : GeometryPage
    {
        public const int VerticesPerPage = 65536 * 4;

        [JsonProperty( "models" )]
        public List<StudioModel> Models { get; } = new List<StudioModel>();
    }

    public class VertexLightingPage
    {
        public const int PropsPerPage = 1024;

        [JsonProperty("props")]
        public List<List<CompressedList<uint>>> Props { get; } = new List<List<CompressedList<uint>>>();
    }

    [Prefix("/maps/{map}/geom")]
    class GeometryController : ResourceController
    {
        private static Vector2 GetUv( SourceUtils.Vector3 pos, TexAxis uAxis, TexAxis vAxis )
        {
            return new Vector2(
                pos.Dot( uAxis.Normal ) + uAxis.Offset,
                pos.Dot( vAxis.Normal ) + vAxis.Offset );
        }

        [ThreadStatic]
        private static List<int> _sIndexBuffer;

        private void FindMaterialAttributes( ValveMaterialFile vmt, List<VertexAttribute> dest )
        {
            dest.Add( VertexAttribute.Position );
            dest.Add( VertexAttribute.Normal );
            dest.Add( VertexAttribute.Uv );

            if ( vmt == null ) return;

            var shader = vmt.Shaders.First();

            switch ( shader.ToLower() )
            {
                case "lightmappedgeneric":
                case "lightmappedreflective":
                case "worldtwotextureblend":
                case "water":
                    dest.Add( VertexAttribute.Uv2 );
                    break;
                case "lightmapped_4wayblend":
                case "worldvertextransition":
                    dest.Add( VertexAttribute.Alpha );
                    goto case "lightmappedgeneric";
            }
        }

        private MeshData GetOrCreateMeshData( ValveBspFile bsp, GeometryPage page, string matPath, bool cacheVertices = true )
        {
            MaterialGroup matGroup;

            var matDictIndex = MaterialDictionary.GetResourceIndex( bsp, matPath );

            if ( !page.MaterialIndices.TryGetValue( matDictIndex, out int matIndex ) )
            {
                var vmt = ValveMaterialFile.FromProvider( MaterialDictionary.GetResourcePath( bsp, matDictIndex ), bsp.PakFile, Program.Resources );

                matGroup = new MaterialGroup( matIndex = page.Materials.Count, cacheVertices ) { Material = matDictIndex };
                page.MaterialIndices.Add( matDictIndex, matIndex );
                page.Materials.Add( matGroup );

                FindMaterialAttributes( vmt, matGroup.MeshData.Attributes );
            }
            else
            {
                matGroup = page.Materials[matIndex];
            }

            return matGroup.MeshData;
        }

        private void WriteFace( ValveBspFile bsp, int faceIndex, GeometryPage page, List<Face> outFaces )
        {
            const SurfFlags ignoreFlags = SurfFlags.NODRAW | SurfFlags.LIGHT | SurfFlags.SKY | SurfFlags.SKY2D;

            var faceInfo = bsp.Faces[faceIndex];
            var texInfo = bsp.TextureInfos[faceInfo.TexInfo];

            if ((texInfo.Flags & ignoreFlags) != 0 || texInfo.TexData < 0)
            {
                return;
            }

            var texData = bsp.TextureData[texInfo.TexData];

            var matPath = bsp.GetTextureString( texData.NameStringTableId );
            var meshData = GetOrCreateMeshData( bsp, page, matPath );

            if (Skip)
            {
                return;
            }

            MeshElement elem;
            Face face;

            var leafFaceIndex = outFaces.FindIndex( x => x.Material == meshData.MaterialIndex );
            if (leafFaceIndex != -1)
            {
                face = outFaces[leafFaceIndex];
                elem = meshData.Elements[face.Element];
            }
            else
            {
                elem = new MeshElement
                {
                    Mode = PrimitiveType.Triangles,
                    Material = 0,
                    IndexOffset = meshData.Indices.Count
                };

                face = new Face
                {
                    Material = meshData.MaterialIndex,
                    Element = meshData.Elements.Count
                };

                outFaces.Add(face);
                meshData.Elements.Add(elem);
            }

            var texScale = new Vector2(1f / Math.Max(texData.Width, 1), 1f / Math.Max(texData.Height, 1));

            Vector2 lmMin, lmSize;
            bsp.LightmapLayout.GetUvs(faceIndex, out lmMin, out lmSize);

            if ( faceInfo.DispInfo != -1 )
            {
                var disp = bsp.DisplacementManager[faceInfo.DispInfo];

                SourceUtils.Vector3 c0, c1, c2, c3;
                disp.GetCorners( out c0, out c1, out c2, out c3 );

                var uv00 = GetUv( c0, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
                var uv10 = GetUv( c3, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
                var uv01 = GetUv( c1, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
                var uv11 = GetUv( c2, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;

                var subDivMul = 1f / disp.Subdivisions;

                for ( var y = 0; y < disp.Subdivisions; ++y )
                {
                    meshData.BeginPrimitive();
                    var v0 = (y + 0) * subDivMul;
                    var v1 = (y + 1) * subDivMul;

                    for ( var x = 0; x < disp.Size; ++x )
                    {
                        var u = x * subDivMul;

                        meshData.VertexAttribute( VertexAttribute.Position, disp.GetPosition( x, y + 0 ) );
                        meshData.VertexAttribute( VertexAttribute.Normal, disp.GetNormal( x, y + 0 ) );
                        meshData.VertexAttribute( VertexAttribute.Uv,
                            (uv00 * (1f - u) + uv10 * u) * (1f - v0) + (uv01 * (1f - u) + uv11 * u) * v0 );
                        meshData.VertexAttribute( VertexAttribute.Uv2, new Vector2( u, v0 ) * lmSize + lmMin );
                        meshData.VertexAttribute( VertexAttribute.Alpha, disp.GetAlpha( x, y + 0 ) );
                        meshData.CommitVertex();

                        meshData.VertexAttribute( VertexAttribute.Position, disp.GetPosition( x, y + 1 ) );
                        meshData.VertexAttribute( VertexAttribute.Normal, disp.GetNormal( x, y + 1 ) );
                        meshData.VertexAttribute( VertexAttribute.Uv,
                            (uv00 * (1f - u) + uv10 * u) * (1f - v1) + (uv01 * (1f - u) + uv11 * u) * v1 );
                        meshData.VertexAttribute( VertexAttribute.Uv2, new Vector2( u, v1 ) * lmSize + lmMin );
                        meshData.VertexAttribute( VertexAttribute.Alpha, disp.GetAlpha( x, y + 1 ) );
                        meshData.CommitVertex();
                    }

                    meshData.CommitPrimitive( PrimitiveType.TriangleStrip );
                }
            }
            else
            {
                meshData.BeginPrimitive();

                var plane = bsp.Planes[faceInfo.PlaneNum];

                for ( int k = faceInfo.FirstEdge, kEnd = faceInfo.FirstEdge + faceInfo.NumEdges; k < kEnd; ++k )
                {
                    var vert = bsp.GetVertexFromSurfEdgeId( k );
                    var uv = GetUv( vert, texInfo.TextureUAxis, texInfo.TextureVAxis );
                    var uv2 = GetUv( vert, texInfo.LightmapUAxis, texInfo.LightmapVAxis );

                    uv2.X -= faceInfo.LightMapOffsetX;
                    uv2.Y -= faceInfo.LightMapOffsetY;
                    uv2.X /= Math.Max(faceInfo.LightMapSizeX, 1);
                    uv2.Y /= Math.Max(faceInfo.LightMapSizeY, 1);

                    uv2 *= lmSize;
                    uv2 += lmMin;

                    meshData.VertexAttribute( VertexAttribute.Position, vert );
                    meshData.VertexAttribute( VertexAttribute.Normal, plane.Normal );
                    meshData.VertexAttribute( VertexAttribute.Uv, uv * texScale );
                    meshData.VertexAttribute( VertexAttribute.Uv2, uv2 );

                    meshData.CommitVertex();
                }

                var numPrimitives = faceInfo.NumPrimitives & 0x7fff;

                if ( numPrimitives == 0 )
                {
                    meshData.CommitPrimitive( PrimitiveType.TriangleFan );
                }
                else
                {
                    if ( _sIndexBuffer == null ) _sIndexBuffer = new List<int>();
                    else _sIndexBuffer.Clear();

                    var indices = _sIndexBuffer;

                    for ( int k = faceInfo.FirstPrimitive, kEnd = faceInfo.FirstPrimitive + numPrimitives;
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

        [Get( "/disppage{index}.json" )]
        public DispGeometryPage GetDispPage( [Url] string map, [Url] int index )
        {
            var bsp = Program.GetMap( map );
            var first = index * DispGeometryPage.DisplacementsPerPage;
            var count = Math.Min( first + DispGeometryPage.DisplacementsPerPage, bsp.DisplacementInfos.Length ) - first;

            if ( count < 0 )
            {
                first = bsp.DisplacementInfos.Length;
                count = 0;
            }

            var page = new DispGeometryPage();
            var faces = new List<Face>();

            for ( var i = 0; i < count; ++i )
            {
                var disp = bsp.DisplacementInfos[i + first];
                var faceIndex = disp.MapFace;

                faces.Clear();
                WriteFace( bsp, faceIndex, page, faces );

                if ( faces.Count == 0 )
                {
                    page.Displacements.Add( new Face { Element = -1, Material = -1 } );
                }
                else
                {
                    page.Displacements.Add( faces[0] );
                }
            }

            return page;
        }

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

            for ( var i = 0; i < count; ++i )
            {
                var leaf = bsp.Leaves[first + i];
                var faces = new List<Face>();

                for ( var j = 0; j < leaf.NumLeafFaces; ++j )
                {
                    var faceIndex = bsp.LeafFaces[leaf.FirstLeafFace + j];
                    WriteFace( bsp, faceIndex, page, faces );
                }

                page.Leaves.Add(faces);
            }

            return page;
        }

        [Get( "/mdlpage{index}.json" )]
        public StudioModelPage GetStudioModelPage( [Url] string map, [Url] int index )
        {
            var bsp = Program.GetMap( map );

            var info = IndexController.GetPageLayout( bsp, StudioModelDictionary.GetResourceCount( bsp ),
                StudioModelPage.VerticesPerPage,
                null, i => StudioModelDictionary.GetVertexCount( bsp, i ) ).Skip( index ).FirstOrDefault();

            var first = info?.First ?? StudioModelDictionary.GetResourceCount( bsp );
            var count = info?.Count ?? 0;

            var page = new StudioModelPage();

            StudioVertex[] vertices = null;
            int[] indices = null;

            for ( var i = 0; i < count; ++i )
            {
                var mdlPath = StudioModelDictionary.GetResourcePath( bsp, first + i );
                var vvdPath = mdlPath.Replace( ".mdl", ".vvd" );
                var vtxPath = mdlPath.Replace( ".mdl", ".dx90.vtx" );

                var mdlFile = StudioModelFile.FromProvider( mdlPath, bsp.PakFile, Program.Resources );
                var vvdFile = ValveVertexFile.FromProvider( vvdPath, bsp.PakFile, Program.Resources );
                var vtxFile = ValveTriangleFile.FromProvider( vtxPath, mdlFile, vvdFile, bsp.PakFile, Program.Resources );

                StudioModel mdl;
                page.Models.Add( mdl = new StudioModel() );

                for ( var j = 0; j < mdlFile.BodyPartCount; ++j )
                {
                    SmdBodyPart smdBodyPart;
                    mdl.BodyParts.Add( smdBodyPart = new SmdBodyPart
                    {
                        Name = mdlFile.GetBodyPartName( j )
                    } );

                    smdBodyPart.Models.AddRange( mdlFile.GetModels( j ).Select( (model, modelIndex) =>
                    {
                        var smdModel = new SmdModel();

                        smdModel.Meshes.AddRange( mdlFile.GetMeshes( ref model ).Select( ( mesh, meshIndex ) =>
                        {
                            var vertexCount = vtxFile.GetVertexCount( j, modelIndex, 0, meshIndex );
                            if ( vertices == null || vertices.Length < vertexCount )
                            {
                                vertices = new StudioVertex[MathHelper.NextPowerOfTwo( vertexCount )];
                            }

                            var indexCount = vtxFile.GetIndexCount( j, modelIndex, 0, meshIndex );
                            if ( indices == null || indices.Length < indexCount )
                            {
                                indices = new int[MathHelper.NextPowerOfTwo( indexCount )];
                            }

                            vtxFile.GetVertices( j, modelIndex, 0, meshIndex, vertices );
                            vtxFile.GetIndices( j, modelIndex, 0, meshIndex, indices );

                            var meshData = GetOrCreateMeshData( bsp, page,
                                mdlFile.GetMaterialName( mesh.Material, bsp.PakFile, Program.Resources ), false );

                            var meshElem = new MeshElement
                            {
                                Mode = PrimitiveType.Triangles,
                                IndexOffset = meshData.Indices.Count,
                                VertexOffset = meshData.Vertices.Count
                            };

                            var smdMesh = new SmdMesh
                            {
                                MeshId = mesh.MeshId,
                                Material = meshData.MaterialIndex,
                                Element = meshData.Elements.Count
                            };

                            meshData.BeginPrimitive();

                            for ( var k = 0; k < vertexCount; ++k )
                            {
                                var vertex = vertices[k];

                                meshData.VertexAttribute( VertexAttribute.Position, vertex.Position );
                                meshData.VertexAttribute( VertexAttribute.Normal, vertex.Normal );
                                meshData.VertexAttribute( VertexAttribute.Uv, new Vector2( vertex.TexCoordX, vertex.TexCoordY ) );
                                meshData.CommitVertex();
                            }

                            meshData.CommitPrimitive( PrimitiveType.Triangles, indices.Take( indexCount ) );

                            meshElem.IndexCount = meshData.Indices.Count - meshElem.IndexOffset;
                            meshElem.VertexCount = meshData.Vertices.Count - meshElem.VertexOffset;

                            meshData.Elements.Add( meshElem );

                            return smdMesh;
                        } ) );

                        return smdModel;
                    } ) );
                }
            }

            return page;
        }

        [Get( "/vhvpage{index}.json" )]
        public VertexLightingPage GetVertexLightingPage( [Url] string map, [Url] int index )
        {
            var bsp = Program.GetMap( map );

            var info = IndexController.GetPageLayout( bsp, bsp.StaticProps.PropCount,
                VertexLightingPage.PropsPerPage, null ).Skip( index ).FirstOrDefault();

            var first = info?.First ?? bsp.StaticProps.PropCount;
            var count = info?.Count ?? 0;

            var page = new VertexLightingPage();

            for ( var i = 0; i < count; ++i )
            {
                var propIndex = first + i;

                StaticPropFlags flags;
                bsp.StaticProps.GetPropInfo( propIndex, out flags, out bool _, out uint _ );
                if ( (flags & StaticPropFlags.NoPerVertexLighting) != 0 )
                {
                    page.Props.Add( null );
                    continue;
                }

                var ldrPath = $"sp_{propIndex}.vhv";
                var hdrPath = $"sp_hdr_{propIndex}.vhv";
                var existingPath = bsp.PakFile.ContainsFile( hdrPath )
                    ? hdrPath : bsp.PakFile.ContainsFile( ldrPath ) ? ldrPath : null;

                if ( existingPath == null )
                {
                    page.Props.Add( null );
                    continue;
                }

                var vhvFile = ValveVertexLightingFile.FromProvider( existingPath, bsp.PakFile );

                if ( vhvFile == null )
                {
                    page.Props.Add( null );
                    continue;
                }
                
                var meshList = new List<CompressedList<uint>>();
                var meshCount = vhvFile.GetMeshCount( 0 );

                for ( var j = 0; j < meshCount; ++j )
                {
                    var vertices = new CompressedList<uint>();
                    var samples = vhvFile.GetSamples( 0, j );

                    vertices.AddRange( samples.Select( x => ((uint) x.A << 24) | ((uint) x.B << 16) | ((uint) x.G << 8) | x.R) );

                    meshList.Add( vertices );
                }

                page.Props.Add( meshList );
            }

            return page;
        }
    }
}
