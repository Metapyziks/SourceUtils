using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using CommandLine;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    class BaseOptions
    {
        [Option('g', "gamedir", HelpText = "Game directory to export from.", Required = true)]
        public string GameDir { get; set; }

        [Option('l', "loosedir", HelpText = "(Additional) directory to load loose files from.")]
        public string LooseDir { get; set; }

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

            var loader = new ResourceLoader();

            if (!string.IsNullOrEmpty(args.LooseDir))
            {
                loader.AddResourceProvider(new FSLoader(args.LooseDir));
            }

            foreach ( var path in vpkNames )
            {
                if ( path.Contains( "*" ) )
                {
                    var wildcardPath = path.Replace( '/', '\\' );
                    var parts = wildcardPath.Split( '\\' );

                    var file = parts.Last();
                    var folder = @"";
                    for ( int i = 0; i < parts.Length - 1; i++ )
                    {
                        folder += parts[i] + "\\";
                    }

                    var paths = Directory.GetFiles( folder, file );
                    foreach ( var p in paths )
                    {
                        loader.AddResourceProvider( new ValvePackage( p ) );
                    }

                    continue;
                }
                loader.AddResourceProvider( new ValvePackage( path ) );
            }

            Resources = loader;

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

        private struct Range
        {
            public readonly int Min;
            public readonly int Max;

            public int Length => Max - Min;

            public Range(int min, int max)
            {
                Min = min;
                Max = max;
            }

            public override string ToString()
            {
                return $"({Min}, {Max})";
            }
        }

        [ThreadStatic]
        static byte[] _sClearBuffer;

        static int NextPowerOfTwo(int value)
        {
            var po2 = 1;
            while (po2 < value) po2 <<= 1;
            return po2;
        }

        static void ClearRange(Stream mdlStream, Range range, List<Range> ranges)
        {
            if (_sClearBuffer == null || _sClearBuffer.Length < range.Length)
            {
                _sClearBuffer = new byte[NextPowerOfTwo(range.Length)];
            }

            if (BaseOptions.Verbose)
            {
                WriteVerbose($"Clearing range from: 0x{range.Min:x8}, to: 0x{range.Max:x8}");
            }

            mdlStream.Seek(range.Min, SeekOrigin.Begin);
            mdlStream.Write(_sClearBuffer, 0, range.Length);

            for (var i = ranges.Count - 1; i >= 0; --i)
            {
                var next = ranges[i];

                if (next.Min > range.Max) continue;
                if (next.Max < range.Min)
                {
                    ranges.Insert(i + 1, range);
                    return;
                }

                ranges.RemoveAt(i);
                range = new Range(Math.Min(next.Min, range.Min), Math.Max(next.Max, range.Max));
            }

            ranges.Insert(0, range);
        }

        [ThreadStatic]
        private static byte[] _sReadInt32Buffer;

        static int ReadInt32(Stream stream, int offset)
        {
            if (_sReadInt32Buffer == null)
            {
                _sReadInt32Buffer = new byte[sizeof(int)];
            }

            stream.Seek(offset, SeekOrigin.Begin);
            stream.Read(_sReadInt32Buffer, 0, sizeof(int));

            return BitConverter.ToInt32(_sReadInt32Buffer, 0);
        }

        static void WriteInt32(Stream stream, int offset, int value)
        {
            stream.Seek(offset, SeekOrigin.Begin);
            stream.Write(BitConverter.GetBytes(value), 0, sizeof(int));
        }

        static int AppendString(Stream mdlStream, string value, List<Range> ranges)
        {
            var bytes = Encoding.ASCII.GetBytes(value);
            var offset = -1;

            for (var i = 0; i < ranges.Count; ++i)
            {
                var range = ranges[i];
                if (range.Length <= bytes.Length) continue;

                offset = range.Min;
                range = new Range(range.Min + bytes.Length + 1, range.Max);

                if (range.Length <= 0)
                {
                    ranges.RemoveAt(i);
                }
                else
                {
                    ranges[i] = range;
                }

                break;
            }

            Debug.Assert(offset != -1);

            mdlStream.Seek(offset, SeekOrigin.Begin);
            mdlStream.Write(bytes, 0, bytes.Length);
            mdlStream.WriteByte(0x00);

            if (BaseOptions.Verbose)
            {
                WriteVerbose($"Appending string: \"{value}\", at: 0x{offset:x8}.");
            }

            return offset;
        }

        static void WriteSeparator()
        {
            if (BaseOptions.Verbose)
            {
                Console.WriteLine();
            }
        }

        static void WriteVerbose(string message)
        {
            if (BaseOptions.Verbose)
            {
                Console.WriteLine(message);
            }
        }

        static void WriteVerboseHeader(string label)
        {
            if (BaseOptions.Verbose)
            {
                WriteSeparator();
                WriteVerbose("#");
                WriteVerbose($"# {label}");
                WriteVerbose("#");
                WriteSeparator();
            }
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

            using (var outStream = new MemoryStream())
            {
                using (var inStream = Resources.OpenFile(args.InputPath))
                {
                    inStream.CopyTo(outStream);
                }

                var empty = new List<Range> { new Range(mdl.FileHeader.Length, int.MaxValue) };

                var commands = new List<ReplacementCommand>();
                var shouldOverrideFlags = false;
                StudioModelFile.Flags overrideFlags = 0;

                if (args.Replace.Any() || args.Flags != null)
                {
                    WriteVerboseHeader("Commands");

                    foreach (var replaceStr in args.Replace)
                    {
                        ReplacementCommand cmd;
                        if (!ReplacementCommand.TryParse(replaceStr, out cmd))
                        {
                            Console.Error.WriteLine($"Unable to parse replacement command '{replaceStr}'.");
                            return 1;
                        }

                        WriteVerbose($"Replacing {cmd.Type}[{cmd.Index}] with \"{cmd.Value}\"");

                        commands.Add(cmd);
                    }

                    WriteSeparator();

                    if (args.Flags != null)
                    {
                        shouldOverrideFlags = true;

                        foreach (var flagStr in args.Flags.Split(',', ';', '|'))
                        {
                            var trimmedString = flagStr.TrimStart();

                            int flagInt;
                            StudioModelFile.Flags flagValue;
                            var numberStyle = NumberStyles.Integer;

                            if (trimmedString.StartsWith("0x"))
                            {
                                numberStyle = NumberStyles.HexNumber;
                                trimmedString = trimmedString.Substring("0x".Length);
                            }

                            if (int.TryParse(trimmedString, numberStyle, CultureInfo.InvariantCulture, out flagInt))
                            {
                                overrideFlags |= (StudioModelFile.Flags) flagInt;
                            }
                            else if (Enum.TryParse(trimmedString, true, out flagValue))
                            {
                                overrideFlags |= flagValue;
                            }
                            else
                            {
                                Console.Error.WriteLine($"Unexpected model flag value \"{trimmedString}\".");
                                return 1;
                            }
                        }

                        WriteVerbose($"Override model flags: {overrideFlags:x}:");

                        foreach (StudioModelFile.Flags value in Enum.GetValues(typeof(StudioModelFile.Flags)))
                        {
                            if ((overrideFlags & value) != 0)
                            {
                                WriteVerbose($" - {value}");
                            }
                        }

                        WriteSeparator();
                    }
                }

                WriteVerboseHeader("Input Model");
                WriteVerbose($"Existing model flags: {mdl.FileHeader.Flags:x}:");

                foreach (StudioModelFile.Flags value in Enum.GetValues(typeof(StudioModelFile.Flags)))
                {
                    if ((mdl.FileHeader.Flags & value) != 0)
                    {
                        WriteVerbose($" - {value}");
                    }
                }

                WriteSeparator();
                WriteVerbose($"Model has {mdl.TextureDirectories.Count} material directories:");

                var i = 0;
                foreach (var texDir in mdl.TextureDirectories)
                {
                    var indexOffset = mdl.FileHeader.CdTextureIndex + sizeof(int) * i;
                    var index = ReadInt32(outStream, indexOffset);

                    ClearRange(outStream, new Range(index, index + texDir.Length + 1), empty);

                    if (!commands.Any(x => x.Type == ReplacementType.Directory && (x.Wildcard || x.Index == i)))
                    {
                        commands.Add(new ReplacementCommand(ReplacementType.Directory, i, texDir));
                    }

                    WriteVerbose($" [{i}]: {texDir}");

                    ++i;
                }

                WriteSeparator();
                WriteVerbose($"Model has {mdl.TextureNames.Count} material names:");

                i = 0;
                foreach (var texName in mdl.TextureNames)
                {
                    var texOffset = mdl.FileHeader.TextureIndex + Marshal.SizeOf<StudioModelFile.StudioTexture>() * i;
                    var index = texOffset + mdl.Textures[i].NameIndex;

                    ClearRange(outStream, new Range(index, index + texName.Length + 1), empty);

                    if (!commands.Any(x => x.Type == ReplacementType.Name && (x.Wildcard || x.Index == i)))
                    {
                        commands.Add(new ReplacementCommand(ReplacementType.Name, i, texName));
                    }

                    WriteVerbose($" [{i}]: {texName}");

                    ++i;
                }

                if (args.Replace.Any() || shouldOverrideFlags)
                {
                    WriteVerboseHeader("Applying Commands");

                    if (args.Replace.Any())
                    {
                        commands.Sort((a, b) => a.Type != b.Type
                            ? a.Type.CompareTo(b.Type)
                            : a.Index - b.Index);

                        foreach (var cmd in commands)
                        {
                            switch (cmd.Type)
                            {
                                case ReplacementType.Directory:
                                {
                                    var startIndex = cmd.Wildcard ? 0 : cmd.Index;
                                    var endIndex = cmd.Wildcard ? mdl.TextureDirectories.Count : cmd.Index + 1;

                                    for (var index = startIndex; index < endIndex; ++index)
                                    {
                                        var indexOffset = mdl.FileHeader.CdTextureIndex + sizeof(int) * index;
                                        var original = mdl.TextureDirectories[index];
                                        var newIndex = AppendString(outStream, cmd.GetFormattedValue(index, original), empty);

                                        WriteVerbose($" - Writing directory index: 0x{newIndex:x8}, at: 0x{indexOffset:x8}.");
                                        WriteInt32(outStream, indexOffset, newIndex);
                                    }
                                    break;
                                }
                                case ReplacementType.Name:
                                {
                                    var startIndex = cmd.Wildcard ? 0 : cmd.Index;
                                    var endIndex = cmd.Wildcard ? mdl.TextureNames.Count : cmd.Index + 1;

                                    for (var index = startIndex; index < endIndex; ++index)
                                    {
                                        var texOffset = mdl.FileHeader.TextureIndex + Marshal.SizeOf<StudioModelFile.StudioTexture>() * index;
                                        var indexOffset = texOffset + StudioModelFile.StudioTexture.NameIndexOffset;
                                        var original = mdl.TextureNames[index];
                                        var newIndex = AppendString(outStream, cmd.GetFormattedValue(index, original), empty);

                                        WriteVerbose($" - Writing name index: 0x{newIndex:x8}, at: 0x{indexOffset:x8}.");
                                        WriteInt32(outStream, indexOffset, newIndex - texOffset);
                                    }
                                    break;
                                }
                            }
                        }

                        var length = empty.Last().Min;

                        outStream.SetLength(length);

                        WriteVerbose($" - Writing file length: 0x{length:x8}, at: 0x{StudioModelFile.Header.LengthOffset:x8}.");
                        WriteInt32(outStream, StudioModelFile.Header.LengthOffset, length);
                    }

                    if (shouldOverrideFlags)
                    {
                        WriteVerbose($" - Writing model flags: 0x{overrideFlags:x}, at: 0x{StudioModelFile.Header.FlagsOffset:x8}.");
                        WriteInt32(outStream, StudioModelFile.Header.FlagsOffset, (int)overrideFlags);
                    }
                }

                if (!string.IsNullOrEmpty(args.OutputPath))
                {
                    WriteVerboseHeader("Output");

                    var fullOutPath = new FileInfo(args.OutputPath).FullName;

                    WriteVerbose($"Writing output to \"{fullOutPath}\"...");

                    outStream.Seek(0, SeekOrigin.Begin);

                    var dir = Path.GetDirectoryName(fullOutPath);
                    if (dir != null && !Directory.Exists(dir))
                    {
                        Directory.CreateDirectory(dir);
                    }

                    using (var fileStream = File.Create(fullOutPath))
                    {
                        outStream.CopyTo(fileStream);
                    }
                }
            }

            return 0;
        }

        static int ModelExtract(MaterialExtractOptions args)
        {
            SetBaseOptions(args);

            var mdl = StudioModelFile.FromProvider(args.InputPath, Resources);

            if (mdl == null)
            {
                Console.Error.WriteLine($"Unable to find model at path '{args.InputPath}'!");
                return 1;
            }

            for (var i = 0; i < mdl.MaterialCount; ++i)
            {
                var srcPath = mdl.GetMaterialName(i, Resources);

                if (!Resources.ContainsFile(srcPath))
                {
                    continue;
                }

                Console.WriteLine(srcPath);

                if (args.OutputPath != null)
                {
                    var dstPath = Path.Combine(args.OutputPath, srcPath);
                    var dstDir = Path.GetDirectoryName(dstPath);

                    if (dstDir != null && !Directory.Exists(dstDir))
                    {
                        Directory.CreateDirectory(dstDir);
                    }

                    using (var src = Resources.OpenFile(srcPath))
                    using (var dst = File.Create(dstPath))
                    {
                        src.CopyTo(dst);
                    }
                }
            }

            return 0;
        }

        static int Main(string[] args)
        {
            var culture = new CultureInfo("en-US");
            Thread.CurrentThread.CurrentCulture = culture;
            Thread.CurrentThread.CurrentUICulture = culture;

            var result = Parser.Default.ParseArguments<ExportOptions, HostOptions, ModelPatchOptions, MaterialExtractOptions>( args );
            return result.MapResult<ExportOptions, HostOptions, ModelPatchOptions, MaterialExtractOptions, int>( Export, Host, ModelPatch, ModelExtract, _ => 1 );
        }
    }
}
