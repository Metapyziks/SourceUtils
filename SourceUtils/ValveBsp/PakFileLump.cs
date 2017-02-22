using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public class PakFileLump : ILump, IResourceProvider, IDisposable
        {
            [ThreadStatic]
            private static Dictionary<PakFileLump, ZipArchive> _sArchivePool;

            private static ZipArchive GetZipArchive( PakFileLump pak )
            {
                if (_sArchivePool == null) _sArchivePool = new Dictionary<PakFileLump, ZipArchive>();

                ZipArchive archive;
                if ( _sArchivePool.TryGetValue( pak, out archive ) ) return archive;

                archive = new ZipArchive( pak._bspFile.GetLumpStream( pak.LumpType ), ZipArchiveMode.Read );
                _sArchivePool.Add( pak, archive );

                lock ( pak._threadArchives )
                {
                    pak._threadArchives.Add( archive );
                }

                return archive;
            }

            public LumpType LumpType { get; }

            private readonly List<ZipArchive> _threadArchives = new List<ZipArchive>();

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

                    using ( var archive = new ZipArchive( _bspFile.GetLumpStream( LumpType ), ZipArchiveMode.Read ) )
                    {
                        _entryDict.Clear();
                        for ( var i = 0; i < archive.Entries.Count; ++i )
                        {
                            var entry = archive.Entries[i];
                            _entryDict.Add( $"/{entry.FullName}", i );
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
                return GetZipArchive( this ).Entries[_entryDict[$"/{filePath}"]].Open();
            }

            public void Dispose()
            {
                lock ( _threadArchives )
                {
                    foreach ( var archive in _threadArchives )
                    {
                        archive.Dispose();
                    }

                    _threadArchives.Clear();
                }
            }
        }
    }
}
