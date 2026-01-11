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

            var properties = new byte[5];

            unsafe
            {
                for ( var i = 0; i < 5; i++ )
                {
                    properties[i] = lzmaHeader.Properties[i];
                }
            }

            return Decode( stream, lzmaHeader.LzmaSize, lzmaHeader.ActualSize, properties );
        }

        public static Stream Decode( Stream stream, long lzmaSize, long actualSize, byte[] properties )
        {
            if ( actualSize > int.MaxValue )
            {
                throw new ArgumentOutOfRangeException( nameof( actualSize ), actualSize, "Decompressed size is too big." );
            }

            using ( stream )
            {
                var lzmaDecoder = new SevenZip.Compression.LZMA.Decoder();
                var decodedStream = new MemoryStream( (int)actualSize );

                lzmaDecoder.SetDecoderProperties( properties );
                lzmaDecoder.Code( stream, decodedStream, lzmaSize, actualSize, null );

                decodedStream.Seek( 0, SeekOrigin.Begin );

                return decodedStream;
            }
        }

        public static int GetCorrectedLzmaLength( Stream bspStream, int offset )
        {
            const int LzmaHeaderMetadataSize = 12;
            const int LzmaPropertiesSize = 5;

            if ( offset + LzmaHeaderMetadataSize > bspStream.Length )
            {
                return 12;
            }

            long originalPosition = bspStream.Position;
            try
            {
                bspStream.Seek( offset, SeekOrigin.Begin );

                byte[] headerBuffer = new byte[LzmaHeaderMetadataSize];
                int bytesRead = bspStream.Read( headerBuffer, 0, LzmaHeaderMetadataSize );

                bspStream.Seek( originalPosition, SeekOrigin.Begin );

                if ( bytesRead < LzmaHeaderMetadataSize )
                {
                    return 12;
                }

                uint magic = BitConverter.ToUInt32(headerBuffer, 0);

                if ( magic == LzmaHeader.ExpectedId )
                {
                    uint lzmaSize = BitConverter.ToUInt32( headerBuffer, 8 );

                    return (int)(LzmaHeaderMetadataSize + LzmaPropertiesSize + lzmaSize);
                }
            }
            finally
            {
                bspStream.Seek( originalPosition, SeekOrigin.Begin );
            }

            return 12;
        }
    }
}
