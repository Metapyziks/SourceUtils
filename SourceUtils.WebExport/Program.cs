using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using CommandLine;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    class BaseOptions
    {
        [Option('g', "gamedir", HelpText = "Game directory to export from.", Required = true)]
        public string GameDir { get; set; }

        [Option('p', "packages", HelpText = "Comma separated VPK file names.")]
        public string Packages { get; set; } = "pak01_dir.vpk";

        [Option('v', "verbose", HelpText = "Write every action to standard output.")]
        public bool Verbose { get; set; }

        [Option("untextured", HelpText = "Only export a single colour for each texture.")]
        public bool Untextured { get; set; }

        [Option('s', "resdir", HelpText = "Directory containing static files to serve (css / html etc).")]
        public string ResourcesDir { get; set; }

        [Option('m', "mapsdir", HelpText = "Directory to export maps from, relative to gamedir.")]
        public string MapsDir { get; set; } = "maps";
        
        [Option("debug-pakfile", HelpText = "Save pakfile to disk for each map, for debugging.")]
        public bool DebugPakFile { get; set; }
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

            map = new ValveBspFile( Path.Combine( BaseOptions.MapsDir, $"{name}.bsp" ) );
            _sOpenMaps.Add( name, map );

            return map;
        }

        static void SetBaseOptions( BaseOptions args )
        {
            BaseOptions = args;

            var vpkNames = args.Packages.Split( new [] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries )
                .Select( x => Path.IsPathRooted( x ) ? x.Trim() : Path.Combine( args.GameDir, x.Trim() ) )
                .ToArray();

            if ( vpkNames.Length == 1 )
            {
                Resources = new ValvePackage( vpkNames[0] );
            }
            else
            {
                var loader = new ResourceLoader();

                foreach ( var path in vpkNames )
                {
                    loader.AddResourceProvider( new ValvePackage( path ) );
                }

                Resources = loader;
            }

            if ( string.IsNullOrEmpty( args.ResourcesDir ) )
            {
                args.ResourcesDir = Path.Combine( Path.GetDirectoryName( Assembly.GetExecutingAssembly().Location ), "..", "..", "Resources" );
            }

            if ( !Directory.Exists( args.ResourcesDir ) )
            {
                args.ResourcesDir = null;
            }

            if ( string.IsNullOrEmpty( args.MapsDir ) )
            {
                args.MapsDir = "maps";
            }

            if ( !Path.IsPathRooted( args.MapsDir ) )
            {
                args.MapsDir = Path.Combine( args.GameDir, args.MapsDir );
            }

            ValveBspFile.PakFileLump.DebugContents = args.DebugPakFile;
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
