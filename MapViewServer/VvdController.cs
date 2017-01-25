using System;
using System.Net;
using System.Text;
using SourceUtils;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix(UrlPrefix)]
    public class VvdController : ResourceController
    {
        public const string UrlPrefix = "/vvd";
        
        public static string GetUrl( HttpListenerRequest request, string path, int lod = -1 )
        {
            var lodString = lod == -1 ? "{lod}" : lod.ToString();
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}?format=json&lod={lodString}";
        }

        private const string DefaultFormat = "json";
        
        [Get( MatchAllUrl = false )]
        public HtmlElement Html( string format = DefaultFormat )
        {
            return new code( style => "display: block; white-space: pre-wrap" )
            {
                Json().ToString()
            };
        }
        
        [Get( MatchAllUrl = false )]
        public JToken Json( string format = DefaultFormat, int lod = -1, bool vertices = true, bool normals = true, bool texcoords = true )
        {
            if ( format != "json" ) throw NotFoundException();

            var vvd = Program.Loader.Load<ValveVertexFile>( FilePath );
            var response = new JObject
            {
                { "numLods", vvd.NumLods }
            };

            if ( lod < 0 ) lod = int.MaxValue;
            lod = Math.Max( 0, Math.Min( lod, vvd.NumLods - 1 ) );

            response.Add( "lod", lod );

            var builder = new StringBuilder();

            var studioVerts = vvd.GetVertices( lod );
            if ( vertices )
            {
                builder.Remove( 0, builder.Length );
                builder.Append( "[" );
                for ( var i = 0; i < studioVerts.Length; ++i )
                {
                    if ( i != 0 ) builder.Append( "," );
                    var vert = studioVerts[i];
                    builder.AppendFormat( "{0:F3},{1:F3},{2:F3}", vert.Position.X, vert.Position.Y, vert.Position.Z );
                }
                builder.Append( "]" );

                response.Add( "vertices", LZString.compressToBase64( builder.ToString() ) );
            }

            if ( normals )
            {
                builder.Remove( 0, builder.Length );
                builder.Append( "[" );
                for ( var i = 0; i < studioVerts.Length; ++i )
                {
                    if ( i != 0 ) builder.Append( "," );
                    var vert = studioVerts[i];
                    builder.AppendFormat( "{0:F3},{1:F3},{2:F3}", -vert.Normal.X, -vert.Normal.Y, -vert.Normal.Z );
                }
                builder.Append( "]" );

                response.Add( "normals", LZString.compressToBase64( builder.ToString() ) );
            }

            if ( texcoords )
            {
                builder.Remove( 0, builder.Length );
                builder.Append( "[" );
                for ( var i = 0; i < studioVerts.Length; ++i )
                {
                    if ( i != 0 ) builder.Append( "," );
                    var vert = studioVerts[i];
                    builder.AppendFormat( "{0:F3},{1:F3}", vert.TexCoordX, 1f - vert.TexCoordY );
                }
                builder.Append( "]" );

                response.Add( "texcoords", LZString.compressToBase64( builder.ToString() ) );
            }

            return response;
        }
    }
}