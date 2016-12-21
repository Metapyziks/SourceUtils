using System;
using System.IO;
using System.Net;
using WebServer;
using Newtonsoft.Json.Linq;

using static MapViewServer.Utils;

namespace MapViewServer
{
    public abstract class ResourceServlet : HtmlServlet
    {
        protected string FilePath { get; private set; }
        protected string Format { get; private set; }
        
        protected void WriteJson(JToken token)
        {
            Response.ContentType = "application/json";
            
            var writer = new StreamWriter(Response.OutputStream);
            
            writer.WriteLine(token.ToString());            
            writer.Flush();
        }
        
        protected override void OnService()
        {
            Format = Request.QueryString["format"];
            
            switch (Format)
            {
                case "preview":
                    OnServicePreview();
                    return;
                default:
                    OnService(Format);
                    return;
            }
        }
        
        protected virtual void OnServicePreview()
        {
            var parent = Path.GetDirectoryName(FilePath);
            
            Write(
                DocType("html"),
                T("html", lang => "en")(
                    T("head")(
                        T("title")("Valve Texture File Preview")
                    ),
                    T("body")(
                        T("h2")($"Preview of /{FilePath}"),
                        T("p")(T("a", href => JoinUrl(VpkBrowseServlet.ServletUrlPrefix, parent))("Back")),
                        T(OnServicePreviewBody)
                    )
                )
            );
        }
        
        protected virtual void OnServicePreviewBody() {}
        
        public void Service(HttpListenerRequest request, HttpListenerResponse response, string filePath)
        {
            FilePath = filePath;
            
            try
            {                
                Service(request, response);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }
        }
        
        protected virtual void OnService(string format) {}
    }
}