using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading.Tasks;
using CommandLine;
using ImageMagick;
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

        [Option('p', "url-prefix", HelpText = "Prefix to prepend to each exported URL." )]
        public string UrlPrefix { get; set; } = "";

        [Option('m', "maps", HelpText = "Specific comma separated map names to export (e.g. 'de_dust2,e_mirage,kz_*').", Required = true)]
        public string Maps { get; set; }

        [Option("dry", HelpText = "Don't actually write any files, just test exporting.")]
        public bool DryRun { get; set; }
    }

    partial class Program
    {
        private const int ExportPort = 39281;

        public static ExportOptions ExportOptions { get; private set; }

        public static bool IsExporting { get; private set; }

        private static readonly HashSet<Url> _sExportUrls = new HashSet<Url>();
        private static readonly Queue<Url> _sToExport = new Queue<Url>();

        public static void AddExportUrl( Url url )
        {
            if ( !_sExportUrls.Add( url ) ) return;
            _sToExport.Enqueue( url );
        }

        public static void RemoveExportUrls( Url prefix )
        {
            _sExportUrls.RemoveWhere( x => x.Value.StartsWith( prefix.Value ) );
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

        static bool AreImagesEqual( MagickImage oldImage, MagickImage newImage )
        {
            if (oldImage.Width != newImage.Width || oldImage.Height != newImage.Height || oldImage.ChannelCount != newImage.ChannelCount)
            {
                return false;
            }

            var oldPixels = oldImage.GetPixels();
            var newPixels = newImage.GetPixels();

            for (var y = 0; y < oldImage.Height; ++y)
            {
                for (var x = 0; x < oldImage.Width; ++x)
                {
                    var oldPixel = oldPixels[x, y];
                    var newPixel = newPixels[x, y];

                    for (var c = 0; c < oldImage.ChannelCount; ++c)
                    {
                        if ( oldPixel[c] != newPixel[c] ) return false;
                    }
                }
            }

            return true;
        }

        static void ExportMap( string mapName, ExportOptions args )
        {
            var skipped = 0;
            var failed = 0;
            var exported = 0;
            var oldCount = _sExportUrls.Count;

            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine( $"# Exporting {mapName}" );
            Console.WriteLine();

            AddExportUrl( $"/maps/{mapName}/index.html" );

            MemoryStream dummyStream = null;

            if ( args.DryRun ) dummyStream = new MemoryStream();

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
                        else Console.Write($"[{exported + skipped + failed + 1}/{_sExportUrls.Count - oldCount}] Exporting '{url}' ... ");
                    }

                    var dir = Path.GetDirectoryName(path);
                    if ( !args.DryRun && !Directory.Exists( dir ) )
                    {
                        Directory.CreateDirectory( dir );
                    }

                    var skipStr = skip ? "?skip=1" : "";

                    try
                    {
                        using ( var input = client.OpenRead( $"http://localhost:{ExportPort}{url}{skipStr}" ) )
                        {
                            if ( skip ) continue;

                            if ( Path.GetExtension( path ) == ".png" && File.Exists( path ) )
                            {
                                using ( var newImage = new MagickImage( input, new MagickReadSettings { Format = MagickFormat.Png } ) )
                                {
                                    using ( var oldImage = new MagickImage( path, new MagickReadSettings { Format = MagickFormat.Png } ) )
                                    {
                                        if ( AreImagesEqual( oldImage, newImage ) )
                                        {
                                            if (args.Verbose)
                                            {
                                                Console.ResetColor();
                                                Console.WriteLine($"Skipped '{url}'");
                                            }
                                            
                                            ++exported;
                                            continue;
                                        }
                                    }

                                    ++exported;
                                    if ( !args.DryRun )
                                    {
                                        newImage.Write( path );
                                    }

                                    if (args.Verbose)
                                    {
                                        Console.ForegroundColor = ConsoleColor.Green;
                                        Console.WriteLine($"Wrote {FormatFileSize(new FileInfo( path ).Length)}");
                                    }
                                }

                                continue;
                            }

                            long length = -1;

                            if ( !args.DryRun )
                            {
                                using ( var output = File.Create( path ) )
                                {
                                    input.CopyTo( output );
                                    length = output.Length;
                                }
                            }
                            else
                            {
                                dummyStream.Seek( 0, SeekOrigin.Begin );
                                dummyStream.SetLength( 0 );
                                input.CopyTo( dummyStream );
                                length = dummyStream.Length;
                            }
                            
                            ++exported;

                            if ( args.Verbose )
                            {
                                Console.ForegroundColor = ConsoleColor.Green;
                                Console.WriteLine( $"Wrote {FormatFileSize( length )}" );
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

                            try
                            {
                                using ( var stream = e.Response.GetResponseStream() )
                                {
                                    using ( var reader = new StreamReader( stream ) )
                                    {
                                        Console.WriteLine( reader.ReadToEnd() );
                                    }
                                }
                            }
                            catch ( Exception ex )
                            {
                                Console.WriteLine( ex );
                            }
                        }
                    }
                }
            }

            RemoveExportUrls( $"/maps/{mapName}/" );
            UnloadMap( mapName );

            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine( $"# Finished {mapName} ({exported} exported, {skipped} skipped, {failed} failed)" );
            Console.WriteLine();
        }

        static int Export(ExportOptions args)
        {
            SetBaseOptions(args);
            ExportOptions = args;

            if ( args.UrlPrefix != null && args.UrlPrefix.EndsWith( "/" ) )
            {
                args.UrlPrefix = args.UrlPrefix.Substring( 0, args.UrlPrefix.Length - 1 );
            }

            var server = new Server();
            server.Prefixes.Add( $"http://localhost:{ExportPort}/" );

            AddStaticFileControllers( server );

            server.Controllers.Add( Assembly.GetExecutingAssembly() );

            IsExporting = true;

            var maps = args.Maps.Split( new [] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries );

            Task.Run( () => server.Run() );

            foreach ( var item in maps )
            {
                if ( item.Contains( "*" ) )
                {
                    var pattern = item.ToLower().EndsWith( ".bsp" )
                        ? item
                        : $"{item}.bsp";

                    foreach ( var map in Directory.EnumerateFiles( args.MapsDir, pattern, SearchOption.TopDirectoryOnly ) )
                    {
                        ExportMap( Path.GetFileNameWithoutExtension( map ), args );
                    }
                }
                else
                {
                    var map = item.ToLower().EndsWith( ".bsp" )
                        ? item.Substring( 0, item.Length - ".bsp".Length )
                        : item;

                    ExportMap( map, args );
                }
            }

            server.Stop();

            return 0;
        }
    }
}
