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

                    return $"{relative:F2}{_sBytesUnits[i]}";
                }

                relative /= 1024;
            }

            throw new Exception();
        }

        static int Export(ExportOptions args)
        {
            _sBaseOptions = args;

            var port = 8080;
            var server = new Server( port );

            server.Controllers.Add( Assembly.GetExecutingAssembly() );

            if (!Directory.Exists(args.OutDir))
            {
                Directory.CreateDirectory(args.OutDir);
            }

            CopyStaticFiles(args.OutDir);

            IsExporting = true;

            if ( args.Map != null )
            {
                AddExportUrl( $"/{args.Map}/info.json" );
            }
            else
            {
                var mapsDir = Path.Combine( args.GameDir, "maps" );
                foreach ( var file in Directory.GetFiles( mapsDir ) )
                {
                    if ( file.EndsWith( ".bsp" ) )
                    {
                        var map = Path.GetFileNameWithoutExtension( file );
                        AddExportUrl( $"/{map}/info.json" );
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
                    if ( !args.Overwrite && File.Exists( path ) )
                    {
                        ++skipped;
                        continue;
                    }

                    if (args.Verbose)
                    {
                        Console.Write($"Exporting '{url}' ... ");
                    }

                    var dir = Path.GetDirectoryName(path);
                    if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

                    if ( !startedServer )
                    {
                        startedServer = true;
                        Task.Run( () => server.Run() );
                    }

                    try
                    {
                        using ( var input = client.OpenRead( $"http://localhost:{port}{url}" ) )
                        {
                            using ( var output = File.Create( path ) )
                            {
                                input.CopyTo( output );
                                ++exported;

                                if ( args.Verbose )
                                {
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
                            Console.WriteLine("Failed");

                            if ( e.Response != null )
                            {
                                using ( var reader = new StreamReader( e.Response.GetResponseStream() ) )
                                {
                                    Console.WriteLine( reader.ReadToEnd() );
                                }
                            }
                        }

                        break;
                    }
                }
            }

            if ( startedServer ) server.Stop();

            if ( args.Verbose )
            {
                Console.WriteLine( $"Finished ({exported} exported, {skipped} skipped, {failed} failed)" );
            }

            Console.ReadKey();

            return 0;
        }
    }
}
