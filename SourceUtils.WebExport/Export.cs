using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading.Tasks;
using CommandLine;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    [Verb("export", HelpText = "Export one or more maps for serving over HTTP.")]
    class ExportOptions : BaseOptions
    {
        [Option('o', "outdir", HelpText = "Output directory.", Required = true)]
        public string OutDir { get; set; }

        [Option('r', "overwrite", HelpText = "Overwrite existing exported files.")]
        public bool Overwrite { get; set; }
    }

    partial class Program
    {
        public static bool IsExporting { get; private set; }

        private static readonly HashSet<Url> _sExportUrls = new HashSet<Url>();
        private static readonly Queue<Url> _sToExport = new Queue<Url>();

        public static void AddExportUrl( Url url )
        {
            if ( !_sExportUrls.Add( url ) ) return;
            _sToExport.Enqueue( url );
        }

        private static readonly string[] _sBytesUnits =
        {
            " Bytes", "K Bytes", "M Bytes", "G Bytes"
        };

        static string FormatFileSize( long bytes )
        {
            double relative = bytes;

            for ( var i = 0; i < _sBytesUnits.Length; ++i )
            {
                if ( relative < 1024 || i == _sBytesUnits.Length - 1 )
                {
                    if ( relative == (int) relative )
                    {
                        return $"{relative}{_sBytesUnits[i]}";
                    }

                    if ( relative < 10 )
                    {
                        return $"{relative:F2}{_sBytesUnits[i]}";
                    }

                    if (relative < 100)
                    {
                        return $"{relative:F1}{_sBytesUnits[i]}";
                    }

                    return $"{Math.Round(relative)}{_sBytesUnits[i]}";
                }

                relative /= 1024;
            }

            throw new Exception();
        }

        static int Export(ExportOptions args)
        {
            SetBaseOptions(args);

            const int port = 39281;
            var server = new Server();
            server.Prefixes.Add( $"http://localhost:{port}/" );

            server.Controllers.Add( Assembly.GetExecutingAssembly() );

            if (!Directory.Exists(args.OutDir))
            {
                Directory.CreateDirectory(args.OutDir);
            }

            CopyStaticFiles(args.OutDir);

            IsExporting = true;

            if ( args.Map != null )
            {
                AddExportUrl( $"/maps/{args.Map}.json" );
            }
            else
            {
                var mapsDir = Path.Combine( args.GameDir, "maps" );
                foreach ( var file in Directory.GetFiles( mapsDir ) )
                {
                    if ( file.EndsWith( ".bsp" ) )
                    {
                        var map = Path.GetFileNameWithoutExtension( file );
                        AddExportUrl( $"/maps/{map}.json" );
                    }
                }
            }

            var startedServer = false;

            var skipped = 0;
            var failed = 0;
            var exported = 0;

            using (var client = new WebClient())
            {
                while (_sToExport.Count > 0)
                {
                    var url = _sToExport.Dequeue();

                    var path = Path.Combine(args.OutDir, url.Value.Substring(1));
                    var skip = !args.Overwrite && File.Exists(path);

                    if ( skip )
                    {
                        ++skipped;
                    }

                    if ( args.Verbose )
                    {
                        Console.ResetColor();
                        if ( skip ) Console.WriteLine($"Skipped '{url}'");
                        else Console.Write($"[{exported + skipped + failed + 1}/{_sExportUrls.Count}] Exporting '{url}' ... ");
                    }

                    var dir = Path.GetDirectoryName(path);
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                    if ( !startedServer )
                    {
                        startedServer = true;
                        Task.Run( () => server.Run() );
                    }

                    var skipStr = skip ? "?skip=1" : "";

                    try
                    {
                        using ( var input = client.OpenRead( $"http://localhost:{port}{url}{skipStr}" ) )
                        {
                            if ( skip ) continue;

                            using ( var output = File.Create( path ) )
                            {
                                input.CopyTo( output );
                                ++exported;

                                if ( args.Verbose )
                                {
                                    Console.ForegroundColor = ConsoleColor.Green;
                                    Console.WriteLine( $"Wrote {FormatFileSize( output.Length )}" );
                                }
                            }
                        }
                    }
                    catch ( WebException e )
                    {
                        ++failed;

                        if ( args.Verbose )
                        {
                            Console.ForegroundColor = ConsoleColor.DarkRed;
                            Console.WriteLine("Failed");
                        }
                    }
                }
            }

            if ( startedServer ) server.Stop();

            Console.ResetColor();
            Console.WriteLine( $"Finished ({exported} exported, {skipped} skipped, {failed} failed)" );

            Console.ReadKey();

            return 0;
        }
    }
}
