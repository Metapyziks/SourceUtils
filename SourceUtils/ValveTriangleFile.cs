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
            None = 0, // I assume?
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

        public struct Mesh
        {
            public int Index;
            public int Start;
            public int Length;
        }

        public int NumLods { get; }

        private readonly int[][] _triangles;
        private readonly Mesh[][] _meshes;
        private readonly int[][][] _vertIndexMap;

        private ValveTriangleFile( Stream stream )
        {
            var outIndices = new List<int>();
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

                var numLods = NumLods = reader.ReadInt32();
                var matReplacementListOffset = reader.ReadInt32();

                var numBodyParts = reader.ReadInt32();
                var bodyPartOffset = reader.ReadInt32();

                var lodIndex = 0;

                var verts = new List<OptimizedVertex>();
                var indexMap = new List<int>();
                var indices = new List<ushort>();

                _triangles = new int[numLods][];
                _meshes = new Mesh[numLods][];
                _vertIndexMap = new int[numLods][][];

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
                            var meshIndex = 0;

                            _meshes[lodIndex] = new Mesh[lod.NumMeshes];

                            reader.BaseStream.Seek( lod.MeshOffset, SeekOrigin.Current );
                            LumpReader<MeshHeader>.ReadLumpFromStream( reader.BaseStream, lod.NumMeshes, mesh =>
                            {

                                var meshInfo = new Mesh
                                {
                                    Index = meshIndex,
                                    Start = outIndices.Count
                                };

                                Debug.Assert( mesh.NumStripGroups < 2 );

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
                                        Debug.Assert( strip.Flags != StripHeaderFlags.IsTriStrip );

                                        for ( var i = 0; i < strip.NumIndices; ++i )
                                        {
                                            var index = indices[strip.IndexOffset + i];
                                            var vert = verts[index];

                                            outIndices.Add( strip.VertOffset + vert.OrigMeshVertId + skip );
                                        }
                                    } );

                                    // Why?
                                    skip += verts.Max( x => x.OrigMeshVertId ) + 1;
                                } );

                                outIndexMap.Add( indexMap.ToArray() );

                                meshInfo.Length = outIndices.Count - meshInfo.Start;
                                _meshes[lodIndex][meshIndex] = meshInfo;

                                meshIndex += 1;
                            } );

                            _vertIndexMap[lodIndex] = outIndexMap.ToArray();
                            _triangles[lodIndex] = outIndices.ToArray();

                            lodIndex += 1;
                        } );
                    } );
                } );
            }
        }

        public int[][] GetVertIndexMap( int lodLevel )
        {
            return _vertIndexMap[lodLevel];
        }

        public int[] GetTriangles( int lodLevel )
        {
            return _triangles[lodLevel];
        }

        public Mesh[] GetMeshes( int lodLevel )
        {
            return _meshes[lodLevel];
        }
    }
}
