using Newtonsoft.Json.Linq;
using SourceUtils;

namespace MapViewServer
{
    public class VtfServlet : ResourceServlet
    {
        protected override void OnService()
        {
            switch (Request.QueryString["format"])
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
        
        private void ServiceMetadata()
        {
            var response = new JObject();
            var vtf = Program.Loader.Load<ValveTextureFile>(FilePath);
            
            response.Add("width", vtf.Header.Width);
            response.Add("height", vtf.Header.Height);
            response.Add("flags", (long) vtf.Header.Flags);
            response.Add("png_url", $"{Request.Url}?format=png&mipmap={{mipmap}}");
            response.Add("mipmaps", vtf.Header.MipMapCount);
            
            WriteJson(response);
        }
    }
}