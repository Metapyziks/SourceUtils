using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    [Prefix(UrlPrefix)]
    public class MdlController : ResourceController
    {
        public const string UrlPrefix = "/mdl";
        
        private const string DefaultFormat = "json";
        
        [Get( MatchAllUrl = false )]
        public HtmlElement Html( string format = DefaultFormat )
        {
            return new HtmlDocumentHelper.code( style => "display: block; white-space: pre-wrap" )
            {
                Json().ToString()
            };
        }
        
        [Get( MatchAllUrl = false )]
        public JToken Json( string format = DefaultFormat, int lod = -1 )
        {
            if ( format != "json" ) throw NotFoundException();

            var mdl = Program.Loader.Load<StudioModelFile>( FilePath );

            return new JObject { {"model", "yes"} };
        }
    }
}
