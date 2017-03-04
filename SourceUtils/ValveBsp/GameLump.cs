using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public class GameLump : ILump
        {
            [StructLayout(LayoutKind.Sequential, Pack = 1)]
            private struct Item
            {
                public readonly int Id;
                public readonly ushort Flags;
                public readonly ushort Version;
                public readonly int FileOffset;
                public readonly int FileLength;
            }

            private readonly ValveBspFile _bspFile;
            private Dictionary<int, Item> _items;

            public LumpType LumpType { get; }

            public GameLump( ValveBspFile bspFile, LumpType type )
            {
                _bspFile = bspFile;
                LumpType = type;
            }

            public Stream OpenItem( string id )
            {
                if ( id.Length != 4 ) throw new ArgumentException( "Expected a 4 character id string.", nameof( id ) );

                var idInt = 0;
                for ( var i = 0; i < 4; ++i )
                {
                    idInt |= (id[i] & 0xff) << i;
                }

                return OpenItem( idInt );
            }

            public Stream OpenItem( int id )
            {
                EnsureLoaded();

                var lumpStart = _bspFile.GetLumpInfo( LumpType ).Offset;
                var item = _items[id];

                return new SubStream( _bspFile.GetLumpStream( LumpType ), item.FileOffset - lumpStart, item.FileLength, true );
            }

            private void EnsureLoaded()
            {
                lock ( this )
                {
                    if ( _items != null ) return;

                    _items = new Dictionary<int, Item>();

                    using ( var reader = new BinaryReader( _bspFile.GetLumpStream( LumpType ) ) )
                    {
                        var count = reader.ReadInt32();
                        LumpReader<Item>.ReadLumpFromStream( reader.BaseStream, count, item => _items.Add( item.Id, item ) );
                    }
                }
            }
        }
    }
}
