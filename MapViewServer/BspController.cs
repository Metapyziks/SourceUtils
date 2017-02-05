using System;
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
        private const uint MajorVersion = 0x0100;

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
            private struct Vertex : IEquatable<Vertex>
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
            }

            private readonly List<Vertex> _vertices = new List<Vertex>();
            private readonly List<int> _indices = new List<int>();
            private readonly Dictionary<Vertex, int> _indexMap = new Dictionary<Vertex, int>();

            public JToken GetVertices( BspController controller )
            {
                return controller.SerializeArray( _vertices,
                    vertex => $"{vertex.Position.X},{vertex.Position.Y},{vertex.Position.Z}" );
            }

            public JToken GetNormals( BspController controller )
            {
                return controller.SerializeArray( _vertices,
                    vertex => $"{-vertex.Normal.X},{-vertex.Normal.Y},{-vertex.Normal.Z}" );
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
            }

            public int IndexCount => _indices.Count;

            public void Add( Vector3 pos, Vector3 normal )
            {
                var vertex = new Vertex( pos, normal );

                int index;
                if ( !_indexMap.TryGetValue( vertex, out index ) )
                {
                    index = _vertices.Count;
                    _vertices.Add( vertex );
                    _indexMap.Add( vertex, index );
                }

                _indices.Add( index );
            }
        }

        public enum FaceType
        {
            TriangleList,
            TriangleStrip,
            TriangleFan
        }

        public static JToken SerializeFace( ValveBspFile bsp, int index, VertexArray verts )
        {
            const SurfFlags ignoreFlags = SurfFlags.NODRAW | SurfFlags.SKIP | SurfFlags.SKY | SurfFlags.SKY2D | SurfFlags.HINT | SurfFlags.TRIGGER;

            var face = bsp.FacesHdr[index];
            var texInfo = bsp.TextureInfos[face.TexInfo];
            var plane = bsp.Planes[face.PlaneNum];

            if ( (texInfo.Flags & ignoreFlags) != 0 || texInfo.TexData < 0 ) return null;

            var offset = verts.IndexCount;

            for ( var surfIndex = face.FirstEdge; surfIndex < face.FirstEdge + face.NumEdges; ++surfIndex )
            {
                var surfEdge = bsp.SurfEdges[surfIndex];
                var edgeIndex = Math.Abs( surfEdge );
                var edge = bsp.Edges[edgeIndex];
                var vert = bsp.Vertices[surfEdge >= 0 ? edge.A : edge.B];

                verts.Add( vert, plane.Normal );
            }

            return new JObject
            {
                { "type", (int) FaceType.TriangleFan },
                { "offset", offset },
                { "count", verts.IndexCount - offset }
            };
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

        [Get( "/{mapName}" ), ApiVersion( MajorVersion | 0x01 )]
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

        [Get( "/{mapName}/view" ), ApiVersion( MajorVersion | 0x01 )]
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

        [Get( "/{mapName}/faces" ), ApiVersion( MajorVersion | 0x03 )]
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

                    var faceArr = new JArray();

                    for ( var i = from; i < from + count; ++i )
                    {
                        var index = bsp.LeafFaces[i];
                        var face = SerializeFace( bsp, index, vertArray );
                        if ( face != null ) faceArr.Add( face );
                    }

                    rangesArray.Add( new JObject
                    {
                        {"from", from},
                        {"count", count},
                        {"faces", faceArr},
                        {"vertices", vertArray.GetVertices( this )},
                        {"normals", vertArray.GetNormals( this )},
                        {"indices", vertArray.GetIndices( this )}
                    } );
                }
            }

            return new JObject
            {
                {"ranges", rangesArray}
            };
        }

        [Get( "/{mapName}/model" ), ApiVersion( MajorVersion | 0x01 )]
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

        [Get( "/{mapName}/visibility" ), ApiVersion( MajorVersion | 0x01 )]
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
