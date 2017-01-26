using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    public class ValveVertexFile
    {
        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        public struct VertexFixup
        {
            public int Lod;
            public int SourceVertexId;
            public int NumVertices;
        }

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
        
        public static ValveVertexFile FromStream(Stream stream)
        {
            return new ValveVertexFile(stream);
        }

        private readonly StudioVertex[][] _vertices;
        private readonly Vector4[][] _tangents;

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

                var numLods = NumLods = reader.ReadInt32();
                var numLodVerts = new int[8];

                for ( var i = 0; i < numLodVerts.Length; ++i )
                {
                    numLodVerts[i] = reader.ReadInt32();
                }

                var numFixups = reader.ReadInt32();
                var fixupTableStart = reader.ReadInt32();
                var vertexDataStart = reader.ReadInt32();
                var tangentDataStart = reader.ReadInt32();

                var fixupList = new List<VertexFixup>();
                var vertList = new List<StudioVertex>();
                var tangentList = new List<Vector4>();

                if ( numFixups > 0 )
                {
                    reader.BaseStream.Seek( fixupTableStart, SeekOrigin.Begin );
                    LumpReader<VertexFixup>.ReadLumpFromStream( reader.BaseStream, numFixups, fixupList );
                }

                HasTangents = tangentDataStart != 0;

                _tangents = new Vector4[numLods][];
                _vertices = new StudioVertex[numLods][];

                var lodVerts = new List<StudioVertex>();
                var lodTangents = new List<Vector4>();

                for ( var i = 0; i < numLods; ++i )
                {
                    vertList.Clear();
                    tangentList.Clear();

                    reader.BaseStream.Seek( vertexDataStart, SeekOrigin.Begin );
                    LumpReader<StudioVertex>.ReadLumpFromStream( reader.BaseStream, numLodVerts[i], vertList );
                    
                    reader.BaseStream.Seek( tangentDataStart, SeekOrigin.Begin );
                    LumpReader<Vector4>.ReadLumpFromStream( reader.BaseStream, HasTangents ? numLodVerts[i] : 0, tangentList );

                    if ( numFixups == 0 )
                    {
                        _vertices[i] = vertList.ToArray();
                        _tangents[i] = HasTangents ? tangentList.ToArray() : null;
                        continue;
                    }

                    lodVerts.Clear();
                    lodTangents.Clear();

                    foreach ( var vertexFixup in fixupList )
                    {
                        if ( vertexFixup.Lod < i ) continue;

                        lodVerts.AddRange( vertList.Skip( vertexFixup.SourceVertexId )
                            .Take( vertexFixup.NumVertices ) );

                        if ( !HasTangents ) continue;

                        lodTangents.AddRange( tangentList.Skip( vertexFixup.SourceVertexId )
                            .Take( vertexFixup.NumVertices ) );
                    }

                    _vertices[i] = lodVerts.ToArray();
                    _tangents[i] = HasTangents ? lodTangents.ToArray() : null;
                }
            }
        }

        public StudioVertex[] GetVertices( int lod )
        {
            return _vertices[lod];
        }

        public Vector4[] GetTangents( int lod )
        {
            return _tangents[lod];
        }
    }
}
