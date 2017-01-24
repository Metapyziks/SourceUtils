using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    public class ValveTriangleFile
    {
        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct MaterialReplacementHeader
        {
            public short MaterialId;
            public int ReplacementMaterialNameOffset;
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct MaterialReplacementListHeader
        {
            public int NumReplacements;
            public int ReplacementOffset;
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct BodyPartHeader
        {
            public int NumModels;
            public int ModelOffset;
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct ModelHeader
        {
            public int NumLods;
            public int LodOffset;
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct ModelLodHeader
        {
            public int NumMeshes;
            public int MeshOffset;
            public float SwitchPoint;
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct MeshHeader
        {
            public int NumStripGroups;
            public int StripGroupHeaderOffset;
            public byte MeshFlags;
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct StripGroupHeader
        {
            public int NumVerts;
            public int VertOffset;

            public int NumIndices;
            public int IndexOffset;

            public int NumStrips;
            public int StripOffset;
        }

        private enum StripHeaderFlags : byte
        {
            IsTriList = 1,
            IsTriStrip = 2
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct StripHeader
        {
            public int NumIndices;
            public int IndexOffset;

            public int NumVerts;
            public int VertOffset;

            public short NumBones;
            public StripHeaderFlags Flags;

            public int NumBoneStateChanges;
            public int BoneStateChangeOffset;
        }

        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct OptimizedVertex
        {
            public byte BoneWeightIndex0;
            public byte BoneWeightIndex1;
            public byte BoneWeightIndex2;
            public byte NumBones;

            public ushort OrigMeshVertId;

            public sbyte BoneId0;
            public sbyte BoneId1;
            public sbyte BoneId2;
        }
        
        public static ValveTriangleFile FromStream(Stream stream)
        {
            return new ValveTriangleFile(stream);
        }

        private readonly int[][][] _triangles = new int[8][][];
        private readonly int[][][] _vertIndexMap = new int[8][][];

        private ValveTriangleFile( Stream stream )
        {
            var outIndices = new List<List<int>>();
            var outIndexMap = new List<int[]>();

            using ( var reader = new BinaryReader( stream ) )
            {
                var version = reader.ReadInt32();

                Debug.Assert( version == 7 );

                var vertCacheSize = reader.ReadInt32();
                var maxBonesPerStrip = reader.ReadUInt16();
                var maxBonesPerTri = reader.ReadUInt16();
                var maxBonesPerVert = reader.ReadInt32();

                var checksum = reader.ReadInt32();

                var numLods = reader.ReadInt32();
                var matReplacementListOffset = reader.ReadInt32();

                var numBodyParts = reader.ReadInt32();
                var bodyPartOffset = reader.ReadInt32();

                var lodIndex = 0;

                var verts = new List<OptimizedVertex>();
                var indexMap = new List<int>();
                var indices = new List<ushort>();

                var meshIndex = 0;

                reader.BaseStream.Seek( bodyPartOffset, SeekOrigin.Begin );
                LumpReader<BodyPartHeader>.ReadLumpFromStream( reader.BaseStream, numBodyParts, bodyPart =>
                {
                    reader.BaseStream.Seek( bodyPart.ModelOffset, SeekOrigin.Current );
                    LumpReader<ModelHeader>.ReadLumpFromStream( reader.BaseStream, bodyPart.NumModels, model =>
                    {
                        reader.BaseStream.Seek( model.LodOffset, SeekOrigin.Current );

                        lodIndex = 0;
                        LumpReader<ModelLodHeader>.ReadLumpFromStream( reader.BaseStream, model.NumLods, lod =>
                        {
                            outIndices.Clear();
                            outIndexMap.Clear();

                            var skip = 0;

                            reader.BaseStream.Seek( lod.MeshOffset, SeekOrigin.Current );
                            LumpReader<MeshHeader>.ReadLumpFromStream( reader.BaseStream, lod.NumMeshes, mesh =>
                            {
                                List<int> meshIndices;
                                if ( outIndices.Count <= meshIndex ) outIndices.Add( meshIndices = new List<int>() );
                                else meshIndices = outIndices[meshIndex];

                                Debug.Assert( mesh.NumStripGroups == 1 );

                                indexMap.Clear();

                                reader.BaseStream.Seek( mesh.StripGroupHeaderOffset, SeekOrigin.Current );
                                LumpReader<StripGroupHeader>.ReadLumpFromStream( reader.BaseStream, mesh.NumStripGroups, stripGroup =>
                                {
                                    verts.Clear();
                                    indices.Clear();

                                    var start = reader.BaseStream.Position;
                                    reader.BaseStream.Seek( start + stripGroup.VertOffset, SeekOrigin.Begin );
                                    LumpReader<OptimizedVertex>.ReadLumpFromStream( reader.BaseStream,
                                        stripGroup.NumVerts, verts );

                                    reader.BaseStream.Seek( start + stripGroup.IndexOffset, SeekOrigin.Begin );
                                    LumpReader<ushort>.ReadLumpFromStream( reader.BaseStream,
                                        stripGroup.NumIndices, indices );

                                    for ( var i = 0; i < verts.Count; ++i )
                                    {
                                        indexMap.Add( verts[i].OrigMeshVertId + skip );
                                    }

                                    reader.BaseStream.Seek( start + stripGroup.StripOffset, SeekOrigin.Begin );
                                    LumpReader<StripHeader>.ReadLumpFromStream( reader.BaseStream, stripGroup.NumStrips, strip =>
                                    {
                                        Debug.Assert( strip.Flags == StripHeaderFlags.IsTriList );

                                        for ( var i = 0; i < strip.NumIndices; ++i )
                                        {
                                            var index = indices[strip.IndexOffset + i];
                                            var vert = verts[index];

                                            meshIndices.Add( strip.VertOffset + vert.OrigMeshVertId + skip );
                                        }
                                    } );

                                    // Why?
                                    skip += verts.Max( x => x.OrigMeshVertId ) + 1;
                                } );

                                outIndexMap.Add( indexMap.ToArray() );

                                meshIndex += 1;
                            } );

                            _vertIndexMap[lodIndex] = outIndexMap.ToArray();
                            _triangles[lodIndex] = outIndices.Select( x => x.ToArray() ).ToArray();
                        } );
                    } );
                } );
            }
        }

        public int[][] GetVertIndexMap( int lodLevel )
        {
            return _vertIndexMap[lodLevel];
        }

        public int[][] GetTriangles( int lodLevel )
        {
            return _triangles[lodLevel];
        }
    }
}
