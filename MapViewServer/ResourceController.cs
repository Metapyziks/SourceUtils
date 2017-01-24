using System;
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

                return matched.MakeRelativeUri( requested ).OriginalString;
            }
        }
    }
}
