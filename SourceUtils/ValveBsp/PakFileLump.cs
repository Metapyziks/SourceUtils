using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public class PakFileLump : ILump, IResourceProvider
        {
            public LumpType LumpType { get; }

            private readonly ValveBspFile _bspFile;
            private ZipArchive _archive;

            private readonly Dictionary<string, ZipArchiveEntry> _entryDict =
                new Dictionary<string, ZipArchiveEntry>( StringComparer.InvariantCultureIgnoreCase );

            public PakFileLump( ValveBspFile bspFile, LumpType type )
            {
                _bspFile = bspFile;
                LumpType = type;
            }

            private void EnsureLoaded()
            {
                if ( _archive != null ) return;
                _archive = new ZipArchive( _bspFile.GetLumpStream( LumpType ), ZipArchiveMode.Read );

                _entryDict.Clear();
                foreach ( var entry in _archive.Entries )
                {
                    _entryDict.Add( $"/{entry.FullName}", entry );
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
                return _entryDict[$"/{filePath}"].Open();
            }
        }
    }
}
