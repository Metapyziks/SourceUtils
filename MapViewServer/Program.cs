using System;
using System.IO;
using System.Reflection;
using SourceUtils;
using WebServer;

class Program
{
    public static string CsgoDirectory { get; private set; }
        = @"/home/ziks/.local/share/Steam/steamapps/common/Counter-Strike Global Offensive/csgo/";
    
    public static ResourceLoader Loader { get; private set; }
    
    [STAThread]
    static int Main(string[] args)
    {
        if (args.Length > 0) CsgoDirectory = args[0];
        
        Loader = new ResourceLoader();
        Loader.AddResourceProvider(new VpkArchve(Path.Combine(CsgoDirectory, "pak01_dir.vpk")));

        var server = new Server();
        
        DefaultResourceServlet.ResourceDirectory = "../../Resources";
        DefaultResourceServlet.EnableCaching = true;
        
        server.AddPrefix("http://+:8080/");
        server.BindServletsInAssembly(Assembly.GetExecutingAssembly());
        
        server.Run();
        
        return 0;
    }
}