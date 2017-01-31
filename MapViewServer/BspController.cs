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
        public JToken GetVertices( [Url] string mapName, int from = 0, int count = 4096, bool compressed = true )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "total", bsp.Vertices.Length );
                response.Add( "from", from );
                response.Add( "count", count );
                
                var builder = new StringBuilder();
                
                builder.Append( "[" );
                foreach ( var vertex in bsp.Vertices.Range( from, count ) )
                {
                    builder.Append( $"{vertex.X},{vertex.Y},{vertex.Z}," );
                }
                builder.Remove( builder.Length - 1, 1 );
                builder.Append( "]" );

                response.Add( "vertices", compressed
                    ? (JToken) LZString.compressToBase64( builder.ToString() )
                    : JArray.Parse( builder.ToString() ) );
            }

            return response;
        }
    }
}
