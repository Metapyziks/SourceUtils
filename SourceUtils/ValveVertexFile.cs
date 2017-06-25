using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct StudioVertex
    {
        public StudioBoneWeight BoneWeights;
        public Vector3 Position;
        public Vector3 Normal;
        public float TexCoordX;
        public float TexCoordY;

        public override string ToString()
        {
            return $"{Position}, {Normal}, ({TexCoordX}, {TexCoordY})";
        }
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct StudioBoneWeight
    {
        public float Weight0;
        public float Weight1;
        public float Weight2;
        public byte Bone0;
        public byte Bone1;
        public byte Bone2;
        public byte NumBones;
    }

    public class ValveVertexFile
    {
        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        public struct VertexFixup
        {
            public int Lod;
            public int SourceVertexId;
            public int NumVertices;
        }

        public static ValveVertexFile FromProvider( string path, params IResourceProvider[] providers )
        {
            var provider = providers.FirstOrDefault( x => x.ContainsFile( path ) );
            if ( provider == null ) return null;

            using ( var stream = provider.OpenFile( path ) )
            {
                return new ValveVertexFile( stream );
            }
        }

        public static ValveVertexFile FromStream(Stream stream)
        {
            return new ValveVertexFile(stream);
        }

        private readonly int[] _numVerts;
        private readonly StudioVertex[] _vertices;
        private readonly Vector4[] _tangents;
        private readonly VertexFixup[] _fixups;

        public int NumLods { get; }
        public bool HasTangents { get; }

        public ValveVertexFile( Stream stream )
        {
            using ( var reader = new BinaryReader( stream ) )
            {
                var id = reader.ReadInt32();
                var version = reader.ReadInt32();

                Debug.Assert( id == 0x56534449 );
                Debug.Assert( version == 4 );

                reader.ReadInt32();

                NumLods = reader.ReadInt32();
                _numVerts = new int[NumLods];

                for ( var i = 0; i < 8; ++i )
                {
                    var count = reader.ReadInt32();
                    if ( i < NumLods ) _numVerts[i] = count;
                }

                var numFixups = reader.ReadInt32();
                var fixupTableStart = reader.ReadInt32();
                var vertexDataStart = reader.ReadInt32();
                var tangentDataStart = reader.ReadInt32();

                if ( numFixups > 0 )
                {
                    reader.BaseStream.Seek( fixupTableStart, SeekOrigin.Begin );
                    _fixups = LumpReader<VertexFixup>.ReadLumpFromStream( reader.BaseStream, numFixups );
                }

                HasTangents = tangentDataStart != 0;

                var vertLength = (int) (HasTangents ? tangentDataStart - vertexDataStart : stream.Length - vertexDataStart);
                
                reader.BaseStream.Seek( vertexDataStart, SeekOrigin.Begin );
                _vertices = LumpReader<StudioVertex>.ReadLumpFromStream( reader.BaseStream, vertLength / Marshal.SizeOf<StudioVertex>() );

                if ( HasTangents )
                {
                    var tangLength = (int) (stream.Length - tangentDataStart);
                    reader.BaseStream.Seek( tangentDataStart, SeekOrigin.Begin );
                    _tangents = LumpReader<Vector4>.ReadLumpFromStream( reader.BaseStream, tangLength / Marshal.SizeOf<Vector4>() );
                }
            }
        }

        public int GetVertexCount( int lod )
        {
            return GetVertices( lod, null );
        }

        public int GetVertices( int lod, StudioVertex[] dest, int offset = 0 )
        {
            if ( _fixups == null )
            {
                if (dest != null) Array.Copy( _vertices, 0, dest, offset, _numVerts[lod] );
                return _numVerts[lod];
            }

            var startOffset = offset;

            foreach ( var vertexFixup in _fixups )
            {
                if ( vertexFixup.Lod < lod ) continue;

                if ( dest != null ) Array.Copy( _vertices, vertexFixup.SourceVertexId, dest, offset, vertexFixup.NumVertices );
                offset += vertexFixup.NumVertices;
            }

            return offset - startOffset;
        }

        public Vector4[] GetTangents( int lod )
        {
            throw new NotImplementedException();
        }
    }
}
