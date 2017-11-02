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
    public partial class ValveBspFile : DisposingEventTarget<ValveBspFile>
    {
        [ThreadStatic]
        private static Dictionary<ValveBspFile, Stream> _sStreamPool;

        private static Stream GetBspStream( ValveBspFile bsp )
        {
            var pool = _sStreamPool ?? (_sStreamPool = new Dictionary<ValveBspFile, Stream>());

            Stream stream;
            if ( pool.TryGetValue( bsp, out stream ) )
            {
                return stream;
            }

            stream = File.Open( bsp._filePath, FileMode.Open, FileAccess.Read, FileShare.Read );
            pool.Add( bsp, stream );

            bsp.Disposing += _ =>
            {
                pool?.Remove( bsp );
                stream?.Dispose();
            };

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

                for ( var i = 0; i < lumps.Length; ++i )
                {
                    lumps[i].IdentCode = (LumpType) i;
                }

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
        public int Version => _header.Version;
        
        [BspLump(LumpType.MODELS)]
        public StructArrayLump<BspModel> Models { get; private set; }

        [BspLump(LumpType.PLANES)]
        public StructArrayLump<Plane> Planes { get; private set; }
        
        [BspLump(LumpType.NODES)]
        public StructArrayLump<BspNode> Nodes { get; private set; }
        
        [BspLump(LumpType.LEAFS)]
        public VersionedArrayLump<IBspLeaf> Leaves { get; private set; }

        [BspLump(LumpType.VERTEXES)]
        public StructArrayLump<Vector3> Vertices { get; private set; }
        
        [BspLump(LumpType.VERTNORMALINDICES)]
        public StructArrayLump<ushort> VertexNormalIndices { get; private set; }

        [BspLump(LumpType.VERTNORMALS)]
        public StructArrayLump<Vector3> VertexNormals { get; private set; }

        [BspLump(LumpType.EDGES)]
        public StructArrayLump<Edge> Edges { get; private set; }

        [BspLump(LumpType.SURFEDGES)]
        public StructArrayLump<int> SurfEdges { get; private set; }
        
        [BspLump(LumpType.LEAFFACES)]
        public StructArrayLump<ushort> LeafFaces { get; private set; }

        [BspLump(LumpType.FACES)]
        public StructArrayLump<Face> Faces { get; private set; }

        [BspLump(LumpType.FACES_HDR)]
        public StructArrayLump<Face> FacesHdr { get; private set; }

        [BspLump(LumpType.PRIMITIVES)]
        public StructArrayLump<Primitive> Primitives { get; private set; }

        [BspLump(LumpType.PRIMINDICES)]
        public StructArrayLump<ushort> PrimitiveIndices { get; private set; }

        [BspLump(LumpType.VISIBILITY)]
        public VisibilityLump Visibility { get; private set; }

        [BspLump(LumpType.TEXINFO)]
        public StructArrayLump<TextureInfo> TextureInfos { get; private set; }

        [BspLump(LumpType.TEXDATA)]
        public StructArrayLump<TextureData> TextureData { get; private set; }

        [BspLump(LumpType.TEXDATA_STRING_TABLE)]
        public StructArrayLump<int> TextureStringTable { get; private set; }

        [BspLump(LumpType.TEXDATA_STRING_DATA)]
        public StructArrayLump<byte> TextureStringData { get; private set; }

        [BspLump(LumpType.BRUSHES)]
        public StructArrayLump<Brush> Brushes { get; private set; }
        
        [BspLump(LumpType.BRUSHSIDES)]
        public StructArrayLump<BrushSide> BrushSides { get; private set; }

        [BspLump(LumpType.DISPINFO)]
        public StructArrayLump<DispInfo> DisplacementInfos { get; private set; }

        [BspLump(LumpType.DISP_VERTS)]
        public StructArrayLump<DispVert> DisplacementVerts { get; private set; }
        
        [BspLump(LumpType.LIGHTING)]
        public StructArrayLump<byte> Lighting { get; private set; }

        [BspLump(LumpType.LIGHTING_HDR)]
        public StructArrayLump<byte> LightingHdr { get; private set; }

        [BspLump(LumpType.PAKFILE)]
        public PakFileLump PakFile { get; private set; }

        [BspLump(LumpType.ENTITIES)]
        public EntityLump Entities { get; private set; }

        [BspLump(LumpType.GAME_LUMP)]
        public GameLump GameData { get; private set; }

        [BspLump(LumpType.CUBEMAPS)]
        public StructArrayLump<CubemapSample> Cubemaps { get; private set; }

        [BspLump(LumpType.LEAF_AMBIENT_INDEX)]
        public StructArrayLump<LeafAmbientIndex> LeafAmbientIndices { get; private set; }

        [BspLump(LumpType.LEAF_AMBIENT_INDEX_HDR)]
        public StructArrayLump<LeafAmbientIndex> LeafAmbientIndicesHdr { get; private set; }
        
        [BspLump(LumpType.LEAF_AMBIENT_LIGHTING)]
        public StructArrayLump<LeafAmbientLighting> LeafAmbientLighting { get; private set; }
        
        [BspLump(LumpType.LEAF_AMBIENT_LIGHTING_HDR)]
        public StructArrayLump<LeafAmbientLighting> LeafAmbientLightingHdr { get; private set; }

        public DisplacementManager DisplacementManager { get; }
        public LightmapLayout LightmapLayout { get; }
        public StaticProps StaticProps { get; }

        private readonly string _filePath;
        private readonly Header _header;

        public ValveBspFile( string filePath )
        {
            Name = Path.GetFileNameWithoutExtension( filePath );
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

        private int GetLumpLength( LumpType lumpType, Type structType )
        {
            var info = GetLumpInfo( lumpType );
            return info.Length / Marshal.SizeOf( structType );
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
    }
}
