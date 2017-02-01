using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
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

        [ThreadStatic]
        private static StringBuilder _sArrayBuilder;

        protected JToken SerializeArray<T>( IEnumerable<T> enumerable )
        {
            return SerializeArray( enumerable, x => x.ToString() );
        }

        protected JToken SerializeArray<T>( IEnumerable<T> enumerable, Func<T, string> serializer )
        {
            if ( _sArrayBuilder == null ) _sArrayBuilder = new StringBuilder();
            else _sArrayBuilder.Remove( 0, _sArrayBuilder.Length );

            var compressedStr = Request.QueryString["compressed"];
            bool compressed;
            if ( compressedStr == null || !bool.TryParse( compressedStr, out compressed ) ) compressed = true;

            _sArrayBuilder.Append( "[" );
            foreach ( var item in enumerable )
            {
                _sArrayBuilder.Append( serializer( item ) );
                _sArrayBuilder.Append( "," );
            }

            if ( _sArrayBuilder.Length > 1 ) _sArrayBuilder.Remove( _sArrayBuilder.Length - 1, 1 );
            _sArrayBuilder.Append( "]" );
            
            return compressed
                ? (JToken) LZString.compressToBase64( _sArrayBuilder.ToString() )
                : JArray.Parse( _sArrayBuilder.ToString() );
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
