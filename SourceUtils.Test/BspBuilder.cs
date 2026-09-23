using System;
using System.Collections.Generic;
using System.IO;

namespace SourceUtils.Test
{
    using LumpType = ValveBspFile.LumpType;

    /// <summary>
    /// Writes a minimal version 20 BSP file holding only the lumps a test gives it.
    /// </summary>
    internal class BspBuilder
    {
        private const int LumpCount = 64;
        private const int HeaderSize = 4 + 4 + LumpCount * 16 + 4;

        private readonly Dictionary<LumpType, KeyValuePair<byte[], int>> _lumps
            = new Dictionary<LumpType, KeyValuePair<byte[], int>>();

        public BspBuilder Lump( LumpType type, byte[] data, int version = 0 )
        {
            _lumps[type] = new KeyValuePair<byte[], int>( data, version );
            return this;
        }

        public string Write()
        {
            var path = Path.Combine( Path.GetTempPath(), $"sourceutils-test-{Guid.NewGuid():N}.bsp" );

            using ( var writer = new BinaryWriter( File.Create( path ) ) )
            {
                writer.Write( new[] { (byte) 'V', (byte) 'B', (byte) 'S', (byte) 'P' } );
                writer.Write( 20 );

                var offset = HeaderSize;

                for ( var i = 0; i < LumpCount; ++i )
                {
                    KeyValuePair<byte[], int> lump;
                    if ( !_lumps.TryGetValue( (LumpType) i, out lump ) )
                    {
                        writer.Write( offset );
                        writer.Write( 0 );
                        writer.Write( 0 );
                        writer.Write( new byte[4] );
                        continue;
                    }

                    writer.Write( offset );
                    writer.Write( lump.Key.Length );
                    writer.Write( lump.Value );
                    writer.Write( new byte[4] );

                    offset += lump.Key.Length;
                }

                writer.Write( 0 );

                for ( var i = 0; i < LumpCount; ++i )
                {
                    KeyValuePair<byte[], int> lump;
                    if ( _lumps.TryGetValue( (LumpType) i, out lump ) ) writer.Write( lump.Key );
                }
            }

            return path;
        }

        /// <summary>
        /// Writes the file, opens it for <paramref name="action"/> and deletes it afterwards.
        /// </summary>
        public void With( Action<ValveBspFile> action )
        {
            var path = Write();

            try
            {
                using ( var bsp = new ValveBspFile( path ) )
                {
                    action( bsp );
                }
            }
            finally
            {
                File.Delete( path );
            }
        }
    }
}
