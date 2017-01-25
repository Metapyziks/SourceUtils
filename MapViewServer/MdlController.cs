using System;
using System.Linq;
using System.Net;
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
        
        public static string GetUrl( HttpListenerRequest request, string path )
        {
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}?format=json";
        }

        private const string DefaultFormat = "json";
        
        [Get( MatchAllUrl = false )]
        public HtmlElement Html( string format = DefaultFormat )
        {
            const string elemId = "model-view";

            return new div
            {
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/three.js/r83/three.min.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/base64-string.min.js" ),
                new script( src => "/main.js" ),
                new script
                {
                    $@"
                var main = new SourceUtils.ModelViewer();
                window.onload = function () {{
                    main.init($(""#{elemId}""));
                    main.loadModel(""{GetUrl( Request, FilePath )}"");
                    main.animate();
                }}
                "
                },
                new div( id => elemId, style => "height: 720px" ),
                new code( style => "display: block; white-space: pre-wrap" )
                {
                    Json().ToString()
                }
            };
        }
        
        [Get( MatchAllUrl = false )]
        public JToken Json( string format = DefaultFormat )
        {
            if ( format != "json" ) throw NotFoundException();

            var path = FilePath;
            var basePath = path.Substring( 0, path.Length - 4 );
            var mdl = Program.Loader.Load<StudioModelFile>( path );
            var response = new JObject
            {
                { "hullMin", new JObject { {"x", mdl.HullMin.X}, {"y", mdl.HullMin.Y}, {"z", mdl.HullMin.Z} } },
                { "hullMax", new JObject { {"x", mdl.HullMax.X}, {"y", mdl.HullMax.Y}, {"z", mdl.HullMax.Z} } },
                { "materials", JArray.FromObject( Enumerable
                    .Range( 0, mdl.NumTextures )
                    .Select( x => VmtController.GetUrl( Request, mdl.GetMaterialName( 0, x ) ) )
                    .ToArray() )
                },
                { "vertices", VvdController.GetUrl( Request, $"{basePath}.vvd" ) },
                { "triangles", VtxController.GetUrl( Request, $"{basePath}.dx90.vtx" ) }
            };

            return response;
        }
    }
}