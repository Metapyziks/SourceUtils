using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace SourceUtils
{
    public partial class ValveBspFile : IDisposable
    {
        private class Header
        {
            public const int LumpInfoCount = 64;

            public static Header Read( BinaryReader reader )
            {
                var header = new Header
                {
                    Identifier = reader.ReadInt32(),
                    Version = reader.ReadInt32()
                };

                var lumpInfoBytes = reader.ReadBytes( LumpInfoCount * Marshal.SizeOf( typeof(LumpInfo) ) );
                var lumps = LumpReader<LumpInfo>.ReadLump( lumpInfoBytes, 0, lumpInfoBytes.Length );

                header.Lumps = lumps;
                header.MapRevision = reader.ReadInt32();

                return header;
            }

            public int Identifier;
            public int Version;
            public LumpInfo[] Lumps;
            public int MapRevision;
        }

        [BspLump(LumpType.VERTEXES)]
        public ArrayLump<Vector3> Vertices { get; private set; }

        private readonly Stream _stream;
        private readonly Header _header;

        public ValveBspFile( Stream stream )
        {
            _stream = stream;

            InitializeLumps();

            using ( var reader = new BinaryReader( stream, Encoding.ASCII, true ) )
            {
                _header = Header.Read( reader );
            }
        }

        private LumpInfo GetLumpInfo( LumpType type )
        {
            var lumpIndex = (int) type;
            if ( lumpIndex < 0 || lumpIndex >= _header.Lumps.Length )
            {
                throw new ArgumentOutOfRangeException( nameof( type ) );
            }

            return _header.Lumps[lumpIndex];
        }

        private int GetLumpLength<T>( LumpType type )
            where T : struct
        {
            var info = GetLumpInfo( type );
            return info.Length / Marshal.SizeOf<T>();
        }

        private int ReadLumpValues<T>( LumpType type, int srcOffset, T[] dst, int dstOffset, int count )
            where T : struct
        {
            var info = GetLumpInfo( type );
            var tSize = Marshal.SizeOf<T>();
            var length = info.Length / tSize;

            if ( srcOffset > length ) srcOffset = length;
            if ( srcOffset + count > length ) count = length - srcOffset;

            if ( count <= 0 ) return 0;

            _stream.Seek( info.Offset + tSize * srcOffset, SeekOrigin.Begin );
            LumpReader<T>.ReadLumpFromStream( _stream, count, dst, dstOffset );
            return count;
        }

        public void Dispose()
        {
            _stream?.Dispose();
        }
    }
}
