using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;

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

                public Item(int id, ushort flags, ushort version, int offset, int length)
                {
                    Id = id;
                    Flags = flags;
                    Version = version;
                    FileOffset = offset;
                    FileLength = length;
                }

                public Item WithLength( int length )
                {
                    return new Item( Id, Flags, Version, FileOffset, length );
                }
            }

            private readonly ValveBspFile _bspFile;
            private Dictionary<string, Item> _items;

            public LumpType LumpType { get; }

            public GameLump( ValveBspFile bspFile, LumpType type )
            {
                _bspFile = bspFile;
                LumpType = type;
            }

            private string GetIdString( int id )
            {
                var str = "";

                for ( var i = 0; i < 4 && id >> (i << 3) > 0; ++i )
                {
                    str = (char) ((id >> (i << 3)) & 0x7f) + str;
                }

                return str;
            }

            public ushort GetItemFlags( string id )
            {
                EnsureLoaded();

                return _items[id].Flags;
            }

            public ushort GetItemVersion( string id )
            {
                EnsureLoaded();

                return _items[id].Version;
            }

            public Stream OpenItem( string id )
            {
                EnsureLoaded();

                var item = _items[id];
                return _bspFile.GetSubStream( item.FileOffset, item.FileLength );
            }

            private void EnsureLoaded()
            {
                lock ( this )
                {
                    if ( _items != null ) return;

                    _items = new Dictionary<string, Item>();

                    var bspStream = GetBspStream( _bspFile );

                    using ( var reader = new BinaryReader( _bspFile.GetLumpStream( LumpType ) ) )
                    {
                        var count = reader.ReadInt32();

                        if ( count == 0 ) return;

                        var items = LumpReader<Item>.ReadLumpFromStream( reader.BaseStream, count );

                        var isCompressed = items[items.Length - 1].Id == 0;

                        if ( !isCompressed )
                        {
                            foreach ( var item in items )
                            {
                                _items.Add( GetIdString( item.Id ), item );
                            }

                            return;
                        }

                        // Wiki:
                        //   The compressed size of a game lump can be determined by subtracting the current game
                        //   lump's offset with that of the next entry. For this reason, when game lumps are compressed
                        //   the last game lump is always an empty dummy which only contains the offset. 

                        count -= 1;

                        for ( var i = 0; i < count; i++ )
                        {
                            var item = items[i];
                            var length = items[i + 1].FileOffset - item.FileOffset;

                            _items.Add( GetIdString( item.Id ), item.WithLength( length ) );
                        }
                    }
                }
            }
        }
    }
}
