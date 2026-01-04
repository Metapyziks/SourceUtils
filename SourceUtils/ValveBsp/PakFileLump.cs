using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using ICSharpCode.SharpZipLib.Zip;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public class PakFileLump : DisposingEventTarget<PakFileLump>, ILump, IResourceProvider
        {
            /// <summary>
            /// If true, will write to a file to help debug the contents.
            /// </summary>
            public static bool DebugContents { get; set; }

            public LumpType LumpType { get; }

            private readonly ValveBspFile _bspFile;
            private ZipFile _zipFile;
            private Func<ZipEntry, long> _locateEntry;
            private bool _loaded;

            private readonly Dictionary<string, ZipEntry> _entryDict =
                new Dictionary<string, ZipEntry>( StringComparer.InvariantCultureIgnoreCase );

            public PakFileLump( ValveBspFile bspFile, LumpType type )
            {
                _bspFile = bspFile;
                _loaded = false;
                LumpType = type;
            }

            private void EnsureLoaded()
            {
                lock ( this )
                {
                    if ( _loaded ) return;
                    _loaded = true;

                    _bspFile.Disposing += _ => Dispose();

                    if ( DebugContents )
                    {
                        using ( var stream = _bspFile.GetLumpStream( LumpType ) )
                        {
                            var bytes = new byte[stream.Length];
                            stream.Read( bytes, 0, bytes.Length );
                            File.WriteAllBytes( $"{_bspFile.Name}.pakfile.zip", bytes );
                        }
                    }

                    _zipFile = new ZipFile( _bspFile.GetLumpStream( LumpType ) );

                    // The zip lib doesn't support LZMA, but we'll try to manually decrypt that.
                    // For that, we need to skip testing for supported compression methods.

                    _zipFile.SkipLocalEntryTestsOnLocate = true;

                    _locateEntry = (Func<ZipEntry, long>)typeof( ZipFile )
                       .GetMethod( "LocateEntry", BindingFlags.Instance | BindingFlags.NonPublic )
                       ?.CreateDelegate( typeof( Func<ZipEntry, long> ), _zipFile )
                       ?? throw new Exception( "Can't find ZipFile.LocateEntry method." );

                    _entryDict.Clear();

                    for (var i = 0; i < _zipFile.Count; ++i)
                    {
                        var entry = _zipFile[i];
                        var path = $"/{entry.Name.Replace('\\', '/')}";
                        if (!entry.IsFile || _entryDict.ContainsKey(path)) continue;
                        _entryDict.Add( path, entry );
                    }
                }
            }

            protected override void OnDispose()
            {
                base.OnDispose();

                _zipFile?.Close();
                _zipFile = null;
            }

            public IEnumerable<string> GetFiles( string directory = "" )
            {
                var prefix = $"{directory}/";

                EnsureLoaded();
                return _entryDict.Keys
                    .Where( x => x.StartsWith( prefix, StringComparison.InvariantCultureIgnoreCase ) )
                    .Select( x => x.Substring( prefix.Length ) );
            }

            public IEnumerable<string> GetDirectories( string directory = "" )
            {
                var prefix = $"{directory}/";
                
                EnsureLoaded();
                return _entryDict.Keys
                    .Where( x => x.StartsWith( prefix, StringComparison.InvariantCultureIgnoreCase ) )
                    .Select( x => x.Substring( prefix.Length ) )
                    .Where( x => x.Contains( '/' ) )
                    .Select( x => x.Substring( 0, x.IndexOf( '/' ) ) )
                    .Distinct( StringComparer.InvariantCultureIgnoreCase );
            }

            public bool ContainsFile( string filePath )
            {
                EnsureLoaded();
                return _entryDict.ContainsKey( $"/{filePath}" );
            }

            public Stream OpenFile( string filePath )
            {
                EnsureLoaded();

                var entry = _entryDict[$"/{filePath}"];

                if ( entry.CompressionMethod == CompressionMethod.LZMA )
                {
                    // Not supported by the zip library we're using :(

                    var lumpInfo = _bspFile.GetLumpInfo( LumpType );
                    var offset = lumpInfo.Offset + _locateEntry( entry );
                    var stream = _bspFile.GetSubStream( offset, entry.CompressedSize, ignoreCompression: true );

                    var properties = new byte[5];

                    stream.Read( properties, 0, 2 ); // LZMA version
                    stream.Read( properties, 0, 2 ); // Properties size

                    Debug.Assert( BitConverter.ToUInt16( properties, 0 ) == 5 );

                    stream.Read( properties, 0, 5 );

                    return LzmaDecoderStream.Decode( stream, entry.CompressedSize - 9, entry.Size, properties );
                }

                return _zipFile.GetInputStream( entry );
            }
        }
    }
}
