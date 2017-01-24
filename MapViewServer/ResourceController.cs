using System;
using System.IO;
using System.Web;
using MimeTypes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;

namespace MapViewServer
{
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
    }
}
