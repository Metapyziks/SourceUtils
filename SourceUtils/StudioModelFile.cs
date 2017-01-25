using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;

namespace SourceUtils
{
    public class StudioModelFile
    {
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public struct Header
        {
            public int Id;
            public int Version;
            public int Checksum;

            private ulong _name0;
            private ulong _name1;
            private ulong _name2;
            private ulong _name3;
            private ulong _name4;
            private ulong _name5;
            private ulong _name6;
            private ulong _name7;

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

        public int NumTextures => _header.NumTextures;
        public Vector3 HullMin => _header.HullMin;
        public Vector3 HullMax => _header.HullMax;

        private StudioModelFile(Stream stream)
        {
            _header = LumpReader<Header>.ReadSingleFromStream(stream);

            if ( _header.Id != 0x54534449 ) throw new Exception( "Not a MDL file." );

            _materials = new StudioTexture[_header.NumTextures];
            _materialNames = new string[_header.NumTextures];

            stream.Seek(_header.TextureIndex, SeekOrigin.Begin);

            var index = 0;
            LumpReader<StudioTexture>.ReadLumpFromStream(stream, _header.NumTextures, tex =>
            {
                _materials[index] = tex;

                stream.Seek(tex.NameIndex, SeekOrigin.Current);
                _materialNames[index] = ReadNullTerminatedString(stream) + ".vmt";
                ++index;
            });
        }

        public string GetMaterialName(int lodLevel, int index)
        {
            // TODO: Material replacements

            return _materialNames[index];
        }
    }
}
