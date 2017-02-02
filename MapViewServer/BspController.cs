using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace MapViewServer
{
    [Prefix(UrlPrefix)]
    public class BspController : ResourceController
    {
        public const string UrlPrefix = "/bsp";

        private ValveBspFile OpenBspFile( string mapName )
        {
            if ( !mapName.EndsWith( ".bsp" ) ) mapName = $"{mapName}.bsp";

            var path = Path.Combine( Program.CsgoDirectory, "maps", mapName );
            if ( !File.Exists( path ) ) throw NotFoundException( true );

            return new ValveBspFile( File.Open( path, FileMode.Open, FileAccess.Read, FileShare.Read ) );
        }

        [Get( "/{mapName}/vertices" )]
        public JToken GetVertices( [Url] string mapName, int from = 0, int count = 4096 )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "total", bsp.Vertices.Length );
                response.Add( "from", from );
                response.Add( "count", count );

                response.Add( "vertices", SerializeArray( bsp.Vertices.Range( from, count ),
                    vertex => $"{vertex.X},{vertex.Y},{vertex.Z}" ) );
            }

            return response;
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
                { "cluster", leaf.Cluster },
                { "min", leaf.Min.ToJson() },
                { "max", leaf.Max.ToJson() },
                { "area", leaf.AreaFlags.Area }
            };

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

        [Get( "/{mapName}/bsp-models" )]
        public JToken GetBspModels( [Url] string mapName )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "models", bsp.Models.Length );
            }

            return response;
        }

        [Get( "/{mapName}/bsp-models/{modelIndex}" )]
        public JToken GetBspModels( [Url] string mapName, [Url] int modelIndex )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                var model = bsp.Models[modelIndex];

                response.Add( "index", modelIndex );
                response.Add( "min", model.Min.ToJson() );
                response.Add( "max", model.Max.ToJson() );
                response.Add( "origin", model.Origin.ToJson() );
                response.Add( "tree", LZString.compressToBase64( SerializeBspNode( bsp, model.HeadNode ).ToString( Formatting.None ) ) );
            }

            return response;
        }

        [Get( "/{mapName}/visibility" )]
        public JToken GetVisibility( [Url] string mapName )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "clusters", bsp.Visibility.NumClusters );
            }

            return response;
        }

        [Get( "/{mapName}/visibility/{clusterIndex}" )]
        public JToken GetVisibility( [Url] string mapName, [Url] int clusterIndex )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "index", clusterIndex );
                response.Add( "pvs", SerializeArray( bsp.Visibility[clusterIndex] ) );
            }

            return response;
        }
    }
}
