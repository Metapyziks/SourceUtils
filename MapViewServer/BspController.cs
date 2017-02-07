using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Web.UI.WebControls;
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
        private const uint ApiVersion = 0x0213;

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

                    yield return -Normal.X;
                    yield return -Normal.Y;
                    yield return -Normal.Z;
                }
            }

            private readonly List<float> _vertices = new List<float>();
            private readonly List<int> _indices = new List<int>();
            private readonly Dictionary<Vertex, int> _indexMap = new Dictionary<Vertex, int>();
            private readonly List<int> _curPrimitive = new List<int>();

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
            }

            public int IndexCount => _indices.Count;

            public void AddVertex( Vector3 pos, Vector3 normal )
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

            public void CommitPrimitive( PrimitiveType type, IList<int> indices = null )
            {
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
            }
        }

        [ThreadStatic]
        private static List<int> _sIndicesBuffer;

        private static void SerializeDisplacement( ValveBspFile bsp, ref Face face, ref Plane plane, VertexArray verts )
        {
            if ( face.NumEdges != 4 )
            {
                throw new Exception( "Expected displacement to have 4 edges." );
            }

            var disp = new Displacement( bsp, face.DispInfo );

            // TODO: Normals

            for ( var y = 0; y < disp.Size; ++y )
            {
                verts.BeginPrimitive();

                for ( var x = 0; x < disp.Size; ++x )
                {
                    var y0 = disp.GetPosition( x, y + 0 );
                    var y1 = disp.GetPosition( x, y + 1 );

                    verts.AddVertex( y0, plane.Normal );
                    verts.AddVertex( y1, plane.Normal );
                }

                verts.CommitPrimitive( PrimitiveType.TriangleStrip );
            }
        }

        private static void SerializeFace( ValveBspFile bsp, int index, VertexArray verts )
        {
            const SurfFlags ignoreFlags = SurfFlags.NODRAW | SurfFlags.SKY | SurfFlags.SKY2D;

            var face = bsp.FacesHdr[index];
            var texInfo = bsp.TextureInfos[face.TexInfo];
            var plane = bsp.Planes[face.PlaneNum];

            if ( face.DispInfo != -1 )
            {
                SerializeDisplacement( bsp, ref face, ref plane, verts );
                return;
            }

            if ( (texInfo.Flags & ignoreFlags) != 0 || texInfo.TexData < 0 ) return;

            verts.BeginPrimitive();

            for ( int i = face.FirstEdge, iEnd = face.FirstEdge + face.NumEdges; i < iEnd; ++i )
            {
                var vert = bsp.GetVertexFromSurfEdgeId( i );
                var norm = plane.Normal;
                verts.AddVertex( vert, norm );
            }

            var numPrimitives = face.NumPrimitives & 0x7fff;

            if ( numPrimitives == 0 )
            {
                verts.CommitPrimitive( PrimitiveType.TriangleFan );
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

                verts.CommitPrimitive( primitive.Type, _sIndicesBuffer );
                _sIndicesBuffer.Clear();
            }
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

        [Get( "/{mapName}" )]
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
                    {"displacementsUrl", GetActionUrl( nameof( GetDisplacements ), Replace( "mapName", mapName ) )},
                    {"leafFacesUrl", GetActionUrl( nameof( GetLeafFaces ), Replace( "mapName", mapName ) )},
                    {"displacementFacesUrl", GetActionUrl( nameof( GetDisplacementFaces ), Replace( "mapName", mapName ) )},
                    {"visibilityUrl", GetActionUrl( nameof( GetVisibility ), Replace( "mapName", mapName ) )}
                };
            }
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

        private static readonly Regex _sItemsRegex = new Regex( @"^(?<item>[0-9]+)(\s+(?<item>[0-9]+))*$" );

        private JObject GetFaces( string mapName, string indicesString, Func<ValveBspFile, int, IEnumerable<int>> faceSelect )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var match = _sItemsRegex.Match( indicesString );
            if ( !match.Success ) throw BadParameterException( nameof( indicesString ) );

            var array = new JArray();
            var vertArray = new VertexArray();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                foreach ( var itemString in match.Groups["item"].Captures
                    .Cast<Capture>()
                    .Select( x => x.Value ))
                {
                    var itemIndex = int.Parse( itemString );
                    vertArray.Clear();

                    var elementsArray = new JArray();
                    foreach ( var faceIndex in faceSelect(bsp, itemIndex) )
                    {
                        SerializeFace( bsp, faceIndex, vertArray );
                    }

                    elementsArray.Add( new JObject
                    {
                        { "type", (int) PrimitiveType.TriangleList },
                        { "offset", 0 },
                        { "count", vertArray.IndexCount }
                    } );

                    array.Add( new JObject
                    {
                        {"index", itemIndex},
                        {"elements", elementsArray},
                        {"vertices", vertArray.GetVertices( this )},
                        {"indices", vertArray.GetIndices( this )}
                    } );
                }
            }

            return new JObject
            {
                {"facesList", array}
            };
        }

        private static IEnumerable<int> GetLeafFaceIndices( ValveBspFile bsp, int leafIndex )
        {
            var leaf = bsp.Leaves[leafIndex];
            
            for ( int i = leaf.FirstLeafFace, iEnd = leaf.FirstLeafFace + leaf.NumLeafFaces; i < iEnd; ++i )
            {
                yield return bsp.LeafFaces[i];
            }
        }

        [Get( "/{mapName}/leaf-faces" )]
        public JToken GetLeafFaces( [Url] string mapName, string leaves )
        {
            return GetFaces( mapName, leaves, GetLeafFaceIndices );
        }

        private static IEnumerable<int> GetDisplacementFaceIndices( ValveBspFile bsp, int displacementIndex )
        {
            var dispInfo = bsp.DisplacementInfos[displacementIndex];
            yield return dispInfo.MapFace;
        }
        
        [Get( "/{mapName}/displacement-faces" )]
        public JToken GetDisplacementFaces( [Url] string mapName, string displacements )
        {
            return GetFaces( mapName, displacements, GetDisplacementFaceIndices );
        }

        [Get( "/{mapName}/model" )]
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

        private static void AddToBounds( ref Vector3 min, ref Vector3 max, Vector3 pos )
        {
            if ( pos.X < min.X ) min.X = pos.X;
            if ( pos.Y < min.Y ) min.Y = pos.Y;
            if ( pos.Z < min.Z ) min.Z = pos.Z;
            
            if ( pos.X > max.X ) max.X = pos.X;
            if ( pos.Y > max.Y ) max.Y = pos.Y;
            if ( pos.Z > max.Z ) max.Z = pos.Z;
        }

        private static void GetDisplacementBounds( ValveBspFile bsp, DispInfo dispInfo,
            out Vector3 min, out Vector3 max, float bias = 0f )
        {
            min = new Vector3( float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity );
            max = new Vector3( float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity );

            var disp = new Displacement( bsp, dispInfo );
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
        public JToken GetDisplacements( [Url] string mapName, int model )
        {
            var displacements = new JArray();
            var foundLeaves = new List<BspTree.Leaf>();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                var tree = new BspTree( bsp, model );

                foreach ( var dispInfo in bsp.DisplacementInfos )
                {
                    if ( dispInfo.MapFace < tree.Info.FirstFace || dispInfo.MapFace >= tree.Info.FirstFace + tree.Info.NumFaces ) continue;
                    var face = bsp.FacesHdr[dispInfo.MapFace];

                    Vector3 min, max;
                    GetDisplacementBounds( bsp, dispInfo, out min, out max, 1f );

                    foundLeaves.Clear();
                    tree.GetIntersectingLeaves( min, max, foundLeaves );
                    
                    var clusters = new JArray();

                    foreach ( var leaf in foundLeaves )
                    {
                        clusters.Add( leaf.Info.Cluster );
                    }

                    displacements.Add(  new JObject
                    {
                        { "index", face.DispInfo },
                        { "power", dispInfo.Power },
                        { "min", min.ToJson() },
                        { "max", max.ToJson() },
                        { "clusters", clusters }
                    } );
                }

                return new JObject
                {
                    { "displacements", displacements }
                };
            }
        }

        [Get( "/{mapName}/visibility" )]
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
