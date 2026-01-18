using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    public sealed class LzmaDecoderStream
    {
        public const int MetadataSize = 12;
        public const int PropertiesSize = 5;

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct LzmaHeader
        {
            public const uint ExpectedId = ('A' << 24) | ('M' << 16) | ('Z' << 8) | 'L';

            public uint Id;
            public uint ActualSize;
            public uint LzmaSize;
            public fixed byte Properties[PropertiesSize];
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

        public static int GetCorrectedLzmaLength( Stream stream, int offset )
        {
            if ( offset + Unsafe.SizeOf<LzmaHeader>() > stream.Length )
            {
                return MetadataSize;
            }

            var originalPosition = stream.Position;

            try
            {
                stream.Seek( offset, SeekOrigin.Begin );

                var lzmaHeader = LumpReader<LzmaHeader>.ReadSingleFromStream( stream );

                if ( lzmaHeader.Id != LzmaHeader.ExpectedId )
                {
                    return MetadataSize;
                }

                return Unsafe.SizeOf<LzmaHeader>() + (int)lzmaHeader.LzmaSize;
            }
            finally
            {
                stream.Seek( originalPosition, SeekOrigin.Begin );
            }
        }
    }
}
