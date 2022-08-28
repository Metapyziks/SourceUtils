using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using Decoder = SevenZip.Sdk.Compression.Lzma.Decoder;

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

                // Find index of current lump
                var keyArray = _items.Keys.ToArray();
                int index = -1;
                for ( int i = 0; i < keyArray.Length; i++ )
                {
                    if ( keyArray[i] == id )
                    {
                        index = i;
                        break;
                    }
                }

                // https://developer.valvesoftware.com/wiki/Source_BSP_File_Format#Lump_compression
                // Get the actual length of the item using offset of the next item.
                var valueArray = _items.Values.ToArray();
                var actualLength = item.FileLength;
                if ( index != -1 )
                {
                    if ( index < _items.Count - 1 )
                    {
                        // The last game lump is /supposed/ to be a dummy containing nothing but the offset,
                        // but sometimes the offset is 0 which would result in negative actualLength.
                        if ( valueArray[index + 1].FileOffset > valueArray[index].FileOffset )
                        {
                            actualLength = valueArray[index + 1].FileOffset - valueArray[index].FileOffset;
                        }
                    }
                }

                var stream = _bspFile.GetSubStream( item.FileOffset, actualLength );

                LzmaHeader lzmaHeader;
                try
                {
                    lzmaHeader = LzmaHeader.Read( stream );
                }
                catch ( NotSupportedException e )
                {
                    stream.Seek( 0, SeekOrigin.Begin );
                    return stream;
                }

                using ( var compressedStream =
                        _bspFile.GetSubStream( item.FileOffset + LzmaHeader.Size, lzmaHeader.LzmaSize ) )
                {
                    using ( var uncompressedStream = new MemoryStream( ( int )lzmaHeader.ActualSize ) )
                    {
                        Decoder decoder = new Decoder();
                        decoder.SetDecoderProperties( lzmaHeader.Properties );
                        decoder.Code( compressedStream, uncompressedStream, lzmaHeader.LzmaSize,
                            lzmaHeader.ActualSize, null );
                        stream = new MemoryStream( ( int )stream.Length );
                        uncompressedStream.Seek( 0, SeekOrigin.Begin );
                        uncompressedStream.CopyTo( stream );
                    }
                }

                stream.Seek( 0, SeekOrigin.Begin );
                return stream;
            }

            private void EnsureLoaded()
            {
                lock ( this )
                {
                    if ( _items != null ) return;

                    _items = new Dictionary<string, Item>();

                    using ( var reader = new BinaryReader( _bspFile.GetLumpStream( LumpType ) ) )
                    {
                        var count = reader.ReadInt32();
                        LumpReader<Item>.ReadLumpFromStream( reader.BaseStream, count, item =>
                        {
                            if ( !_items.ContainsKey( GetIdString( item.Id ) ) )
                            {
                                _items.Add( GetIdString( item.Id ), item );
                            }
                        } );
                    }
                }
            }
        }
    }
}
