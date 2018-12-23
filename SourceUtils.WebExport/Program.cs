using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
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

        [Option("debug-materials", HelpText = "Include all material properties.")]
        public bool DebugMaterials { get; set; }
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
        private static Dictionary<string, string> _sWorkshopMaps;

        public static IResourceProvider Resources { get; private set; }

        private static void FindWorkshopMaps()
        {
            _sWorkshopMaps = new Dictionary<string, string>();

            var workshopDir = Path.Combine( BaseOptions.MapsDir, "workshop" );

            if ( !Directory.Exists( workshopDir ) ) return;

            foreach ( var directory in Directory.GetDirectories( workshopDir ) )
            {
                ulong workshopId;
                if ( !ulong.TryParse( Path.GetFileName( directory ), out workshopId ) ) continue;

                foreach ( var bsp in Directory.GetFiles( directory, "*.bsp", SearchOption.TopDirectoryOnly ) )
                {
                    var name = Path.GetFileNameWithoutExtension( bsp ).ToLower();
                    if ( !_sWorkshopMaps.ContainsKey( name ) )
                    {
                        _sWorkshopMaps.Add( name, bsp );
                    }
                }
            }
        }

        public static ValveBspFile GetMap( string name )
        {
            ValveBspFile map;
            if ( _sOpenMaps.TryGetValue( name, out map ) ) return map;

            if ( _sWorkshopMaps == null ) FindWorkshopMaps();

            if ( !_sWorkshopMaps.TryGetValue( name.ToLower(), out string bspPath ) )
            {
                bspPath = Path.Combine( BaseOptions.MapsDir, $"{name}.bsp" );
            }

            map = new ValveBspFile( bspPath );
            _sOpenMaps.Add( name, map );

            return map;
        }

        public static void UnloadMap( string name )
        {
            if ( !_sOpenMaps.TryGetValue( name, out var map ) ) return;

            _sOpenMaps.Remove( name );
            map.Dispose();
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

        private static readonly byte[] _sIntBuffer = new byte[4];

        static int AppendString(Stream mdlStream, string value, ref int length)
        {
            var offset = length;

            var bytes = Encoding.ASCII.GetBytes(value);
            mdlStream.Seek(length, SeekOrigin.Begin);
            mdlStream.Write(bytes, 0, bytes.Length);
            mdlStream.WriteByte(0x00);

            length += bytes.Length + 1;

            if (BaseOptions.Verbose)
            {
                Console.WriteLine($"Appending string: \"{value}\", at: 0x{offset:x8}, new length: 0x{length:x8}.");
            }

            return offset;
        }

        static int ModelPatch( ModelPatchOptions args )
        {
            SetBaseOptions( args );

            var mdl = StudioModelFile.FromProvider( args.InputPath, Resources );

            if ( mdl == null )
            {
                Console.Error.WriteLine( $"Unable to find model at path '{args.InputPath}'!");
                return 1;
            }

            if ( args.Verbose )
            {
                Console.WriteLine($"Model has {mdl.TextureDirectories.Count()} material directories:");

                var i = 0;
                foreach (var texName in mdl.TextureDirectories)
                {
                    Console.WriteLine($" [{i++}]: {texName}");
                }

                Console.WriteLine();
                Console.WriteLine($"Model has {mdl.TextureNames.Count()} material names:");

                i = 0;
                foreach (var texName in mdl.TextureNames)
                {
                    Console.WriteLine($" [{i++}]: {texName}");
                }

                Console.WriteLine();
            }

            var commands = new List<ReplacementCommand>();

            foreach (var replaceStr in args.Replace)
            {
                ReplacementCommand cmd;
                if (!ReplacementCommand.TryParse(replaceStr, out cmd))
                {
                    Console.Error.WriteLine($"Unable to parse replacement command '{replaceStr}'.");
                    return 1;
                }

                if (args.Verbose)
                {
                    Console.WriteLine($"Replacing {cmd.Type}[{cmd.Index}] with \"{cmd.Value}\"");
                }

                commands.Add(cmd);
            }

            if (args.Verbose)
            {
                Console.WriteLine();
                Console.WriteLine("Applying commands:");
            }

            using (var outStream = new MemoryStream())
            {
                using (var inStream = Resources.OpenFile(args.InputPath))
                {
                    inStream.CopyTo(outStream);
                }

                var length = mdl.FileHeader.Length;

                foreach (var cmd in commands)
                {
                    switch (cmd.Type)
                    {
                        case ReplacementType.Directory:
                        {
                            var indexOffset = mdl.FileHeader.CdTextureIndex + sizeof(int) * cmd.Index;
                            var newIndex = AppendString(outStream, cmd.Value, ref length);

                            if (args.Verbose)
                            {
                                Console.WriteLine($"- Writing directory index: 0x{newIndex:x8}, at: 0x{indexOffset:x8}.");
                            }

                            outStream.Seek(indexOffset, SeekOrigin.Begin);
                            outStream.Write(BitConverter.GetBytes(newIndex), 0, sizeof(int));
                            break;
                        }
                        case ReplacementType.Name:
                        {
                            var texOffset = mdl.FileHeader.TextureIndex + Marshal.SizeOf<StudioModelFile.StudioTexture>() * cmd.Index;
                            var indexOffset = texOffset + StudioModelFile.StudioTexture.NameIndexOffset;
                            var newIndex = AppendString(outStream, cmd.Value, ref length);

                            if (args.Verbose)
                            {
                                Console.WriteLine($"- Writing name index: 0x{newIndex:x8}, at: 0x{indexOffset:x8}.");
                            }

                            outStream.Seek(indexOffset, SeekOrigin.Begin);
                            outStream.Write(BitConverter.GetBytes(newIndex), 0, sizeof(int));

                            break;
                        }
                    }
                }

                if (args.Verbose)
                {
                    Console.WriteLine($"- Writing file length: 0x{length:x8}, at: 0x{StudioModelFile.Header.LengthOffset:x8}.");
                }

                outStream.Seek(StudioModelFile.Header.LengthOffset, SeekOrigin.Begin);
                outStream.Write(BitConverter.GetBytes(length), 0, sizeof(int));

                if (!string.IsNullOrEmpty(args.OutputPath))
                {
                    var fullOutPath = new FileInfo(args.OutputPath).FullName;

                    if (args.Verbose)
                    {
                        Console.WriteLine();
                        Console.WriteLine($"Writing output to \"{fullOutPath}\"...");
                    }

                    outStream.Seek(0, SeekOrigin.Begin);

                    using (var fileStream = File.Create(fullOutPath))
                    {
                        outStream.CopyTo(fileStream);
                    }
                }
            }

            if (args.Verbose)
            {
                Console.WriteLine("Press any key to exit...");
                Console.ReadKey(true);
            }

            return 0;
        }

        static int Main(string[] args)
        {
            var result = Parser.Default.ParseArguments<ExportOptions, HostOptions, ModelPatchOptions>( args );
            return result.MapResult<ExportOptions, HostOptions, ModelPatchOptions, int>( Export, Host, ModelPatch, _ => 1 );
        }
    }
}
