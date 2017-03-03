using System;
using System.IO;
using System.Reflection;
using System.Threading;
using SourceUtils;
using Ziks.WebServer;

namespace MapViewServer
{
    class Program
    {
        private const string SteamAppsDirectory = @"C:\Program Files (x86)\Steam\steamapps";
        
        public static string ResourcesDirectory { get; private set; }
        public static string ScriptsDirectory { get; private set; }
        public static string CacheDirectory { get; private set; }

        public static string CsgoDirectory { get; private set; }
            = Path.Combine( SteamAppsDirectory, "common", "Counter-Strike Global Offensive", "csgo" );
        
        public static ResourceLoader Loader { get; private set; }

        public static DateTime BuildTimeUtc { get; private set; }
        
        [STAThread]
        static int Main(string[] args)
        {
            if (args.Length > 0) CsgoDirectory = args[0];

            var assemblyDir = Path.GetDirectoryName( Assembly.GetExecutingAssembly().Location );
            ResourcesDirectory = new DirectoryInfo( Path.Combine( assemblyDir, "..", "..", "Resources" ) ).FullName;
            ScriptsDirectory = new DirectoryInfo( Path.Combine( assemblyDir, "..", "..", "Scripts" ) ).FullName;
            CacheDirectory = Path.Combine( assemblyDir, "Cache" );

            BuildTimeUtc = new FileInfo( Assembly.GetExecutingAssembly().Location ).LastWriteTimeUtc;

            Loader = new ResourceLoader();
            Loader.AddResourceProvider(new ValvePackage(Path.Combine(CsgoDirectory, "pak01_dir.vpk")));

            var server = new Server( 8080 );

            server.Controllers.Add( "/", () => new StaticFileController( ResourcesDirectory ) );
            server.Controllers.Add( "/", () => new StaticFileController( ScriptsDirectory ) );
            server.Controllers.Add( Assembly.GetExecutingAssembly() );

            server.Start();

            var threads = new Thread[Math.Max( 1, Environment.ProcessorCount - 1 )];

            for ( var i = 0; i < threads.Length; ++i )
            {
                threads[i] = new Thread( () => server.Run() );
                threads[i].Start();
            }

            server.Run();

            return 0;
        }
    }
}