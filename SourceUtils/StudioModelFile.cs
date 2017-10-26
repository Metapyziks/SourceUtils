using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;

namespace SourceUtils
{
    public class StudioModelFile
    {
        public static StudioModelFile FromProvider(string path, params IResourceProvider[] providers)
        {
            var provider = providers.FirstOrDefault(x => x.ContainsFile(path));
            if (provider == null) return null;

            using (var stream = provider.OpenFile(path))
            {
                return new StudioModelFile(stream);
            }
        }

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct Header
        {
            public int Id;
            public int Version;
            public int Checksum;

            private fixed byte _name[64];

            public string Name
            {
                get
                {
                    fixed ( byte* name = _name )
                    {
                        return new string( (sbyte*) name );
                    }
                }
            }

            public int Length;

            public Vector3 EyePosition;
            public Vector3 IllumPosition;
            public Vector3 HullMin;
            public Vector3 HullMax;
            public Vector3 ViewBbMin;
            public Vector3 ViewBbMax;

            public int Flags;

            public int NumBones;
            public int BoneIndex;

            public int NumBoneControllers;
            public int BoneControllerIndex;

            public int NumHitBoxSets;
            public int HitBoxSetIndex;

            public int NumLocalAnim;
            public int LocalAnimIndex;

            public int NumLocalSeq;
            public int LocalSeqIndex;

            public int ActivityListVersion;
            public int EventsIndexed;

            public int NumTextures;
            public int TextureIndex;

            public int NumCdTextures;
            public int CdTextureIndex;

            public int NumSkinRef;
            public int NumSkinFamilies;
            public int SkinIndex;

            public int NumBodyParts;
            public int BodyPartIndex;
        }

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public struct StudioTexture
        {
            public int NameIndex;
            public int Flags;
            public int Used;

            private int _unused0;

            public int MaterialPtr;
            public int ClientMaterialPtr;

            public int _unused1;
            public int _unused2;
            public int _unused3;
            public int _unused4;
            public int _unused5;
            public int _unused6;
            public int _unused7;
            public int _unused8;
            public int _unused9;
            public int _unused10;
        }
        
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public struct StudioBodyPart
        {
            public int NameIndex;
            public int NumModels;
            public int Base;
            public int ModelIndex;
        }
        
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct StudioModel
        {
            private fixed byte _name[64];

            public string Name
            {
                get
                {
                    fixed ( byte* name = _name )
                    {
                        return new string( (sbyte*) name );
                    }
                }
            }

            public int Type;
            public float BoundingRadius;
            public int NumMeshes;
            public int MeshIndex;

            public int NumVertices;
            public int VertexIndex;
            public int TangentsIndex;

            public int NumAttachments;
            public int AttachmentIndex;

            public int NumEyeBalls;
            public int EyeBallIndex;

            public StudioModelVertexData VertexData;
            private fixed int _unused[8];
        }
        
        [StructLayout(LayoutKind.Sequential, Pack = 1, Size = 8)]
        public struct StudioModelVertexData
        {
            
        }
        
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct StudioMesh
        {
            public int Material;
            public int ModelIndex;
            public int NumVertices;
            public int VertexOffset;
            public int NumFlexes;
            public int FlexIndex;
            public int MaterialType;
            public int MaterialParam;
            public int MeshId;
            public Vector3 Center;
            public StudioMeshVertexData VertexData;
            private fixed int _unused[8];
        }
        
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct StudioMeshVertexData
        {
            private int _modelVertexData;
            private fixed int _numLodVertices[8];
        }

        [ThreadStatic]
        private static StringBuilder _sBuilder;
        private static string ReadNullTerminatedString(Stream stream)
        {
            if (_sBuilder == null) _sBuilder = new StringBuilder();
            else _sBuilder.Remove(0, _sBuilder.Length);

            while (true)
            {
                var c = (char) stream.ReadByte();
                if (c == 0) return _sBuilder.ToString();
                _sBuilder.Append(c);
            }
        }
        
        public static StudioModelFile FromStream(Stream stream)
        {
            return new StudioModelFile(stream);
        }

        private readonly Header _header;

        private readonly StudioTexture[] _materials;
        private readonly string[] _materialNames;
        private readonly string[] _materialPaths;

        private readonly string[] _cachedFullMaterialPaths;

        private readonly StudioBodyPart[] _bodyParts;
        private readonly string[] _bodyPartNames;

        private readonly StudioModel[] _models;
        private readonly StudioMesh[] _meshes;

        public int Checksum => _header.Checksum;
        public int NumTextures => _header.NumTextures;
        public Vector3 HullMin => _header.HullMin;
        public Vector3 HullMax => _header.HullMax;

        public int TotalVertices => _meshes.Sum( x => x.NumVertices );

        public StudioModelFile(Stream stream)
        {
            _header = LumpReader<Header>.ReadSingleFromStream(stream);

            if ( _header.Id != 0x54534449 ) throw new Exception( "Not a MDL file." );

            _materials = new StudioTexture[_header.NumTextures];
            _materialNames = new string[_header.NumTextures];
            _cachedFullMaterialPaths = new string[_header.NumTextures];

            stream.Seek(_header.TextureIndex, SeekOrigin.Begin);
            LumpReader<StudioTexture>.ReadLumpFromStream(stream, _header.NumTextures, (index, tex) =>
            {
                _materials[index] = tex;

                stream.Seek(tex.NameIndex, SeekOrigin.Current);
                _materialNames[index] = ReadNullTerminatedString(stream).Replace( '\\', '/' ) + ".vmt";
            });

            _materialPaths = new string[_header.NumCdTextures];

            stream.Seek( _header.CdTextureIndex, SeekOrigin.Begin );
            LumpReader<int>.ReadLumpFromStream( stream, _header.NumCdTextures, ( index, cdTex ) =>
            {
                stream.Seek( cdTex, SeekOrigin.Begin );
                _materialPaths[index] = ReadNullTerminatedString( stream ).Replace( '\\', '/' );
            } );

            _bodyParts = new StudioBodyPart[_header.NumBodyParts];
            _bodyPartNames = new string[_header.NumBodyParts];

            var modelList = new List<StudioModel>();
            var meshList = new List<StudioMesh>();

            stream.Seek( _header.BodyPartIndex, SeekOrigin.Begin );
            LumpReader<StudioBodyPart>.ReadLumpFromStream( stream, _header.NumBodyParts, (partIndex, part) =>
            {
                var partPos = stream.Position;

                stream.Seek( partPos + part.NameIndex, SeekOrigin.Begin );
                _bodyPartNames[partIndex] = ReadNullTerminatedString( stream );

                stream.Seek( partPos + part.ModelIndex, SeekOrigin.Begin );

                // Now indexes into array of models
                part.ModelIndex = modelList.Count;

                LumpReader<StudioModel>.ReadLumpFromStream( stream, part.NumModels, ( modelIndex, model ) =>
                {
                    var modelPos = stream.Position;

                    stream.Seek( modelPos + model.MeshIndex, SeekOrigin.Begin );

                    model.MeshIndex = meshList.Count;
                    LumpReader<StudioMesh>.ReadLumpFromStream( stream, model.NumMeshes, ( meshIndex, mesh ) =>
                    {
                        mesh.ModelIndex = modelIndex;
                        meshList.Add( mesh );
                    } );

                    modelList.Add( model );
                } );

                _bodyParts[partIndex] = part;
            } );

            _models = modelList.ToArray();
            _meshes = meshList.ToArray();
        }

        public int BodyPartCount => _bodyParts.Length;

        public string GetBodyPartName( int index )
        {
            return _bodyPartNames[index];
        }

        public StudioMesh GetMesh( int bodyPartIndex, int modelIndex, int meshIndex )
        {
            return _meshes[_models[_bodyParts[bodyPartIndex].ModelIndex + modelIndex].MeshIndex + meshIndex];
        }

        public IEnumerable<StudioModel> GetModels( int bodyPartIndex )
        {
            var part = _bodyParts[bodyPartIndex];
            return Enumerable.Range( part.ModelIndex, part.NumModels ).Select( x => _models[x] );
        }
        
        public IEnumerable<StudioMesh> GetMeshes( int index, int count )
        {
            return Enumerable.Range( index, count ).Select( x => _meshes[x] );
        }

        public IEnumerable<StudioMesh> GetMeshes( ref StudioModel model )
        {
            return GetMeshes( model.MeshIndex, model.NumMeshes );
        }

        public int MaterialCount => _materials.Length;

        public string GetMaterialName(int index, params IResourceProvider[] providers)
        {
            if ( _cachedFullMaterialPaths[index] != null ) return _cachedFullMaterialPaths[index];
            if ( _materialPaths.Length == 0 ) return _cachedFullMaterialPaths[index] = _materialNames[index];

            foreach ( var path in _materialPaths )
            {
                var fullPath = (path + _materialNames[index]).Replace( '\\', '/' );
                if ( !fullPath.StartsWith( "materials/" ) ) fullPath = $"materials/{fullPath}";

                foreach ( var provider in providers )
                {
                    if ( provider.ContainsFile( fullPath ) ) return _cachedFullMaterialPaths[index] = fullPath;
                }
            }

            return _cachedFullMaterialPaths[index] = _materialNames[index];
        }
    }
}
