using System.IO;
using System.Text;
using Newtonsoft.Json.Linq;
using SourceUtils;
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

        [Get( "/{mapName}/visibility/{cluster}" )]
        public JToken GetVisibility( [Url] string mapName, [Url] int cluster )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "cluster", cluster );
                response.Add( "pvs", SerializeArray( bsp.Visibility[cluster] ) );
            }

            return response;
        }
    }
}
