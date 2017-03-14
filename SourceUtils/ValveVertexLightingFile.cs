using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    public class ValveVertexLightingFile
    {
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        private struct VhvMeshHeader
        {
            public int Lod;
            public int VertCount;
            public int VertOffset;
            public int Unused0;
            public int Unused1;
            public int Unused2;
            public int Unused3;
        }

        private interface IVertexData
        {
            VertexData4 GetVertexColor();
        }

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public struct VertexData4 : IVertexData
        {
            public byte B;
            public byte G;
            public byte R;
            public byte A;

            public VertexData4 GetVertexColor()
            {
                return this;
            }
        }

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        private struct VertexData2 : IVertexData
        {
            public VertexData4 Color0;
            public VertexData4 Color1;
            public VertexData4 Color2;

            public VertexData4 GetVertexColor()
            {
                return new VertexData4
                {
                    B = (byte)((Color0.B + Color1.B + Color2.B) / 3),
                    G = (byte)((Color0.G + Color1.G + Color2.G) / 3),
                    R = (byte)((Color0.R + Color1.R + Color2.R) / 3),
                    A = (byte)((Color0.A + Color1.A + Color2.A) / 3)
                };
            }
        }
        
        public static ValveVertexLightingFile FromStream(Stream stream)
        {
            return new ValveVertexLightingFile(stream);
        }

        private readonly VertexData4[][][] _samples;

        public ValveVertexLightingFile( Stream stream )
        {
            using ( var reader = new BinaryReader( stream ) )
            {
                var version = reader.ReadInt32();

                Debug.Assert( version == 2 );

                var checksum = reader.ReadInt32();
                var vertFlags = reader.ReadUInt32();
                var vertSize = reader.ReadUInt32();
                var vertCount = reader.ReadUInt32();
                var meshCount = reader.ReadInt32();

                reader.ReadInt64(); // Unused
                reader.ReadInt64(); // Unused

                var meshHeaders = new List<VhvMeshHeader>();
                LumpReader<VhvMeshHeader>.ReadLumpFromStream(stream, meshCount, meshHeaders);

                _samples = new VertexData4[meshHeaders.Max( x => x.Lod ) + 1][][];

                for ( var i = 0; i < _samples.Length; ++i )
                {
                    _samples[i] = new VertexData4[meshHeaders.Count( x => x.Lod == i )][];
                }

                foreach (var meshHeader in meshHeaders)
                {
                    stream.Seek(meshHeader.VertOffset, SeekOrigin.Begin);

                    var samples = _samples[meshHeader.Lod];
                    var meshIndex = Array.IndexOf( samples, null );

                    if ( vertFlags == 2 )
                    {
                        samples[meshIndex] = LumpReader<VertexData2>.ReadLumpFromStream( stream, meshHeader.VertCount, x => x.GetVertexColor() );
                    }
                    else
                    {
                        samples[meshIndex] = LumpReader<VertexData4>.ReadLumpFromStream(stream, meshHeader.VertCount, x => x.GetVertexColor());
                    }
                }
            }
        }

        public int GetMeshCount( int lod )
        {
            return lod < _samples.Length ? _samples[lod].Length : 0;
        }

        public VertexData4[] GetSamples( int lod, int mesh )
        {
            return _samples[lod][mesh];
        }
    }
}
