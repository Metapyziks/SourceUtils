using System.Linq;
using System.Net;
using MimeTypes;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix( UrlPrefix )]
    public class VtfController : ResourceController
    {
        public const string UrlPrefix = "/vtf";

        private const string DefaultFormat = "json";
        
        public static string GetUrl( HttpListenerRequest request, string path )
        {
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}";
        }

        public static string GetDdsUrl( HttpListenerRequest request, string path )
        {
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}?format=dds";
        }

        public static string GetPngUrl( HttpListenerRequest request, string path, int mipMap = -1 )
        {
            var mipMapString = mipMap == -1 ? "{mipmap}" : mipMap.ToString();
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}?format=png&mipmap={mipMapString}";
        }

        [Get( MatchAllUrl = false )]
        public HtmlElement Html( string format = DefaultFormat )
        {
            if ( format != "html" ) throw NotFoundException();

            var path = FilePath;
            var vtf = Program.Loader.Load<ValveTextureFile>( path );

            return new html
            {
                new body
                {
                    Foreach( Enumerable.Range( 0, vtf.Header.MipMapCount ), i =>
                    {
                        Echo( new a( href => GetPngUrl( Request, path, i ) )
                        {
                            new NamedHtmlElement( "img", src => GetPngUrl( Request, path, i ) )
                        } );
                    } )
                }
            };
        }

        [Get( MatchAllUrl = false )]
        public JObject Json( string format = DefaultFormat )
        {
            if ( format != "json" ) throw NotFoundException();

            var path = FilePath;
            ValveTextureFile vtf;

            using ( var vtfStream = Resources.OpenFile( path ) )
            {
                vtf = new ValveTextureFile( vtfStream, true );
            }

            var response = new JObject
            {
                {"width", vtf.Header.Width},
                {"height", vtf.Header.Height},
                {"flags", (long) vtf.Header.Flags},
                {"ddsUrl", GetDdsUrl( Request, path )},
                {"pngUrl", GetPngUrl( Request, path )},
                {"mipmaps", vtf.Header.MipMapCount}
            };

            return response;
        }

        [Get( MatchAllUrl = false )]
        public void Dds( string format = DefaultFormat )
        {
            if ( format != "dds" ) throw NotFoundException();
            
            Response.ContentType = MimeTypeMap.GetMimeType(".dds");

            VtfConverter.ConvertToDds( Program.Loader, FilePath, Response.OutputStream );
            Response.OutputStream.Close();
        }

        [Get( MatchAllUrl = false )]
        public void Png( string format = DefaultFormat, int mipmap = 0, bool alpha = false )
        {
            if ( format != "png" ) throw NotFoundException();

            Response.ContentType = MimeTypeMap.GetMimeType(".png");

            VtfConverter.ConvertToPng( Program.Loader, FilePath, mipmap, Response.OutputStream, alpha );
            Response.OutputStream.Close();
        }
    }
}