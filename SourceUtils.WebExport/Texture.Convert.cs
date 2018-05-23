using System;
using System.Runtime.InteropServices;
using ImageMagick;

namespace SourceUtils.WebExport
{
    partial class Texture
    {
        [Flags]
        private enum DdsHeaderFlags : uint
        {
            CAPS = 0x1,
            HEIGHT = 0x2,
            WIDTH = 0x4,
            PITCH = 0x8,
            PIXELFORMAT = 0x1000,
            MIPMAPCOUNT = 0x20000,
            LINEARSIZE = 0x80000,
            DEPTH = 0x800000
        }

        [Flags]
        private enum DdsCaps : uint
        {
            COMPLEX = 0x8,
            MIPMAP = 0x400000,
            TEXTURE = 0x1000
        }

        [Flags]
        private enum DdsPixelFormatFlags
        {
            ALPHAPIXELS = 0x1,
            ALPHA = 0x2,
            FOURCC = 0x4,
            RGB = 0x40,
            YUV = 0x200,
            LUMINANCE = 0x20000
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct DdsPixelFormat
        {
            public uint dwSize;
            public DdsPixelFormatFlags dwFlags;
            public uint dwFourCC;
            public uint dwRGBBitCount;
            public uint dwRBitMask;
            public uint dwGBitMask;
            public uint dwBBitMask;
            public uint dwABitMask;
        }

        [StructLayout(LayoutKind.Sequential)]
        private unsafe struct DdsHeader
        {
            public uint dwSize;
            public DdsHeaderFlags dwFlags;
            public uint dwHeight;
            public uint dwWidth;
            public uint dwPitchOrLinearSize;
            public uint dwDepth;
            public uint dwMipMapCount;
            public fixed uint dwReserved1[11];
            public DdsPixelFormat ddspf;
            public DdsCaps dwCaps;
            public uint dwCaps2;
            public uint dwCaps3;
            public uint dwCaps4;
            public uint dwReserved2;
        }

        [ThreadStatic]
        private static byte[] _sPixelBuffer;

        private static unsafe int WriteDdsHeader( ValveTextureFile vtf, int mip, byte[] buffer )
        {
            var header = new DdsHeader();

            int blockSize;
            uint fourCC;
            switch (vtf.Header.HiResFormat)
            {
                case TextureFormat.DXT1:
                    blockSize = 8;
                    fourCC = 0x31545844;
                    break;
                case TextureFormat.DXT3:
                    blockSize = 16;
                    fourCC = 0x33545844;
                    break;
                case TextureFormat.DXT5:
                    blockSize = 16;
                    fourCC = 0x35545844;
                    break;
                default:
                    throw new NotImplementedException();
            }

            header.dwWidth = (uint) Math.Max( 1, vtf.Header.Width >> mip );
            header.dwHeight = (uint) Math.Max( 1, vtf.Header.Height >> mip );

            header.dwSize = (uint)Marshal.SizeOf(typeof(DdsHeader));
            header.dwFlags = DdsHeaderFlags.CAPS | DdsHeaderFlags.HEIGHT | DdsHeaderFlags.WIDTH | DdsHeaderFlags.PIXELFORMAT;
            header.dwPitchOrLinearSize = (uint)(Math.Max(1, (vtf.Header.Width + 3) / 4) * blockSize);
            header.dwDepth = 1;
            header.dwMipMapCount = 1;
            header.dwCaps = DdsCaps.TEXTURE;
            header.ddspf.dwSize = (uint)Marshal.SizeOf(typeof(DdsPixelFormat));
            header.ddspf.dwFlags = DdsPixelFormatFlags.FOURCC;
            header.ddspf.dwFourCC = fourCC;

            fixed (byte* bufferPtr = buffer)
            {
                var magicPtr = (uint*) bufferPtr;
                var headerPtr = (DdsHeader*)(bufferPtr + sizeof(uint));
                *magicPtr = 0x20534444;
                *headerPtr = header;
            }

            return (int) header.dwSize + sizeof(uint);
        }

        public static MagickImage DecodeImage(ValveTextureFile vtf, int mip, int frame, int face, int zslice)
        {
            var dataLength = vtf.GetHiResPixelDataLength(mip);
            var totalLength = dataLength + 128;

            if ( _sPixelBuffer == null || _sPixelBuffer.Length < totalLength )
            {
                var powerOf2 = 256;
                while ( powerOf2 < totalLength ) powerOf2 <<= 1;

                _sPixelBuffer = new byte[powerOf2];
            }

            var offset = 0;
            var width = Math.Max( 1, vtf.Header.Width >> mip );
            var height = Math.Max( 1, vtf.Header.Height >> mip );

            var readSettings = new MagickReadSettings
            {
                Width = width,
                Height = height
            };

            switch ( vtf.Header.HiResFormat )
            {
                case TextureFormat.DXT1:
                case TextureFormat.DXT3:
                case TextureFormat.DXT5:
                    readSettings.Format = MagickFormat.Dds;
                    offset = WriteDdsHeader(vtf, mip, _sPixelBuffer);
                    break;
                case TextureFormat.I8:
                    readSettings.Format = MagickFormat.Gray;
                    break;
                case TextureFormat.IA88:
                    readSettings.Format = MagickFormat.Gray;
                    readSettings.PixelStorage = new PixelStorageSettings
                    {
                        StorageType = StorageType.Char,
                        Mapping = "PA"
                    };
                    break;
                case TextureFormat.BGR888:
                    readSettings.PixelStorage = new PixelStorageSettings(StorageType.Char, "BGR");
                    break;
                case TextureFormat.RGB888:
                case TextureFormat.RGB888_BLUESCREEN:
                    readSettings.PixelStorage = new PixelStorageSettings(StorageType.Char, "RGB");
                    break;
                case TextureFormat.ABGR8888:
                    readSettings.PixelStorage = new PixelStorageSettings(StorageType.Char, "ABGR");
                    break;
                case TextureFormat.BGRA8888:
                    readSettings.PixelStorage = new PixelStorageSettings(StorageType.Char, "BGRA");
                    break;
                case TextureFormat.RGBA8888:
                    readSettings.PixelStorage = new PixelStorageSettings(StorageType.Char, "RGBA");
                    break;
                default:
                    throw new NotImplementedException();
            }

            vtf.GetHiResPixelData( mip, frame, face, zslice, _sPixelBuffer, offset );

            var img = new MagickImage( _sPixelBuffer, readSettings );

            if ( img.Width != width || img.Height != height )
            {
                img.Resize( new MagickGeometry( width, height ) { IgnoreAspectRatio = true } );
            }

            return img;
        }
    }
}
