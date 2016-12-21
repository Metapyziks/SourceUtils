using System;
using System.IO;
using System.Net;
using WebServer;
using Newtonsoft.Json.Linq;

namespace MapViewServer
{
    public abstract class ResourceServlet : Servlet
    {
        protected string FilePath { get; private set; }
        
        protected void WriteJson(JToken token)
        {
            Response.ContentType = "application/json";
            
            var writer = new StreamWriter(Response.OutputStream);
            
            writer.WriteLine(token.ToString());            
            writer.Flush();
        }
        
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
    }
}