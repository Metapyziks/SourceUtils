using System.Linq;
using System.Net;
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
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}?format=json";
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
            var vtf = Program.Loader.Load<ValveTextureFile>( path );

            var response = new JObject
            {
                {"width", vtf.Header.Width},
                {"height", vtf.Header.Height},
                {"flags", (long) vtf.Header.Flags},
                {"png", GetPngUrl( Request, path )},
                {"mipmaps", vtf.Header.MipMapCount}
            };

            return response;
        }

        [Get( MatchAllUrl = false )]
        public void Png( string format = DefaultFormat, int mipmap = 0 )
        {
            if ( format != "png" ) throw NotFoundException();

            Response.ContentType = "image/png";

            VtfConverter.ConvertToPng( FilePath, mipmap, Response.OutputStream );
            Response.OutputStream.Close();
        }
    }
}