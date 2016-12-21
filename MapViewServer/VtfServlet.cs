using Newtonsoft.Json.Linq;
using SourceUtils;

namespace MapViewServer
{
    [PackageResource(".vtf")]
    public class VtfServlet : ResourceServlet
    {
        protected override void OnService(string format)
        {
            switch (format)
            {
                case "png":
                    ServicePng();
                    break;
                default:
                    ServiceMetadata();
                    break;
            }
        }
        
        private void ServicePng()
        {
            Response.ContentType = "image/png";
            
            var mipMapQuery = Request.QueryString["mipmap"];
            
            int mipMap;
            if (string.IsNullOrEmpty(mipMapQuery) || !int.TryParse(mipMapQuery, out mipMap)) mipMap = 0;
            
            VtfConverter.ConvertToPng(FilePath, mipMap, Response.OutputStream);
        }
        
        protected override void OnServicePreviewBody()
        {
            var vtf = Program.Loader.Load<ValveTextureFile>(FilePath);
            for (var i = 0; i < vtf.Header.MipMapCount; ++i)
            {
                Write(
                    T("a", href => GetPngUrl(i))(
                        E("img", src => GetPngUrl(i))
                    )
                );
            }
        }
        
        private string GetPngUrl(int mipMap = -1)
        {
            var mipMapString = mipMap == -1 ? "{mipmap}" : mipMap.ToString();
            return $"http://{Request.Url.Host}:{Request.Url.Port}{Request.Url.AbsolutePath}?format=png&mipmap={mipMapString}";
        }
        
        private void ServiceMetadata()
        {
            var response = new JObject();
            var vtf = Program.Loader.Load<ValveTextureFile>(FilePath);
            
            response.Add("width", vtf.Header.Width);
            response.Add("height", vtf.Header.Height);
            response.Add("flags", (long) vtf.Header.Flags);
            response.Add("png_url", GetPngUrl());
            response.Add("mipmaps", vtf.Header.MipMapCount);
            
            WriteJson(response);
        }
    }
}