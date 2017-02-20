using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using ImageMagick;
using MimeTypes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using SourceUtils.ValveBsp.Entities;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix( "/bsp" )]
    public class BspController : ResourceController
    {
        protected override string FilePath => "maps/" + Request.Url.AbsolutePath.Split( '/' ).Skip( 2 ).FirstOrDefault();

        private static string GetMapPath( string mapName )
        {
            if ( !mapName.EndsWith( ".bsp" ) ) mapName = $"{mapName}.bsp";

            return Path.Combine( Program.CsgoDirectory, "maps", mapName );
        }

        private static readonly Dictionary<string, ValveBspFile> _sBspCache =
            new Dictionary<string, ValveBspFile>( StringComparer.InvariantCultureIgnoreCase );

        public static ValveBspFile GetBspFile( HttpListenerRequest request, string mapName )
        {
            ValveBspFile bsp;
            if ( _sBspCache.TryGetValue( mapName, out bsp ) ) return bsp;

            var path = GetMapPath( mapName );
            if ( !File.Exists( path ) )
                throw new ControllerActionException( request, true, HttpStatusCode.NotFound,
                    "The requested resource was not found." );

            bsp = new ValveBspFile( File.Open( path, FileMode.Open, FileAccess.Read, FileShare.Read ), mapName );
            _sBspCache.Add( mapName, bsp );

            return bsp;
        }

        private static JToken SerializeBspChild( ValveBspFile bsp, BspChild child )
        {
            return child.IsLeaf ? SerializeBspLeaf( bsp, child.Index ) : SerializeBspNode( bsp, child.Index );
        }

        private static JToken SerializeBspNode( ValveBspFile bsp, int index )
        {
            var node = bsp.Nodes[index];
            var plane = bsp.Planes[node.PlaneNum];

            return new JObject
            {
                {"plane", plane.ToJson()},
                {"min", node.Min.ToJson()},
                {"max", node.Max.ToJson()},
                {
                    "children", new JArray
                    {
                        SerializeBspChild( bsp, node.ChildA ),
                        SerializeBspChild( bsp, node.ChildB )
                    }
                }
            };
        }

        public static JToken SerializeBspLeaf( ValveBspFile bsp, int index )
        {
            var leaf = bsp.Leaves[index];

            var response = new JObject
            {
                {"index", index},
                {"min", leaf.Min.ToJson()},
                {"max", leaf.Max.ToJson()},
                {"area", leaf.AreaFlags.Area},
                {"hasFaces", leaf.NumLeafFaces > 0}
            };

            if ( leaf.Cluster != -1 )
            {
                response.Add( "cluster", leaf.Cluster );
            }

            return response;
        }

        public class VertexArray
        {
            private struct Vertex : IEquatable<Vertex>, IEnumerable<float>
            {
                public readonly Vector3 Position;
                public readonly Vector2 TexCoord;
                public readonly Vector2 LightmapCoord;

                public Vertex( Vector3 position, Vector2 texCoord, Vector2 lightmapCoord )
                {
                    Position = position;
                    TexCoord = texCoord;
                    LightmapCoord = lightmapCoord;
                }

                public bool Equals( Vertex other )
                {
                    return Position.Equals( other.Position )
                           && TexCoord.Equals( other.TexCoord )
                           && TexCoord.Equals( other.LightmapCoord );
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

                IEnumerator IEnumerable.GetEnumerator()
                {
                    return GetEnumerator();
                }

                public IEnumerator<float> GetEnumerator()
                {
                    yield return Position.X;
                    yield return Position.Y;
                    yield return Position.Z;

                    yield return TexCoord.X;
                    yield return TexCoord.Y;

                    yield return LightmapCoord.X;
                    yield return LightmapCoord.Y;
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
                        {"offset", Offset},
                        {"count", Count}
                    };
                }
            }

            private readonly List<float> _vertices = new List<float>();
            private readonly List<int> _indices = new List<int>();
            private readonly Dictionary<Vertex, int> _indexMap = new Dictionary<Vertex, int>();
            private readonly List<int> _curPrimitive = new List<int>();
            private readonly List<Element> _elements = new List<Element>();

            private int _vertexCount;

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

            public JToken GetVertices( BspController controller )
            {
                return controller.SerializeArray( _vertices );
            }

            public JToken GetIndices( BspController controller )
            {
                return controller.SerializeArray( _elements
                    .SelectMany( x => Enumerable.Range( x.Offset, x.Count )
                        .Select( y => _indices[y] ) ) );
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

            public void AddVertex( Vector3 pos, Vector2 uv, Vector2 uv2 )
            {
                var vertex = new Vertex( pos, uv, uv2 );

                int index;
                if ( !_indexMap.TryGetValue( vertex, out index ) )
                {
                    index = _vertexCount++;
                    _vertices.AddRange( vertex );
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

        [ThreadStatic] private static List<int> _sIndicesBuffer;

        private static void SerializeDisplacement( ValveBspFile bsp, int faceIndex, ref Face face, ref Plane plane,
            VertexArray verts )
        {
            if ( face.NumEdges != 4 )
            {
                throw new Exception( "Expected displacement to have 4 edges." );
            }

            var disp = bsp.DisplacementManager[face.DispInfo];
            var texInfo = bsp.TextureInfos[face.TexInfo];

            var texData = bsp.TextureData[texInfo.TexData];
            var texScale = new Vector2( 1f / texData.Width, 1f / texData.Height );

            Vector3 c0, c1, c2, c3;
            disp.GetCorners( out c0, out c1, out c2, out c3 );

            var uv00 = GetUv( c0, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
            var uv10 = GetUv( c3, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
            var uv01 = GetUv( c1, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
            var uv11 = GetUv( c2, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;

            for ( var y = 0; y < disp.Subdivisions; ++y )
            {
                verts.BeginPrimitive();
                var v0 = (y + 0) / (float) disp.Subdivisions;
                var v1 = (y + 1) / (float) disp.Subdivisions;

                for ( var x = 0; x < disp.Size; ++x )
                {
                    var u = x / (float) disp.Subdivisions;

                    var p0 = disp.GetPosition( x, y + 0 );
                    var p1 = disp.GetPosition( x, y + 1 );

                    var uv0 = (uv00 * (1f - u) + uv10 * u) * (1f - v0) + (uv01 * (1f - u) + uv11 * u) * v0;
                    var uv1 = (uv00 * (1f - u) + uv10 * u) * (1f - v1) + (uv01 * (1f - u) + uv11 * u) * v1;

                    verts.AddVertex( p0, uv0,
                        GetLightmapUv( bsp, x, y + 0, disp.Subdivisions, faceIndex, ref face ) );
                    verts.AddVertex( p1, uv1,
                        GetLightmapUv( bsp, x, y + 1, disp.Subdivisions, faceIndex, ref face ) );
                }

                verts.CommitPrimitive( PrimitiveType.TriangleStrip, texData.NameStringTableId );
            }
        }

        private static Vector2 GetUv( Vector3 pos, TexAxis uAxis, TexAxis vAxis )
        {
            return new Vector2(
                pos.Dot( uAxis.Normal ) + uAxis.Offset,
                pos.Dot( vAxis.Normal ) + vAxis.Offset );
        }

        private static Vector2 GetLightmapUv( ValveBspFile bsp, Vector3 pos, int faceIndex, ref Face face,
            ref TextureInfo texInfo )
        {
            var lightmapUv = GetUv( pos, texInfo.LightmapUAxis, texInfo.LightmapVAxis );

            Vector2 min, size;
            bsp.LightmapLayout.GetUvs( faceIndex, out min, out size );

            lightmapUv.X -= face.LightMapOffsetX - .5f;
            lightmapUv.Y -= face.LightMapOffsetY - .5f;
            lightmapUv.X /= face.LightMapSizeX + 1f;
            lightmapUv.Y /= face.LightMapSizeY + 1f;

            lightmapUv.X *= size.X;
            lightmapUv.Y *= size.Y;
            lightmapUv.X += min.X;
            lightmapUv.Y += min.Y;

            return lightmapUv;
        }

        private static Vector2 GetLightmapUv( ValveBspFile bsp, int x, int y, int dispSize, int faceIndex, ref Face face )
        {
            var lightmapUv = new Vector2( (float) x / dispSize, (float) y / dispSize );

            Vector2 min, size;
            bsp.LightmapLayout.GetUvs( faceIndex, out min, out size );

            return lightmapUv * size + min;
        }

        private static void SerializeFace( ValveBspFile bsp, int index, VertexArray verts )
        {
            const SurfFlags ignoreFlags = SurfFlags.NODRAW;
            const SurfFlags skyFlags = SurfFlags.SKY2D | SurfFlags.SKY;

            var face = bsp.FacesHdr[index];
            var texInfo = bsp.TextureInfos[face.TexInfo];
            var plane = bsp.Planes[face.PlaneNum];
            
            if ( (texInfo.Flags & ignoreFlags) != 0 || texInfo.TexData < 0 ) return;
            var isSky = (texInfo.Flags & skyFlags) != 0;

            if ( face.DispInfo != -1 )
            {
                SerializeDisplacement( bsp, index, ref face, ref plane, verts );
                return;
            }

            var texData = bsp.TextureData[texInfo.TexData];
            var texScale = new Vector2( 1f / texData.Width, 1f / texData.Height );

            verts.BeginPrimitive();

            for ( int i = face.FirstEdge, iEnd = face.FirstEdge + face.NumEdges; i < iEnd; ++i )
            {
                var vert = bsp.GetVertexFromSurfEdgeId( i );
                var uv = GetUv( vert, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
                var uv2 = GetLightmapUv( bsp, vert, index, ref face, ref texInfo );

                verts.AddVertex( vert, uv, uv2 );
            }

            var numPrimitives = face.NumPrimitives & 0x7fff;
            var texStringIndex = isSky ? -1 : texData.NameStringTableId;

            if ( numPrimitives == 0 )
            {
                verts.CommitPrimitive( PrimitiveType.TriangleFan, texStringIndex );
                return;
            }

            if ( _sIndicesBuffer == null ) _sIndicesBuffer = new List<int>();

            for ( int i = face.FirstPrimitive, iEnd = face.FirstPrimitive + numPrimitives; i < iEnd; ++i )
            {
                var primitive = bsp.Primitives[i];
                for ( int j = primitive.FirstIndex, jEnd = primitive.FirstIndex + primitive.IndexCount; j < jEnd; ++j )
                {
                    _sIndicesBuffer.Add( bsp.PrimitiveIndices[j] );
                }

                verts.CommitPrimitive( primitive.Type, texStringIndex, _sIndicesBuffer );
                _sIndicesBuffer.Clear();
            }
        }

        private bool CheckNotExpired( string mapName )
        {
            var path = GetMapPath( mapName );
            var mapInfo = new FileInfo( path );
            var lastModified = mapInfo.LastWriteTimeUtc;

            Response.Headers.Add( "Cache-Control", "public, max-age=31556736" );
            Response.Headers.Add( "Last-Modified", lastModified.ToString( "R" ) );

            var header = Request.Headers["If-Modified-Since"];
            DateTime result;
            if ( header != null &&
                 DateTime.TryParseExact( header, "R", CultureInfo.InvariantCulture.DateTimeFormat,
                     DateTimeStyles.AdjustToUniversal, out result ) && result < lastModified )
            {
                Response.StatusCode = 304;
                Response.OutputStream.Close();
                return true;
            }

            return false;
        }

        private JToken GetSkyMaterial( ValveBspFile bsp, string skyName )
        {
            var postfixes = new[]
            {
                 "ft", "bk", "dn", "up", "rt", "lf"
            };
            
            var propArray = new JArray();
            var faceUrls = new string[6];

            var i = 0;
            foreach ( var postfix in postfixes )
            {
                var matName = $"materials/skybox/{skyName}{postfix}.vmt";
                var matDir = Path.GetDirectoryName( matName );
                var vmt = OpenVmt( bsp, matName );
                var shaderProps = vmt[vmt.Shaders.FirstOrDefault()];
                var baseTex = shaderProps["$hdrcompressedtexture"] ?? shaderProps["$basetexture"];
                faceUrls[i++] = GetTextureUrl( bsp, baseTex, matDir );
            }

            AddTextureCubeProperty( propArray, "baseTexture", faceUrls );

            return new JObject
            {
                {"shader", "Sky"},
                {"properties", propArray}
            };
        }

        private JToken SerializeFuncBrush( FuncBrush ent )
        {
            return new JObject
            {
                {"classname", ent.ClassName},
                {"origin", ent.Origin.ToJson()},
                {"angles", ent.Angles.ToJson()},
                {"model", int.Parse( ent.Model.Substring( 1 ) )}
            };
        }
        
        [Get( "/{mapName}" )]
        public JToken GetIndex( [Url] string mapName )
        {
            var bsp = GetBspFile( Request, mapName );
            var skyName = bsp.Entities.GetFirst<WorldSpawn>().SkyName;
            var fogInfo = bsp.Entities.GetFirst<EnvFogController>();
            var skyInfo = bsp.Entities.GetFirst<SkyCamera>();

            var fogData = new JObject
            {
                {"enabled", fogInfo != null && fogInfo.FogEnable}
            };

            if ( fogInfo != null && fogInfo.FogEnable )
            {
                fogData.Add( "start", fogInfo.FogStart );
                fogData.Add( "end", fogInfo.FogEnd );
                fogData.Add( "maxDensity", fogInfo.FogMaxDensity );
                fogData.Add( "farZ", fogInfo.FarZ );
                fogData.Add( "color", fogInfo.FogColor.ToJson() );
            }

            var skyData = new JObject
            {
                {"enabled", skyInfo != null }
            };

            if ( skyInfo != null )
            {
                skyData.Add( "origin", skyInfo.Origin.ToJson() );
                skyData.Add( "scale", skyInfo.Scale );
            }

            return new JObject
            {
                {"name", mapName},
                {"skyMaterial", GetSkyMaterial( bsp, skyName )},
                {"fog", fogData},
                {"skyCamera", skyData},
                {"playerStarts", new JArray( bsp.Entities.OfType<InfoPlayerStart>().Select( x => x.Origin.ToJson() ) )},
                {"numClusters", bsp.Visibility.NumClusters},
                {"numModels", bsp.Models.Length},
                {"brushEnts", new JArray( bsp.Entities.OfType<FuncBrush>().Where(x => x.Model != null).Select( SerializeFuncBrush )) },
                {"modelUrl", GetActionUrl( nameof( GetModels ), Replace( "mapName", mapName ) )},
                {"displacementsUrl", GetActionUrl( nameof( GetDisplacements ), Replace( "mapName", mapName ) )},
                {"facesUrl", GetActionUrl( nameof( GetFaces ), Replace( "mapName", mapName ) )},
                {"visibilityUrl", GetActionUrl( nameof( GetVisibility ), Replace( "mapName", mapName ) )},
                {"lightmapUrl", GetActionUrl( nameof( GetLightmap ), Replace( "mapName", mapName ) )},
                {"materialsUrl", GetActionUrl( nameof( GetMaterials ), Replace( "mapName", mapName ) )}
            };
        }

        [Get( "/{mapName}/view" )]
        public HtmlElement GetViewer( [Url] string mapName )
        {
            const string elemId = "map-view";

            return new div
            {
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/three.js/84/three.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/base64-string.min.js" ),
                new script( src => GetScriptUrl( "main.js" ) ),
                new link( rel => "stylesheet", type => "text/css", href => GetResourceUrl( "mapviewer.css" ) ),
                new script
                {
                    $@"
                    var main = new SourceUtils.MapViewer();
                    window.onload = function () {{
                        main.init($(""#{elemId}""));
                        main.loadMap(""{GetActionUrl( nameof( GetIndex ), Replace( "mapName", mapName ) )}"");
                        main.animate();
                    }}
                    "
                },
                new div( id => elemId ),
                new code( style => "display: block; white-space: pre-wrap" )
                {
                    GetIndex( mapName ).ToString()
                }
            };
        }

        private enum FacesType
        {
            Leaf,
            Displacement
        }

        [Flags]
        private enum MeshComponent
        {
            Position = 1,
            Normal = 2,
            Uv = 4,
            Uv2 = 8
        }

        private struct FacesRequest
        {
            public readonly FacesType Type;
            public readonly int Index;

            public FacesRequest( string str )
            {
                switch ( str[0] )
                {
                    case 'l':
                        Type = FacesType.Leaf;
                        break;
                    case 'd':
                        Type = FacesType.Displacement;
                        break;
                    default:
                        throw new NotImplementedException();
                }

                Index = int.Parse( str.Substring( 1 ) );

                if ( Type == FacesType.Leaf )
                {
                    _sSentLeaves.Add( Index );
                }
            }

            public IEnumerable<int> GetFaceIndices( ValveBspFile bsp )
            {
                switch ( Type )
                {
                    case FacesType.Leaf:
                    {
                        var leaf = bsp.Leaves[Index];
                        for ( int i = leaf.FirstLeafFace, iEnd = leaf.FirstLeafFace + leaf.NumLeafFaces; i < iEnd; ++i )
                        {
                            yield return bsp.LeafFaces[i];
                        }

                        yield break;
                    }
                    case FacesType.Displacement:
                    {
                        yield return bsp.DisplacementInfos[Index].MapFace;
                        yield break;
                    }
                }
            }
        }

        private static readonly Regex _sFaceRequestsRegex = new Regex( @"^(?<item>[ld][0-9]+)(\s+(?<item>[ld][0-9]+))*$" );

        private static readonly HashSet<int> _sSentLeaves = new HashSet<int>();

        [Get( "/{mapName}/faces" )]
        public JToken GetFaces( [Url] string mapName, string tokens )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var match = _sFaceRequestsRegex.Match( tokens );
            if ( !match.Success ) throw BadParameterException( nameof( tokens ) );

            var array = new JArray();
            var vertArray = new VertexArray();

            var bsp = GetBspFile( Request, mapName );
            foreach ( var token in match.Groups["item"].Captures
                .Cast<Capture>()
                .Select( x => x.Value ) )
            {
                var request = new FacesRequest( token );
                vertArray.Clear();

                foreach ( var faceIndex in request.GetFaceIndices( bsp ) )
                {
                    SerializeFace( bsp, faceIndex, vertArray );
                }

                array.Add( new JObject
                {
                    {"components", (int) (MeshComponent.Position | MeshComponent.Uv | MeshComponent.Uv2)},
                    {"elements", vertArray.GetElements()},
                    {"vertices", vertArray.GetVertices( this )},
                    {"indices", vertArray.GetIndices( this )}
                } );
            }

            return new JObject
            {
                {"facesList", array}
            };
        }

        [Get( "/{mapName}/model" )]
        public JToken GetModels( [Url] string mapName, int index )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var response = new JObject();
            
            var bsp = GetBspFile( Request, mapName );
            var model = bsp.Models[index];
            var tree = SerializeBspNode( bsp, model.HeadNode );

            response.Add( "index", index );
            response.Add( "min", model.Min.ToJson() );
            response.Add( "max", model.Max.ToJson() );
            response.Add( "origin", model.Origin.ToJson() );
            response.Add( "tree", Compressed ? LZString.compressToBase64( tree.ToString( Formatting.None ) ) : tree );

            return response;
        }

        private static void AddToBounds( ref Vector3 min, ref Vector3 max, Vector3 pos )
        {
            if ( pos.X < min.X ) min.X = pos.X;
            if ( pos.Y < min.Y ) min.Y = pos.Y;
            if ( pos.Z < min.Z ) min.Z = pos.Z;

            if ( pos.X > max.X ) max.X = pos.X;
            if ( pos.Y > max.Y ) max.Y = pos.Y;
            if ( pos.Z > max.Z ) max.Z = pos.Z;
        }

        private static void GetDisplacementBounds( ValveBspFile bsp, int index,
            out Vector3 min, out Vector3 max, float bias = 0f )
        {
            min = new Vector3( float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity );
            max = new Vector3( float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity );

            var disp = bsp.DisplacementManager[index];
            var biasVec = disp.Normal * bias;

            for ( var y = 0; y < disp.Size; ++y )
            for ( var x = 0; x < disp.Size; ++x )
            {
                var pos = disp.GetPosition( x, y );

                AddToBounds( ref min, ref max, pos - biasVec );
                AddToBounds( ref min, ref max, pos + biasVec );
            }
        }

        [Get( "/{mapName}/displacements" )]
        public JToken GetDisplacements( [Url] string mapName )
        {
            var foundLeaves = new List<BspTree.Leaf>();
            
            var bsp = GetBspFile( Request, mapName );
            var tree = new BspTree( bsp, 0 );
            var displacements = new JArray();

            foreach ( var dispInfo in bsp.DisplacementInfos )
            {
                var face = bsp.FacesHdr[dispInfo.MapFace];

                Vector3 min, max;
                GetDisplacementBounds( bsp, face.DispInfo, out min, out max, 1f );

                foundLeaves.Clear();
                tree.GetIntersectingLeaves( min, max, foundLeaves );

                var clusters = new JArray();

                foreach ( var leaf in foundLeaves )
                {
                    clusters.Add( leaf.Info.Cluster );
                }

                displacements.Add( new JObject
                {
                    {"index", face.DispInfo},
                    {"power", dispInfo.Power},
                    {"min", min.ToJson()},
                    {"max", max.ToJson()},
                    {"clusters", clusters}
                } );
            }

            return new JObject
            {
                {"displacements", displacements}
            };
        }

        [Get( "/{mapName}/lightmap" )]
        public void GetLightmap( [Url] string mapName )
        {
            Response.ContentType = MimeTypeMap.GetMimeType( ".png" );

            if ( CheckNotExpired( mapName ) ) return;
            
            var bsp = GetBspFile( Request, mapName );

            using ( var sampleStream = bsp.GetLumpStream( ValveBspFile.LumpType.LIGHTING_HDR ) )
            {
                var lightmap = bsp.LightmapLayout;
                var width = lightmap.TextureSize.X;
                var height = lightmap.TextureSize.Y;

                var pixels = new byte[width * height * 3];

                var sampleBuffer = new LightmapSample[256 * 256];

                for ( int i = 0, iEnd = bsp.FacesHdr.Length; i < iEnd; ++i )
                {
                    var face = bsp.FacesHdr[i];
                    if ( face.LightOffset == -1 ) continue;

                    var rect = lightmap.GetLightmapRegion( i );
                    var sampleCount = rect.Width * rect.Height;

                    sampleStream.Seek( face.LightOffset, SeekOrigin.Begin );

                    LumpReader<LightmapSample>.ReadLumpFromStream( sampleStream, sampleCount, sampleBuffer );

                    for ( var y = -1; y < rect.Height + 1; ++y )
                    for ( var x = -1; x < rect.Width + 1; ++x )
                    {
                        var s = Math.Max( 0, Math.Min( x, rect.Width - 1 ) );
                        var t = Math.Max( 0, Math.Min( y, rect.Height - 1 ) );

                        var index = (rect.X + x + width * (rect.Y + y)) * 3;
                        var sampleIndex = s + t * rect.Width;

                        sampleBuffer[sampleIndex].ToRgb(
                            out pixels[index + 0],
                            out pixels[index + 1],
                            out pixels[index + 2] );
                    }
                }

                var img = new MagickImage( pixels, new MagickReadSettings
                {
                    Width = width,
                    Height = height,
                    PixelStorage = new PixelStorageSettings
                    {
                        Mapping = "RGB",
                        StorageType = StorageType.Char
                    }
                } );

                img.Write( Response.OutputStream, MagickFormat.Png );
                Response.OutputStream.Close();
            }
        }

        [Get( "/{mapName}/visibility" )]
        public JToken GetVisibility( [Url] string mapName, int index )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var bsp = GetBspFile( Request, mapName );

            return new JObject
            {
                {"index", index},
                { "pvs", SerializeArray( bsp.Visibility[index] )}
            };
        }

        private IEnumerable<string> GetTexturePathVariants( string filePath, string vmtDir )
        {
            filePath = filePath.Replace( '\\', '/' ).ToLower();

            var ext = Path.GetExtension( filePath );
            if ( string.IsNullOrEmpty( ext ) ) filePath += ".vtf";

            if ( !filePath.Contains( '/' ) )
            {
                if ( string.IsNullOrEmpty( vmtDir ) ) yield return filePath;
                else yield return $"{vmtDir}/{filePath}";
            }
            else if ( !filePath.StartsWith( "materials" ) )
            {
                yield return $"materials/{filePath}";
            }
            else
            {
                yield return filePath;
            }
        }

        private string GetTextureUrl( ValveBspFile bsp, string filePath, string vmtDir )
        {
            filePath = filePath.Replace( '\\', '/' );

            foreach ( var variant in GetTexturePathVariants( filePath, vmtDir ) )
            {
                if ( bsp.PakFile.ContainsFile( variant ) ) return VtfController.GetUrl( Request, variant, bsp.Name );
                if ( Resources.ContainsFile( variant ) ) return VtfController.GetUrl( Request, variant );
            }

            return null;
        }

        private enum MaterialPropertyType
        {
            Boolean,
            Number,
            Texture2D,
            TextureCube
        }

        private static void AddProperty( JArray properties, string name, MaterialPropertyType type, JToken value )
        {
            var existing = properties.FirstOrDefault( x => (string) x["name"] == name );
            if ( existing != null )
            {
                existing["type"] = (int) type;
                existing["value"] = value;
                return;
            }

            properties.Add( new JObject {{"name", name}, {"type", (int) type}, {"value", value}} );
        }

        private void AddBooleanProperty( JArray properties, string name, bool value )
        {
            AddProperty( properties, name, MaterialPropertyType.Boolean, value );
        }

        private void AddNumberProperty( JArray properties, string name, float value )
        {
            AddProperty( properties, name, MaterialPropertyType.Number, value );
        }

        private void AddTexture2DProperty( JArray properties, string name, string vtfUrl )
        {
            AddProperty( properties, name, MaterialPropertyType.Texture2D, vtfUrl );
        }

        private void AddTextureCubeProperty( JArray properties, string name, string[] vtfUrls )
        {
            if ( vtfUrls.Length != 6 ) throw new ArgumentException( "Expected 6 cubemap faces.", nameof( vtfUrls ) );
            AddProperty( properties, name, MaterialPropertyType.TextureCube, new JArray( vtfUrls ) );
        }

        private void SerializeShaderProperties( ValveBspFile bsp, ValveMaterialFile vmt, string shaderName, string vmtDir, JArray destArray )
        {
            if ( !vmt.ContainsShader( shaderName ) ) shaderName = vmt.Shaders.FirstOrDefault();

            var props = vmt[shaderName];
            foreach ( var name in props.PropertyNames )
            {
                switch ( name.ToLower() )
                {
                    case "include":
                    {
                        var includePath = props[name];
                        var includeDir = Path.GetDirectoryName( includePath );
                        var includeVmt = OpenVmt( bsp, includePath );
                        SerializeShaderProperties( bsp, includeVmt, shaderName, includeDir, destArray );
                        break;
                    }
                    case "$basetexture":
                        AddTexture2DProperty( destArray, "baseTexture", GetTextureUrl( bsp, props[name], vmtDir ) );
                        break;
                    case "$alphatest":
                        AddBooleanProperty( destArray, "alphaTest", props.GetBoolean( name ) );
                        break;
                    case "$alpha":
                        AddNumberProperty( destArray, "alpha", props.GetSingle( name ) );
                        break;
                    case "$nocull":
                        AddBooleanProperty( destArray, "noCull", props.GetBoolean( name ) );
                        break;
                }
            }
        }

        private JToken SerializeVmt( ValveBspFile bsp, ValveMaterialFile vmt, string path )
        {
            var shader = vmt.Shaders.FirstOrDefault();
            if ( shader == null ) return null;

            var propArray = new JArray();
            var vmtDir = Path.GetDirectoryName( path ).Replace( '\\', '/' );

            SerializeShaderProperties( bsp, vmt, shader, vmtDir, propArray );

            var shaderName = "LightmappedGeneric";
            if ( vmt[shader].GetBoolean( "$translucent" ) )
            {
                shaderName = "LightmappedTranslucent";
            }

            return new JObject
            {
                {"shader", shaderName},
                {"properties", propArray}
            };
        }

        private ValveMaterialFile OpenVmt( ValveBspFile bsp, string name )
        {
            if (!name.StartsWith( "materials/" )) name = $"materials/{name}.vmt";
            IResourceProvider provider;

            if ( bsp.PakFile.ContainsFile( name ) )
            {
                provider = bsp.PakFile;
            }
            else if ( Resources.ContainsFile( name ) )
            {
                provider = Resources;
            }
            else return null;

            using ( var vmtStream = provider.OpenFile( name ) )
            {
                return new ValveMaterialFile( vmtStream );
            }
        }

        [Get( "/{mapName}/materials" )]
        public JToken GetMaterials( [Url] string mapName )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var response = new JArray();
            
            var bsp = GetBspFile( Request, mapName );
            for ( var i = 0; i < bsp.TextureStringTable.Length; ++i )
            {
                var path = $"materials/{bsp.GetTextureString( i ).ToLower()}.vmt";
                var vmt = OpenVmt( bsp, path );
                response.Add( vmt == null ? null : SerializeVmt( bsp, vmt, path ) );
            }

            return new JObject
            {
                {"materials", response}
            };
        }

        [Get("/{mapName}/entity-test")]
        public JToken GetEntityTest( [Url] string mapName )
        {
            var response = new JArray();
            
            var bsp = GetBspFile( Request, mapName );

            foreach ( var ent in bsp.Entities )
            {
                var obj = new JObject();

                foreach ( var propName in ent.PropertyNames )
                {
                    obj.Add( propName, ent.GetRawPropertyValue( propName ) );
                }

                response.Add( obj );
            }

            return new JObject
            {
                {"entities", response}
            };
        }
    }
}
