using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ICSharpCode.SharpZipLib.Zip;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public class PakFileLump : ILump, IResourceProvider, IDisposable
        {
            [ThreadStatic]
            private static Dictionary<PakFileLump, ZipFile> _sArchivePool;

            private static ZipFile GetZipArchive( PakFileLump pak )
            {
                if (_sArchivePool == null) _sArchivePool = new Dictionary<PakFileLump, ZipFile>();

                ZipFile archive;
                if ( _sArchivePool.TryGetValue( pak, out archive ) ) return archive;

                archive = new ZipFile( pak._bspFile.GetLumpStream( pak.LumpType ) );
                _sArchivePool.Add( pak, archive );

                lock ( pak._threadArchives )
                {
                    pak._threadArchives.Add( archive );
                }

                return archive;
            }

            public LumpType LumpType { get; }

            private readonly List<ZipFile> _threadArchives = new List<ZipFile>();

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

                    using ( var archive = new ZipFile( _bspFile.GetLumpStream( LumpType ) ) )
                    {
                        _entryDict.Clear();
                        for ( var i = 0; i < archive.Count; ++i )
                        {
                            var entry = archive[i];
                            if ( !entry.IsFile ) continue;
                            _entryDict.Add( $"/{entry.Name}", i );
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

            public void Dispose()
            {
                lock ( _threadArchives )
                {
                    foreach ( var archive in _threadArchives )
                    {
                        archive.Close();
                    }

                    _threadArchives.Clear();
                }
            }
        }
    }
}
