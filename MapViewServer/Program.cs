using System;
using System.IO;
using System.Reflection;
using SourceUtils;
using Ziks.WebServer;

namespace MapViewServer
{
    class Program
    {
        private const string SteamAppsDirectory = @"C:\Program Files (x86)\Steam\steamapps";

        public static string CsgoDirectory { get; private set; }
            = Path.Combine( SteamAppsDirectory, "common", "Counter-Strike Global Offensive", "csgo" );
        
        public static ResourceLoader Loader { get; private set; }
        
        [STAThread]
        static int Main(string[] args)
        {
            if (args.Length > 0) CsgoDirectory = args[0];

            var resourcesPath = Path.Combine( Path.GetDirectoryName( Assembly.GetExecutingAssembly().Location ), "..", "..", "Resources" );

            Loader = new ResourceLoader();
            Loader.AddResourceProvider(new ValvePackage(Path.Combine(CsgoDirectory, "pak01_dir.vpk")));

            var server = new Server( 8080 );

            server.Controllers.Add( "/", () => new StaticFileController( resourcesPath ) );
            server.Controllers.Add( Assembly.GetExecutingAssembly() );
            server.Run();

            return 0;
        }
    }
}