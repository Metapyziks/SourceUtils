using System.Net;
using WebServer;

namespace MapViewServer
{
    public abstract class ResourceServlet : Servlet
    {
        protected string FilePath { get; private set; }
        
        public void Service(HttpListenerRequest request, HttpListenerResponse response, string filePath)
        {
            FilePath = filePath;
            
            Service(request, response);
        }
    }
}