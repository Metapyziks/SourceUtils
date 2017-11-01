using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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

            [ThreadStatic]
            private static Dictionary<PakFileLump, ZipFile> _sArchivePool;

            private static ZipFile GetZipArchive( PakFileLump pak )
            {
                var pool = _sArchivePool ?? (_sArchivePool = new Dictionary<PakFileLump, ZipFile>());

                ZipFile archive;
                if ( pool.TryGetValue( pak, out archive ) ) return archive;

                archive = new ZipFile( pak._bspFile.GetLumpStream( pak.LumpType ) );

                pak.Disposing += _ =>
                {
                    pool.Remove( pak );
                    archive.Close();
                };

                pool.Add( pak, archive );

                return archive;
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

                    using ( var archive = new ZipFile( _bspFile.GetLumpStream( LumpType ) ) )
                    {
                        _entryDict.Clear();
                        for ( var i = 0; i < archive.Count; ++i )
                        {
                            var entry = archive[i];
                            var path = $"/{entry.Name.Replace( '\\', '/' )}";
                            if ( !entry.IsFile || _entryDict.ContainsKey( path ) ) continue;
                            _entryDict.Add( path, i );
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
                var archive = GetZipArchive( this );
                return archive.GetInputStream( _entryDict[$"/{filePath}"] );
            }
        }
    }
}
