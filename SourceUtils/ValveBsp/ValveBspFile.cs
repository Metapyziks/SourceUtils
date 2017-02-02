using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using SourceUtils.ValveBsp;

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
        
        [BspLump(LumpType.MODELS)]
        public ArrayLump<BspModel> Models { get; private set; }

        [BspLump(LumpType.PLANES)]
        public ArrayLump<Plane> Planes { get; private set; }
        
        [BspLump(LumpType.NODES)]
        public ArrayLump<BspNode> Nodes { get; private set; }
        
        [BspLump(LumpType.LEAFS)]
        public ArrayLump<BspLeaf> Leaves { get; private set; }

        [BspLump(LumpType.VERTEXES)]
        public ArrayLump<Vector3> Vertices { get; private set; }

        [BspLump(LumpType.EDGES)]
        public ArrayLump<Edge> Edges { get; private set; }

        [BspLump(LumpType.SURFEDGES)]
        public ArrayLump<int> SurfEdges { get; private set; }

        [BspLump(LumpType.FACES)]
        public ArrayLump<Face> Faces { get; private set; }

        [BspLump(LumpType.FACES_HDR)]
        public ArrayLump<Face> FacesHdr { get; private set; }

        [BspLump(LumpType.VISIBILITY)]
        public VisibilityLump Visibility { get; private set; }

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

        private Stream GetLumpStream( LumpType type )
        {
            var info = GetLumpInfo( type );
            var stream = new SubStream( _stream, info.Offset, info.Length );
            stream.Seek( 0, SeekOrigin.Begin );
            return stream;
        }

        public void Dispose()
        {
            _stream?.Dispose();
        }
    }
}
