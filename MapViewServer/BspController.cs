using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix("/bsp")]
    public class BspController : ResourceController
    {
        private const uint ApiVersion = 0x0208;

        protected override string FilePath => "maps/" + Request.Url.AbsolutePath.Split( '/' ).Skip( 2 ).FirstOrDefault();

        private static string GetMapPath( string mapName )
        {
            if ( !mapName.EndsWith( ".bsp" ) ) mapName = $"{mapName}.bsp";

            return Path.Combine( Program.CsgoDirectory, "maps", mapName );
        }

        private ValveBspFile OpenBspFile( string mapName )
        {
            var path = GetMapPath( mapName );
            if ( !File.Exists( path ) ) throw NotFoundException( true );

            return new ValveBspFile( File.Open( path, FileMode.Open, FileAccess.Read, FileShare.Read ) );
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
                { "plane", plane.ToJson() },
                { "min", node.Min.ToJson() },
                { "max", node.Max.ToJson() },
                { "children", new JArray {
                    SerializeBspChild( bsp, node.ChildA ),
                    SerializeBspChild( bsp, node.ChildB )
                } }
            };
        }

        public static JToken SerializeBspLeaf( ValveBspFile bsp, int index )
        {
            var leaf = bsp.Leaves[index];
            
            var response = new JObject
            {
                { "min", leaf.Min.ToJson() },
                { "max", leaf.Max.ToJson() },
                { "area", leaf.AreaFlags.Area }
            };

            if ( leaf.Cluster != -1 )
            {
                response.Add( "cluster", leaf.Cluster );
            }

            if ( leaf.NumLeafBrushes > 0 )
            {
                response.Add( "firstBrush", leaf.FirstLeafBrush );
                response.Add( "numBrushes", leaf.NumLeafBrushes );
            }

            if ( leaf.NumLeafFaces > 0 )
            {
                response.Add( "firstFace", leaf.FirstLeafFace );
                response.Add( "numFaces", leaf.NumLeafFaces );
            }

            return response;
        }

        public class VertexArray
        {
            private struct Vertex : IEquatable<Vertex>, IEnumerable<float>
            {
                public readonly Vector3 Position;
                public readonly Vector3 Normal;

                public Vertex( Vector3 position, Vector3 normal )
                {
                    Position = position;
                    Normal = normal;
                }

                public bool Equals( Vertex other )
                {
                    return Position.Equals( other.Position ) && Normal.Equals( other.Normal );
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
                    
                    yield return Normal.X;
                    yield return Normal.Y;
                    yield return Normal.Z;
                }
            }

            private readonly List<float> _vertices = new List<float>();
            private readonly List<int> _indices = new List<int>();
            private readonly Dictionary<Vertex, int> _indexMap = new Dictionary<Vertex, int>();
            private readonly List<int> _curPrimitive = new List<int>();

            private PrimitiveType _primitiveType;
            private int _vertexCount;

            public JToken GetVertices( BspController controller )
            {
                return controller.SerializeArray( _vertices );
            }

            public JToken GetIndices( BspController controller )
            {
                return controller.SerializeArray( _indices );
            }

            public void Clear()
            {
                _vertices.Clear();
                _indices.Clear();
                _indexMap.Clear();
                _curPrimitive.Clear();

                _vertexCount = 0;
                _primitiveType = PrimitiveType.TriangleList;
            }

            public int IndexCount => _indices.Count;

            public void Add( Vector3 pos, Vector3 normal )
            {
                var vertex = new Vertex( pos, normal );

                int index;
                if ( !_indexMap.TryGetValue( vertex, out index ) )
                {
                    index = _vertexCount++;
                    _vertices.AddRange( vertex );
                    _indexMap.Add( vertex, index );
                }

                _curPrimitive.Add( index );
            }

            public int BeginPrimitive(PrimitiveType type)
            {
                _primitiveType = type;
                _curPrimitive.Clear();

                return IndexCount;
            }

            private IEnumerable<int> GetTriangleListIndices()
            {
                return _curPrimitive;
            }

            private IEnumerable<int> GetTriangleFanIndices()
            {
                if (_curPrimitive.Count < 3) yield break;

                var first = _curPrimitive[0];
                var prev = _curPrimitive[1];

                for ( int i = 2, count = _curPrimitive.Count; i < count; ++i )
                {
                    var next = _curPrimitive[i];

                    yield return prev;
                    yield return first;
                    yield return next;

                    prev = next;
                }
            }

            private IEnumerable<int> GetTriangleStripIndices()
            {
                throw new NotImplementedException();
            }

            public int EndPrimitive()
            {
                switch ( _primitiveType )
                {
                    case PrimitiveType.TriangleList:
                        _indices.AddRange( GetTriangleListIndices() );
                        break;
                    case PrimitiveType.TriangleFan:
                        _indices.AddRange( GetTriangleFanIndices() );
                        break;
                    case PrimitiveType.TriangleStrip:
                        _indices.AddRange( GetTriangleStripIndices() );
                        break;
                }

                return _curPrimitive.Count;
            }
        }

        public enum PrimitiveType
        {
            TriangleList,
            TriangleStrip,
            TriangleFan
        }

        private static void SerializeFace( ValveBspFile bsp, int index, VertexArray verts )
        {
            const SurfFlags ignoreFlags = SurfFlags.NODRAW | SurfFlags.SKIP | SurfFlags.SKY | SurfFlags.SKY2D | SurfFlags.HINT | SurfFlags.TRIGGER;

            var face = bsp.FacesHdr[index];
            var texInfo = bsp.TextureInfos[face.TexInfo];
            var plane = bsp.Planes[face.PlaneNum];

            if ( (texInfo.Flags & ignoreFlags) != 0 || texInfo.TexData < 0 ) return;

            verts.BeginPrimitive(PrimitiveType.TriangleFan);

            for ( var i = 0; i < face.NumEdges; ++i )
            {
                var surfEdge = bsp.SurfEdges[face.FirstEdge + i];
                var edgeIndex = Math.Abs( surfEdge );
                var edge = bsp.Edges[edgeIndex];
                var vert = bsp.Vertices[surfEdge >= 0 ? edge.A : edge.B];

                verts.Add( vert, plane.Normal );
            }

            verts.EndPrimitive();
        }
        
        private bool CheckNotExpired( string mapName )
        {
            var path = GetMapPath( mapName );
            var mapInfo = new FileInfo( path );
            var lastModified = mapInfo.LastWriteTimeUtc;

            Response.Headers.Add("Cache-Control", "public, max-age=31556736");
            Response.Headers.Add("Last-Modified", lastModified.ToString("R"));

            var header = Request.Headers["If-Modified-Since"];
            DateTime result;
            if (header != null && DateTime.TryParseExact(header, "R", CultureInfo.InvariantCulture.DateTimeFormat, DateTimeStyles.AdjustToUniversal, out result) && result < lastModified)
            {
                Response.StatusCode = 304;
                Response.OutputStream.Close();
                return true;
            }

            return false;
        }

        [Get( "/{mapName}" ), ApiVersion(ApiVersion)]
        public JToken GetIndex( [Url] string mapName )
        {
            using ( var bsp = OpenBspFile( mapName ) )
            {
                return new JObject
                {
                    {"name", mapName},
                    {"numClusters", bsp.Visibility.NumClusters},
                    {"numModels", bsp.Models.Length},
                    {"modelUrl", GetActionUrl( nameof( GetModels ), Replace( "mapName", mapName ) )},
                    {"facesUrl", GetActionUrl( nameof( GetFaces ), Replace( "mapName", mapName ) )},
                    {"visibilityUrl", GetActionUrl( nameof( GetVisibility ), Replace( "mapName", mapName ) )}
                };
            }
        }

        [Get( "/{mapName}/view" ), ApiVersion(ApiVersion)]
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
                new div( id => elemId, style => "height: 720px" ),
                new code( style => "display: block; white-space: pre-wrap" )
                {
                    GetIndex( mapName ).ToString()
                }
            };
        }

        private static readonly Regex _sRangesRegex = new Regex( @"^(?<range>[0-9]+(\.[0-9]+)?)(\s+(?<range>[0-9]+(\.[0-9]+)?))*$" );

        [Get( "/{mapName}/faces" ), ApiVersion(ApiVersion)]
        public JToken GetFaces( [Url] string mapName, string ranges )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var match = _sRangesRegex.Match( ranges );
            if ( !match.Success ) throw BadParameterException( nameof( ranges ) );

            var rangesArray = new JArray();
            var vertArray = new VertexArray();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                foreach ( var range in match.Groups["range"].Captures
                    .Cast<Capture>()
                    .Select( x => x.Value ))
                {
                    int from, count;
                    var split = range.IndexOf( '.' );
                    if ( split != -1 )
                    {
                        from = int.Parse( range.Substring( 0, split ) );
                        count = int.Parse( range.Substring( split + 1 ) );
                    }
                    else
                    {
                        from = int.Parse( range );
                        count = 1;
                    }

                    vertArray.Clear();

                    var elementsArray = new JArray();

                    for ( var i = from; i < from + count; ++i )
                    {
                        var index = bsp.LeafFaces[i];
                        SerializeFace( bsp, index, vertArray );
                    }

                    elementsArray.Add( new JObject
                    {
                        { "type", (int) PrimitiveType.TriangleList },
                        { "offset", 0 },
                        { "count", vertArray.IndexCount }
                    } );

                    rangesArray.Add( new JObject
                    {
                        {"from", from},
                        {"count", count},
                        {"elements", elementsArray},
                        {"vertices", vertArray.GetVertices( this )},
                        {"indices", vertArray.GetIndices( this )}
                    } );
                }
            }

            return new JObject
            {
                {"ranges", rangesArray}
            };
        }

        [Get( "/{mapName}/model" ), ApiVersion(ApiVersion)]
        public JToken GetModels( [Url] string mapName, int index )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                var model = bsp.Models[index];
                var tree = SerializeBspNode( bsp, model.HeadNode );

                response.Add( "index", index );
                response.Add( "min", model.Min.ToJson() );
                response.Add( "max", model.Max.ToJson() );
                response.Add( "origin", model.Origin.ToJson() );
                response.Add( "tree", Compressed ? LZString.compressToBase64( tree.ToString( Formatting.None ) ) : tree );
            }

            return response;
        }

        [Get( "/{mapName}/visibility" ), ApiVersion(ApiVersion)]
        public JToken GetVisibility( [Url] string mapName, int index )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "index", index );
                response.Add( "pvs", SerializeArray( bsp.Visibility[index] ) );
            }

            return response;
        }
    }
}
