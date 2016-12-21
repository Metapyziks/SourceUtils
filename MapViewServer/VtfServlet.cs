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
            var vmt = Program.Loader.Load<ValveTextureFile>(FilePath);
            
            var mipMaps = new JArray();
            
            for (var i = 0; i < vmt.Header.MipMapCount; ++i)
            {
                mipMaps.Add($"{VpkBrowseServlet.ServletUrlPrefix}/{FilePath}?format=png&mipmap={i}");
            }
            
            response.Add("width", vmt.Header.Width);
            response.Add("height", vmt.Header.Height);
            response.Add("flags", (long) vmt.Header.Flags);
            response.Add("mipmaps", mipMaps);
            
            WriteJson(response);
        }
    }
}