using System;
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

            public override string ToString()
            {
                return OrigMeshVertId.ToString();
            }
        }
        
        public static ValveTriangleFile FromStream(Stream stream)
        {
            return new ValveTriangleFile(stream);
        }

        public int NumLods { get; }

        public class LodLevel
        {
            public int[] Vertices;
            public int[] Indices;
            public SubMesh[] SubMeshes;
        }

        public struct SubMesh
        {
            public int MaterialIndex;
            public int Start;
            public int Length;
        }

        private readonly LodLevel[] _lods;

        private ValveTriangleFile( Stream stream )
        {
            var outIndices = new List<int>();
            var outVertices = new List<int>();

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

                var verts = new List<OptimizedVertex>();
                var indices = new List<ushort>();

                _lods = new LodLevel[numLods];

                reader.BaseStream.Seek( bodyPartOffset, SeekOrigin.Begin );
                LumpReader<BodyPartHeader>.ReadLumpFromStream( reader.BaseStream, numBodyParts, (bodyPartIndex, bodyPart) =>
                {
                    if ( bodyPartIndex > 0 ) return;

                    reader.BaseStream.Seek( bodyPart.ModelOffset, SeekOrigin.Current );
                    LumpReader<ModelHeader>.ReadLumpFromStream( reader.BaseStream, bodyPart.NumModels, (modelIndex, model) =>
                    {
                        reader.BaseStream.Seek( model.LodOffset, SeekOrigin.Current );

                        LumpReader<ModelLodHeader>.ReadLumpFromStream( reader.BaseStream, model.NumLods, (lodIndex, lod) =>
                        {
                            outIndices.Clear();
                            outVertices.Clear();

                            var lodLevel = _lods[lodIndex] = new LodLevel();
                            lodLevel.SubMeshes = new SubMesh[lod.NumMeshes];

                            var origVertexOffset = 0;

                            reader.BaseStream.Seek( lod.MeshOffset, SeekOrigin.Current );
                            LumpReader<MeshHeader>.ReadLumpFromStream( reader.BaseStream, lod.NumMeshes, (meshIndex, mesh) =>
                            {
                                var subMesh = new SubMesh
                                {
                                    MaterialIndex = meshIndex,
                                    Start = outIndices.Count
                                };

                                var vertexOffset = outVertices.Count;

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

                                    reader.BaseStream.Seek( start + stripGroup.StripOffset, SeekOrigin.Begin );
                                    LumpReader<StripHeader>.ReadLumpFromStream( reader.BaseStream, stripGroup.NumStrips, strip =>
                                    {
                                        Debug.Assert( strip.Flags != StripHeaderFlags.IsTriStrip );

                                        for ( var j = 0; j < strip.NumVerts; ++j )
                                        {
                                            outVertices.Add( verts[strip.VertOffset + j].OrigMeshVertId + origVertexOffset );
                                        }

                                        // WHY
                                        origVertexOffset += verts.Max( x => x.OrigMeshVertId ) + 1;

                                        for ( var i = 0; i < strip.NumIndices; ++i )
                                        {
                                            var index = indices[strip.IndexOffset + i];
                                            outIndices.Add( index + vertexOffset );
                                        }
                                    } );
                                } );

                                subMesh.Length = outIndices.Count - subMesh.Start;

                                lodLevel.SubMeshes[meshIndex] = subMesh;
                            } );

                            lodLevel.Indices = outIndices.ToArray();
                            lodLevel.Vertices = outVertices.ToArray();
                        } );
                    } );
                } );
            }
        }
        
        public int[] GetVertices( int lodLevel )
        {
            return _lods[lodLevel].Vertices;
        }

        public int[] GetIndices( int lodLevel )
        {
            return _lods[lodLevel].Indices;
        }

        public SubMesh[] GetSubMeshes( int lodLevel )
        {
            return _lods[lodLevel].SubMeshes;
        }
    }
}
