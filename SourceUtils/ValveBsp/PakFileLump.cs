using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using SevenZip;

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

            [ThreadStatic]
            private static Dictionary<PakFileLump, Stream> _sArchivePool;

            private static Stream GetPakStream( PakFileLump pak )
            {
                var pool = _sArchivePool ?? (_sArchivePool = new Dictionary<PakFileLump, Stream>());

                Stream stream;
                if ( pool.TryGetValue( pak, out stream ) ) return stream;

                stream = pak._bspFile.GetLumpStream( pak.LumpType );

                pak.Disposing += _ =>
                {
                    pool.Remove( pak );
                    stream.Close();
                    stream.Dispose();
                };

                pool.Add( pak, stream );

                return stream;
            }

            public LumpType LumpType { get; }

            private readonly ValveBspFile _bspFile;
            private bool _loaded;

            private readonly Dictionary<string, int> _entryDict =
                new Dictionary<string, int>( StringComparer.InvariantCultureIgnoreCase );

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

                    using ( var stream = _bspFile.GetLumpStream( LumpType ) )
                    {
                        using ( var extractor = new SevenZipExtractor( stream ) )
                        {
                            _entryDict.Clear();
                            for ( var i = 0; i < extractor.FilesCount; ++i )
                            {
                                var entryName = extractor.ArchiveFileNames[i];
                                var path = $"/{entryName.Replace( '\\', '/' )}";
                                _entryDict.Add( path, i );
                            }
                        }
                    }
                }
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

                var stream = GetPakStream( this );
                var outStream = new MemoryStream();
                using ( var extractor = new SevenZipExtractor( stream ) )
                {
                    filePath = filePath.Replace( '/', '\\' );
                    try
                    {
                        extractor.ExtractFile( filePath, outStream );
                    }
                    catch ( ArgumentOutOfRangeException )
                    {
                        // File not found, try lower case variant
                        try
                        {
                            // TODO: are all files lowercase in PakFiles?
                            // should we do this before trying to extract the first time?
                            filePath = filePath.ToLower();
                            extractor.ExtractFile( filePath, outStream );
                        }
                        catch ( ArgumentOutOfRangeException )
                        {
                            return null;
                        }
                    }
                }

                outStream.Seek( 0, SeekOrigin.Begin );
                return outStream;
            }
        }
    }
}
