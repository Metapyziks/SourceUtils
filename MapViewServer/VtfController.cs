using System.Linq;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix("/vtf")]
    public class VtfController : ResourceController
    {
        private const string DefaultFormat = "json";
        
        private string GetPngUrl(int mipMap = -1)
        {
            var mipMapString = mipMap == -1 ? "{mipmap}" : mipMap.ToString();
            return $"http://{Request.Url.Authority}{Request.Url.AbsolutePath}?format=png&mipmap={mipMapString}";
        }
        
        [Get( MatchAllUrl = false )]
        public HtmlElement Html( string format = DefaultFormat )
        {
            if ( format != "html" ) throw NotFoundException();

            var vtf = Program.Loader.Load<ValveTextureFile>( FilePath );

            return new html
            {
                new body
                {
                    Foreach( Enumerable.Range( 0, vtf.Header.MipMapCount ), i =>
                    {
                        Echo( new a( href => GetPngUrl( i ) )
                        {
                            new NamedHtmlElement( "img", src => GetPngUrl( i ) )
                        } );
                    } )
                }
            };
        }
        
        [Get( MatchAllUrl = false )]
        public JObject Json( string format = DefaultFormat )
        {
            if ( format != "json" ) throw NotFoundException();

            var vtf = Program.Loader.Load<ValveTextureFile>( FilePath );

            var response = new JObject
            {
                {"width", vtf.Header.Width},
                {"height", vtf.Header.Height},
                {"flags", (long) vtf.Header.Flags},
                {"png_url", GetPngUrl()},
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