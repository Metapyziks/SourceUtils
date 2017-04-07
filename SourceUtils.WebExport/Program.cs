using System.Collections.Generic;
using System.IO;
using System.Reflection;
using CommandLine;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    class BaseOptions
    {
        [Option('g', "gamedir", HelpText = "Game directory to export from.", Required = true)]
        public string GameDir { get; set; }

        [Option('v', "verbose", HelpText = "Write every action to standard output.")]
        public bool Verbose { get; set; }

        [Option("untextured", HelpText = "Only export a single colour for each texture.")]
        public bool Untextured { get; set; }

        [Option('s', "resdir", HelpText = "Directory containing static files to serve (css / html etc).")]
        public string ResourcesDir { get; set; }
    }

    [Verb("host", HelpText = "Run a HTTP server that exports requested resources.")]
    class HostOptions : BaseOptions
    {
        [Option('p', "port", HelpText = "Port to listen on.", Default = 8080)]
        public int Port { get; set; }
    }

    partial class Program
    {
        public static BaseOptions BaseOptions { get; private set; }

        public static string GetGameFilePath( string path )
        {
            return Path.Combine(BaseOptions.GameDir, path );
        }

        private static readonly Dictionary<string, ValveBspFile> _sOpenMaps = new Dictionary<string, ValveBspFile>();

        public static IResourceProvider Resources { get; private set; }

        public static ValveBspFile GetMap( string name )
        {
            ValveBspFile map;
            if ( _sOpenMaps.TryGetValue( name, out map ) ) return map;

            map = new ValveBspFile( GetGameFilePath( $"maps/{name}.bsp" ) );
            _sOpenMaps.Add( name, map );

            return map;
        }

        static void SetBaseOptions( BaseOptions args )
        {
            BaseOptions = args;
            Resources = new ValvePackage(Path.Combine(args.GameDir, "pak01_dir.vpk"));

            if ( string.IsNullOrEmpty( args.ResourcesDir ) )
            {
                args.ResourcesDir = Path.Combine( Path.GetDirectoryName( Assembly.GetExecutingAssembly().Location ), "..", "..", "Resources" );
            }

            if ( !Directory.Exists( args.ResourcesDir ) )
            {
                args.ResourcesDir = null;
            }
        }

        static int Host( HostOptions args )
        {
            SetBaseOptions( args );

            var server = new Server( args.Port );

            AddStaticFileControllers( server );

            server.Controllers.Add( Assembly.GetExecutingAssembly() );
            server.Run();

            return 0;
        }

        static int Main(string[] args)
        {
            var result = Parser.Default.ParseArguments<ExportOptions, HostOptions>( args );
            return result.MapResult<ExportOptions, HostOptions, int>( Export, Host, _ => 1 );
        }
    }
}
