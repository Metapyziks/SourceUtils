using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Web;
using MimeTypes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;
    using ParameterReplacement = KeyValuePair<string, object>;

    public abstract class ResourceController : Controller
    {
        protected virtual string FilePath
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

            if ( token == null )
            {
                Response.OutputStream.Close();
                return;
            }

#if DEBUG
            const Formatting formatting = Formatting.Indented;
#else
            const Formatting formatting = Formatting.None;
#endif

            using ( var streamWriter = new StreamWriter( Response.OutputStream ) )
            {
                streamWriter.WriteLine(token.ToString(formatting));
            }
        }

        protected ParameterReplacement Replace( string name, object value )
        {
            return new ParameterReplacement( name, value );
        }

        protected string GetActionUrl( string methodName, params ParameterReplacement[] paramValues )
        {
            return GetActionUrl( GetType(), methodName, paramValues );
        }

        protected string GetActionUrl<TController>( string methodName, params ParameterReplacement[] paramValues )
        {
            return GetActionUrl( typeof(TController), methodName, paramValues );
        }

        private string GetActionUrl( Type controllerType, string methodName, params ParameterReplacement[] paramValues )
        {
            const BindingFlags flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
            var method = controllerType.GetMethod( methodName, flags );
            var controllerMatcher = controllerType.GetCustomAttribute<PrefixAttribute>();
            var actionMatcher = method.GetCustomAttribute<ControllerActionAttribute>();

            var builder = new StringBuilder( Request.Url.GetLeftPart( UriPartial.Authority ) );
            if ( builder[builder.Length - 1] == '/' ) builder.Remove( builder.Length - 1, 1 );

            if ( controllerMatcher.Value != "/" ) builder.Append( controllerMatcher.Value );
            if ( actionMatcher.Value != "/" ) builder.Append( actionMatcher.Value );

            builder.Append( $"?v={GetFileVersionHash( Program.BuildTimeUtc )}" );

            foreach ( var parameter in method.GetParameters() )
            {
                if ( parameter.GetCustomAttribute<UrlAttribute>() != null ) continue;
                if ( parameter.GetCustomAttribute<BodyAttribute>() != null ) continue;

                var match = paramValues.FirstOrDefault( x => x.Key == parameter.Name );

                if ( match.Key != null )
                {
                    if ( match.Value == null ) continue;
                    builder.Append( $"&{parameter.Name}={HttpUtility.UrlEncode( match.Value.ToString() )}" );
                }
                else
                {
                    builder.Append( $"&{parameter.Name}={{{parameter.Name}}}" );
                }
            }

            foreach ( var replacement in paramValues )
            {
                if ( replacement.Value == null ) continue;
                builder.Replace( $"{{{replacement.Key}}}", HttpUtility.UrlEncode( replacement.Value.ToString() ) );
            }

            return builder.ToString();
        }

        private static string GetFileVersionHash( DateTime timestamp )
        {
            var major = (int) (timestamp - new DateTime( 2000, 1, 1 )).TotalDays;
            var minor = (int) (timestamp - new DateTime( timestamp.Year, timestamp.Month, timestamp.Day )).TotalSeconds;
            return $"{major:x}-{minor:x}";
        }

        private string GetResourceUrl( string fileName, string rootDir )
        {
            var path = Path.Combine( rootDir, fileName );
            var info = new FileInfo( path );
            var versHash = GetFileVersionHash( info.LastWriteTimeUtc );
            return $"/{fileName}?v={versHash}";
        }

        protected string GetResourceUrl( string fileName )
        {
            return GetResourceUrl( fileName, Program.ResourcesDirectory );
        }

        protected string GetScriptUrl( string fileName )
        {
            return GetResourceUrl( fileName, Program.ScriptsDirectory );
        }

        protected ControllerActionException BadParameterException( string paramName )
        {
            throw new ControllerActionException( Request, true, HttpStatusCode.BadRequest,
                $"Invalid value for '{paramName}'." );
        }

        protected IResourceProvider Resources
        {
            get
            {
                return Program.Loader;
            }
        }

        protected string BspName
        {
            get
            {
                var bspName = Request.QueryString["bspName"];
                return string.IsNullOrEmpty( bspName ) ? null : bspName;
            }
        }

        public bool Compressed
        {
            get
            {
                var compressedStr = Request.QueryString["compressed"];
                bool compressed;
                if ( compressedStr == null || !bool.TryParse( compressedStr, out compressed ) ) compressed = true;

                return compressed;
            }
        }

        protected JToken SerializeArray<T>( IEnumerable<T> enumerable )
        {
            return SerializeArray( enumerable, x => x.ToString() );
        }

        protected JToken SerializeArray<T>( IEnumerable<T> enumerable, Func<T, string> serializer )
        {
            return Utils.SerializeArray( enumerable, serializer, Compressed );
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
