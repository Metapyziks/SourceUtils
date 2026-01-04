using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    public sealed class LzmaDecoderStream
    {
        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct LzmaHeader
        {
            public const uint ExpectedId = ('A' << 24) | ('M' << 16) | ('Z' << 8) | 'L';

            public uint Id;
            public uint ActualSize;
            public uint LzmaSize;
            public fixed byte Properties[5];
        }

        public static Stream Decode( Stream stream )
        {
            Debug.Assert( stream.Position == 0, "Expected to be at the start of the stream." );

            // If not compressed, just return the base stream

            if (stream.Length < Unsafe.SizeOf<LzmaHeader>())
            {
                return stream;
            }

            var lzmaHeader = LumpReader<LzmaHeader>.ReadSingleFromStream(stream);

            if (lzmaHeader.Id != LzmaHeader.ExpectedId)
            {
                stream.Seek(0, SeekOrigin.Begin);
                return stream;
            }

            using (stream)
            {
                var lzmaDecoder = new SevenZip.Compression.LZMA.Decoder();
                var decodedStream = new MemoryStream((int)lzmaHeader.ActualSize);

                unsafe
                {
                    var properties = new byte[5];

                    for (var i = 0; i < 5; i++)
                    {
                        properties[i] = lzmaHeader.Properties[i];
                    }

                    lzmaDecoder.SetDecoderProperties(properties);
                }

                lzmaDecoder.Code(stream, decodedStream, lzmaHeader.LzmaSize, lzmaHeader.ActualSize, null);

                decodedStream.Seek(0, SeekOrigin.Begin);

                return decodedStream;
            }
        }
    }
}
