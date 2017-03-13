using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using SourceUtils.ValveBsp;
using SourceUtils.ValveBsp.Entities;

namespace SourceUtils
{
    public partial class ValveBspFile : IDisposable
    {
        [ThreadStatic]
        private static Dictionary<ValveBspFile, Stream> _sStreamPool;

        private static Stream GetBspStream( ValveBspFile bsp )
        {
            if (_sStreamPool == null) _sStreamPool = new Dictionary<ValveBspFile, Stream>();

            Stream stream;
            if ( _sStreamPool.TryGetValue( bsp, out stream ) ) return stream;

            stream = File.Open( bsp._filePath, FileMode.Open, FileAccess.Read, FileShare.Read );
            _sStreamPool.Add( bsp, stream );

            lock ( bsp._threadStreams )
            {
                bsp._threadStreams.Add( stream );
            }

            return stream;
        }

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

        public string Name { get; }
        
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
        
        [BspLump(LumpType.VERTNORMALINDICES)]
        public ArrayLump<ushort> VertexNormalIndices { get; private set; }

        [BspLump(LumpType.VERTNORMALS)]
        public ArrayLump<Vector3> VertexNormals { get; private set; }

        [BspLump(LumpType.EDGES)]
        public ArrayLump<Edge> Edges { get; private set; }

        [BspLump(LumpType.SURFEDGES)]
        public ArrayLump<int> SurfEdges { get; private set; }
        
        [BspLump(LumpType.LEAFFACES)]
        public ArrayLump<ushort> LeafFaces { get; private set; }

        [BspLump(LumpType.FACES)]
        public ArrayLump<Face> Faces { get; private set; }

        [BspLump(LumpType.FACES_HDR)]
        public ArrayLump<Face> FacesHdr { get; private set; }

        [BspLump(LumpType.PRIMITIVES)]
        public ArrayLump<Primitive> Primitives { get; private set; }

        [BspLump(LumpType.PRIMINDICES)]
        public ArrayLump<ushort> PrimitiveIndices { get; private set; }

        [BspLump(LumpType.VISIBILITY)]
        public VisibilityLump Visibility { get; private set; }

        [BspLump(LumpType.TEXINFO)]
        public ArrayLump<TextureInfo> TextureInfos { get; private set; }

        [BspLump(LumpType.TEXDATA)]
        public ArrayLump<TextureData> TextureData { get; private set; }

        [BspLump(LumpType.TEXDATA_STRING_TABLE)]
        public ArrayLump<int> TextureStringTable { get; private set; }

        [BspLump(LumpType.TEXDATA_STRING_DATA)]
        public ArrayLump<byte> TextureStringData { get; private set; }

        [BspLump(LumpType.BRUSHES)]
        public ArrayLump<Brush> Brushes { get; private set; }
        
        [BspLump(LumpType.BRUSHSIDES)]
        public ArrayLump<BrushSide> BrushSides { get; private set; }

        [BspLump(LumpType.DISPINFO)]
        public ArrayLump<DispInfo> DisplacementInfos { get; private set; }

        [BspLump(LumpType.DISP_VERTS)]
        public ArrayLump<DispVert> DisplacementVerts { get; private set; }
        
        [BspLump(LumpType.LIGHTING)]
        public ArrayLump<byte> Lighting { get; private set; }

        [BspLump(LumpType.LIGHTING_HDR)]
        public ArrayLump<byte> LightingHdr { get; private set; }

        [BspLump(LumpType.PAKFILE)]
        public PakFileLump PakFile { get; private set; }

        [BspLump(LumpType.ENTITIES)]
        public EntityLump Entities { get; private set; }

        [BspLump(LumpType.GAME_LUMP)]
        public GameLump GameData { get; private set; }

        [BspLump(LumpType.CUBEMAPS)]
        public ArrayLump<CubemapSample> Cubemaps { get; private set; }

        public DisplacementManager DisplacementManager { get; }
        public LightmapLayout LightmapLayout { get; }
        public StaticProps StaticProps { get; }

        private readonly string _filePath;
        private readonly Header _header;

        private readonly List<Stream> _threadStreams = new List<Stream>();

        public ValveBspFile( string filePath, string name )
        {
            Name = name;
            _filePath = filePath;

            using ( var reader = new BinaryReader( File.OpenRead( filePath ) ) )
            {
                _header = Header.Read( reader );
            }

            InitializeLumps();

            DisplacementManager = new DisplacementManager( this );
            LightmapLayout = new LightmapLayout( this );
            StaticProps = new StaticProps( this );
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

            using ( var stream = GetLumpStream( type ) )
            {
                stream.Seek( tSize * srcOffset, SeekOrigin.Begin );
                LumpReader<T>.ReadLumpFromStream( stream, count, dst, dstOffset );
            }

            return count;
        }

        public Stream GetLumpStream( LumpType type )
        {
            var info = GetLumpInfo( type );
            return GetSubStream( info.Offset, info.Length );
        }

        public Stream GetSubStream( long offset, long length )
        {
            var stream = new SubStream( GetBspStream( this ), offset, length, false );
            stream.Seek( 0, SeekOrigin.Begin );
            return stream;
        }

        public Vector3 GetVertexFromSurfEdgeId( int surfEdgeId )
        {
            var surfEdge = SurfEdges[surfEdgeId];
            var edgeIndex = Math.Abs(surfEdge);
            var edge = Edges[edgeIndex];
            return Vertices[surfEdge >= 0 ? edge.A : edge.B];
        }
        
        [ThreadStatic]
        private static StringBuilder _sStringBuilder;

        public string GetTextureString( int index )
        {
            var offset = TextureStringTable[index];
            var end = TextureStringData.Length;

            if ( _sStringBuilder == null ) _sStringBuilder = new StringBuilder(128);
            else _sStringBuilder.Remove( 0, _sStringBuilder.Length );

            for ( ; offset < end; ++offset )
            {
                var c = (char) TextureStringData[offset];
                if ( c == '\0' ) break;

                _sStringBuilder.Append( c );
            }

            return _sStringBuilder.ToString();
        }

        public void Dispose()
        {
            lock ( _threadStreams )
            {
                foreach ( var stream in _threadStreams )
                {
                    stream.Dispose();
                }

                _threadStreams.Clear();
            }

            PakFile.Dispose();
        }
    }
}
