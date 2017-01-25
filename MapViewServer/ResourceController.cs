using System;
using System.IO;
using System.Web;
using MimeTypes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    public abstract class ResourceController : Controller
    {
        protected string FilePath
        {
            get
            {
                var matched = new Uri( MatchedUrl + "/" );
                var requested = new Uri( Request.Url.GetLeftPart( UriPartial.Path ) );

                return HttpUtility.UrlDecode( matched.MakeRelativeUri( requested ).OriginalString );
            }
        }
        
        protected override void OnServiceJson( JToken token )
        {
            Response.ContentType = MimeTypeMap.GetMimeType(".json");
            using ( var streamWriter = new StreamWriter( Response.OutputStream ) )
            {
                streamWriter.WriteLine(token.ToString(Formatting.None));
            }
        }

        protected override void OnServiceHtml( HtmlElement document )
        {
            base.OnServiceHtml( new html
            {
                new head {new title {$"VPK Browser [{FilePath}]"}},
                new body
                {
                    new h2 {$"Contents of /{FilePath}" },
                    document
                }
            } );
        }
    }
}
