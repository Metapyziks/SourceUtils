using System;
using System.IO;
using System.Net;
using SourceUtils;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static Utils;
    using static HtmlDocumentHelper;

    [Prefix( UrlPrefix )]
    public class VpkController : Controller
    {
        public const string UrlPrefix = "/vpk";
        
        public static string GetUrl( HttpListenerRequest request, string path )
        {
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}";
        }

        private static HtmlElement DirectoryEntry( string prefix, HtmlElement label, string url = null )
        {
            return url == null ? new li {label} : new li {new a( href => JoinUrl( prefix, url ) ) {label}};
        }

        [Get( MatchAllUrl = false )]
        public HtmlElement Index()
        {
            var matched = MatchedUrl;
            var requested = new Uri( Request.Url.GetLeftPart( UriPartial.Path ) );

            var path = "";
            if ( !requested.AbsolutePath.Equals( matched.AbsolutePath ) )
            {
                matched = new Uri( matched + "/" );
                path = matched.MakeRelativeUri( requested ).OriginalString;
            }

            var parent = path.Length > 1 ? Path.GetDirectoryName( path ) : null;

            return new html( lang => "en" )
            {
                new head {new title {$"VPK Browser [{path}]"}},
                new body
                {
                    new h2 {$"Contents of /{path}"},
                    new ul
                    {
                        () =>
                        {
                            if ( parent != null ) Echo( DirectoryEntry( UrlPrefix, "..", parent ) );

                            var directories = Program.Loader.GetDirectories( path );
                            var files = Program.Loader.GetFiles( path );

                            foreach ( var dir in directories )
                            {
                                Echo( DirectoryEntry( UrlPrefix, dir, JoinUrl( path, dir ) ) );
                            }

                            foreach ( var file in files )
                            {
                                var prefix = "/" + Path.GetExtension( file ).Substring( 1 );
                                NamedHtmlElement img;

                                if ( prefix == VtfController.UrlPrefix )
                                {
                                    var filePath = $"{path}/{file}";
                                    var vtf = Program.Loader.Load<ValveTextureFile>( filePath );
                                    var mipmap = Math.Max( 0, vtf.Header.MipMapCount - 5 );
                                    img = new NamedHtmlElement( "img", src => VtfController.GetPngUrl( Request, filePath, mipmap ) );
                                }
                                else
                                {
                                    img = new NamedHtmlElement( "img", src => "/fileicon.png" );
                                }
                                
                                Echo( DirectoryEntry( prefix, new span { img, nbsp, file }, JoinUrl( path, file + "?format=html" ) ) );
                            }
                        }
                    }
                }
            };
        }
    }
}
