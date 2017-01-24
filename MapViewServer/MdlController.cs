using System;
using System.Linq;
using SourceUtils;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix(UrlPrefix)]
    public class MdlController : ResourceController
    {
        public const string UrlPrefix = "/mdl";

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
        public JToken Json( string format = DefaultFormat )
        {
            if ( format != "json" ) throw NotFoundException();

            var path = FilePath;
            var basePath = path.Substring( 0, path.Length - 4 );
            var mdl = Program.Loader.Load<ValveModelFile>( path );
            var response = new JObject
            {
                { "materials", JArray.FromObject( Enumerable
                    .Range( 0, mdl.NumTextures )
                    .Select( x => VmtController.GetUrl( Request, mdl.GetMaterialName( 0, x ) ) )
                    .ToArray() )
                },
                { "vertices", VvdController.GetUrl( Request, $"{basePath}.vvd" ) }
            };

            return response;
        }
    }
}