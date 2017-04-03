﻿using System.IO;
using CommandLine;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    class BaseOptions
    {
        [Option('g', "gamedir", HelpText = "Game directory to export from.", Required = true)]
        public string GameDir { get; set; }

        [Option('m', "map", HelpText = "Specific map name to export (e.g. 'de_dust2').")]
        public string Map { get; set; }
    }

    [Verb("export", HelpText = "Export one or more maps for serving over HTTP.")]
    class ExportOptions : BaseOptions
    {
        [Option('o', "outdir", HelpText = "Output directory.", Required = true)]
        public string OutDir { get; set; }
    }

    [Verb("host", HelpText = "Run a HTTP server that exports requested resources.")]
    class HostOptions : BaseOptions
    {
        [Option('c', "cachedir", HelpText = "Directory to store exported files in.")]
        public string CacheDir { get; set; }

        [Option('p', "port", HelpText = "Port to listen on.", Default = 8080)]
        public int Port { get; set; }
    }

    partial class Program
    {
        static int Export( ExportOptions args )
        {
            if ( !Directory.Exists( args.OutDir ) )
            {
                Directory.CreateDirectory( args.OutDir );
            }

            CopyStaticFiles( args.OutDir );

            return 0;
        }

        static int Host( HostOptions args )
        {
            var server = new Server( args.Port );

            if ( args.CacheDir != null )
            {
                if ( !Directory.Exists( args.CacheDir ) )
                {
                    Directory.CreateDirectory( args.CacheDir );
                }

                CopyStaticFiles( args.CacheDir );
                AddStaticFileControllers( server, args.CacheDir );
            }
            else
            {
                AddStaticFileControllers( server );
            }

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