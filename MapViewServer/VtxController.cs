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
    public class VtxController : ResourceController
    {
        public const string UrlPrefix = "/vtx";
        
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
        public JToken Json( string format = DefaultFormat, int lod = -1 )
        {
            if ( format != "json" ) throw NotFoundException();

            var vtx = Program.Loader.Load<ValveTriangleFile>( FilePath );
            var response = new JObject
            {
                { "numLods", vtx.NumLods }
            };

            if ( lod < 0 ) lod = int.MaxValue;
            lod = Math.Max( 0, Math.Min( lod, vtx.NumLods - 1 ) );

            response.Add( "lod", lod );

            var meshes = new JArray();
            foreach ( var mesh in vtx.GetSubMeshes( lod ) )
            {
                meshes.Add( new JObject
                {
                    {"materialIndex", mesh.MaterialIndex},
                    {"start", mesh.Start},
                    {"length", mesh.Length}
                } );
            }

            response.Add( "meshes", meshes );

            var builder = new StringBuilder();

            var indices = vtx.GetIndices( lod );
            
            builder.Append( "[" );
            for ( var i = 0; i < indices.Length; ++i )
            {
                if ( i != 0 ) builder.Append( "," );
                builder.Append( indices[i] );
            }
            builder.Append( "]" );

            response.Add( "indices", LZString.compressToBase64( builder.ToString() ) );

            return response;
        }
    }
}