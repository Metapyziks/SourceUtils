using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
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

        protected string GetActionUrl( string methodName, params Expression<Func<object, object>>[] paramValues )
        {
            return GetActionUrl( GetType(), methodName, paramValues );
        }

        protected string GetActionUrl<TController>( string methodName, params Expression<Func<object, object>>[] paramValues )
        {
            return GetActionUrl( typeof(TController), methodName, paramValues );
        }

        private string GetActionUrl( Type controllerType, string methodName, params Expression<Func<object, object>>[] paramValues )
        {
            const BindingFlags flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
            var method = controllerType.GetMethod( methodName, flags );
            var controllerMatcher = controllerType.GetCustomAttribute<PrefixAttribute>();
            var actionMatcher = method.GetCustomAttribute<ControllerActionAttribute>();

            var builder = new StringBuilder( Request.Url.GetLeftPart( UriPartial.Authority ) );
            if ( builder[builder.Length - 1] == '/' ) builder.Remove( builder.Length - 1, 1 );

            if ( controllerMatcher.Value != "/" ) builder.Append( controllerMatcher.Value );
            if ( actionMatcher.Value != "/" ) builder.Append( actionMatcher.Value );

            var first = true;
            foreach ( var parameter in method.GetParameters() )
            {
                if ( parameter.GetCustomAttribute<UrlAttribute>() != null ) continue;
                if ( parameter.GetCustomAttribute<BodyAttribute>() != null ) continue;

                var match = paramValues.FirstOrDefault( x => x.Parameters[0].Name == parameter.Name );
                var prefix = first ? "?" : "&";

                if ( match != null )
                {
                    var value = match.Compile()( null );
                    if ( value == null ) continue;
                    builder.Append( $"{prefix}{parameter.Name}={value}" );
                }
                else
                {
                    builder.Append( $"{prefix}{parameter.Name}={{{parameter.Name}}}" );
                }
                
                first = false;
            }

            foreach ( var expression in paramValues )
            {
                var name = expression.Parameters[0].Name;
                builder.Replace( $"{{{name}}}", (expression.Compile()( null ) ?? "").ToString() );
            }

            return builder.ToString();
        }

        [ThreadStatic]
        private static StringBuilder _sArrayBuilder;

        protected bool Compressed
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
            if ( _sArrayBuilder == null ) _sArrayBuilder = new StringBuilder();
            else _sArrayBuilder.Remove( 0, _sArrayBuilder.Length );


            _sArrayBuilder.Append( "[" );
            foreach ( var item in enumerable )
            {
                _sArrayBuilder.Append( serializer( item ) );
                _sArrayBuilder.Append( "," );
            }

            if ( _sArrayBuilder.Length > 1 ) _sArrayBuilder.Remove( _sArrayBuilder.Length - 1, 1 );
            _sArrayBuilder.Append( "]" );
            
            return Compressed
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
