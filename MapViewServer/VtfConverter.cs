using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using ImageMagick;
using SourceUtils;

namespace MapViewServer
{
    public static class VtfConverter
    {
        [Flags]
        private enum DdsHeaderFlags : uint
        {
            CAPS = 0x1,
            HEIGHT = 0x2,
            WIDTH = 0x4,
            PITCH = 0x8,
            PIXELFORMAT = 0x1000,
            MIPMAPCOUNT	= 0x20000,
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
        private static byte[] _sHeaderBuffer;

        [ThreadStatic]
        private static MemoryStream _sMemoryStream;
        
        private static void GetMipMapSize(int width, int height,
            int mipMap, out uint mipMapWidth, out uint mipMapHeight)
        {
            mipMapWidth = (uint) width >> mipMap;
            mipMapHeight = (uint) height >> mipMap;
            
            if (mipMapWidth < 4) mipMapWidth = 4;
            if (mipMapHeight < 4) mipMapHeight = 4;
        }

        private static void ConvertDdsToPng( Stream src, Stream dst, int newWidth = -1, int newHeight = -1 )
        {
            if ( Environment.OSVersion.Platform == PlatformID.Unix ||
                 Environment.OSVersion.Platform == PlatformID.MacOSX )
            {
                try
                {
                    var args = "";
                    if ( newWidth != -1 && newHeight != -1)
                    {
                        args += $"-resize {newWidth}x{newHeight} ";
                    }

                    var processStart = new ProcessStartInfo
                    {
                        FileName = "convert",
                        Arguments = $"dds:- {args}png:-",
                        RedirectStandardInput = true,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };

                    var process = Process.Start( processStart );

                    src.CopyTo( process.StandardInput.BaseStream );
                    process.StandardInput.Close();

                    while ( !process.HasExited || !process.StandardOutput.EndOfStream )
                    {
                        process.StandardOutput.BaseStream.CopyTo( dst );
                        process.WaitForExit( 1 );
                    }
                }
                catch
                {
                    // TODO, handle gracefully
                }
            }
            else
            {
                using ( var image = new MagickImage( src, new MagickReadSettings {Format = MagickFormat.Dds} ) )
                {
                    if ( newWidth != -1 && newHeight != -1)
                    {
                        image.Resize( newWidth, newHeight );
                    }

                    image.Write( dst, MagickFormat.Png );
                }
            }
        }
        
        public static void ConvertToDds( IResourceProvider resources, string vtfFilePath, Stream outStream )
        {
            int width, height;
            ConvertToDds( resources, vtfFilePath, -1, outStream, out width, out height );
        }

        public static unsafe void ConvertToDds( IResourceProvider resources, string vtfFilePath, int mipMap, Stream outStream, out int width, out int height )
        {
            var oneMipMap = mipMap > -1;
            if (mipMap < 0) mipMap = 0;

            ValveTextureFile vtf;
            using ( var vtfStream = resources.OpenFile( vtfFilePath ) )
            {
                vtf = new ValveTextureFile( vtfStream );
            }
                
            if (mipMap >= vtf.Header.MipMapCount)
            {
                ConvertToDds( resources, vtfFilePath, vtf.Header.MipMapCount - 1, outStream, out width, out height);
                return;
            }

            width = vtf.Header.Width >> mipMap;
            height = vtf.Header.Height >> mipMap;
                
            var header = new DdsHeader();
                
            int blockSize;
            uint fourCC;
            switch (vtf.Header.HiResFormat)
            {
                case TextureFormat.DXT1:
                    blockSize = 8;
                    fourCC = 0x31545844;
                    break;
                case TextureFormat.DXT5:
                    blockSize = 16;
                    fourCC = 0x35545844;
                    break;
                default:
                    throw new NotImplementedException();
            }

            GetMipMapSize(vtf.Header.Width, vtf.Header.Height, mipMap, out header.dwWidth, out header.dwHeight);

            header.dwSize = (uint) Marshal.SizeOf(typeof(DdsHeader));
            header.dwFlags = DdsHeaderFlags.CAPS | DdsHeaderFlags.HEIGHT | DdsHeaderFlags.WIDTH
                | DdsHeaderFlags.PIXELFORMAT | (oneMipMap ? 0 : DdsHeaderFlags.MIPMAPCOUNT);
            header.dwPitchOrLinearSize = (uint) (Math.Max(1, (vtf.Header.Width + 3) / 4) * blockSize);
            header.dwDepth = 1;
            header.dwMipMapCount = oneMipMap ? 1 : (uint) vtf.Header.MipMapCount;
            header.dwCaps = DdsCaps.TEXTURE | (oneMipMap ? 0 : DdsCaps.MIPMAP);
            header.ddspf.dwSize = (uint) Marshal.SizeOf(typeof(DdsPixelFormat));
            header.ddspf.dwFlags = DdsPixelFormatFlags.FOURCC;
            header.ddspf.dwFourCC = fourCC;
                
            if (_sHeaderBuffer == null) _sHeaderBuffer = new byte[header.dwSize];
                
            fixed (byte* bufferPtr = _sHeaderBuffer)
            {
                var headerPtr = (DdsHeader*) bufferPtr;
                *headerPtr = header;
            }

            using ( var writer = new BinaryWriter( outStream, Encoding.ASCII, true ) )
            {
                writer.Write( (uint) 0x20534444 );
                writer.Write( _sHeaderBuffer );

                var endMipMap = oneMipMap ? mipMap + 1 : vtf.Header.MipMapCount;
                for ( var i = mipMap; i < endMipMap; ++i )
                {
                    var offset = ValveTextureFile.GetImageDataSize(
                        vtf.Header.Width, vtf.Header.Height,
                        1, mipMap, vtf.Header.HiResFormat );
                    var end = ValveTextureFile.GetImageDataSize(
                        vtf.Header.Width, vtf.Header.Height,
                        1, mipMap + 1, vtf.Header.HiResFormat );

                    writer.Write( vtf.PixelData, offset, end - offset );
                }
            }
        }

        public static void ConvertToPng(IResourceProvider resources, string vtfFilePath, int mipMap, Stream outStream, bool alphaOnly = false)
        {
            if ( _sMemoryStream == null ) _sMemoryStream = new MemoryStream();
            else
            {
                _sMemoryStream.Seek( 0, SeekOrigin.Begin );
                _sMemoryStream.SetLength( 0 );
            }

            int width, height;
            ConvertToDds(resources, vtfFilePath, mipMap, _sMemoryStream, out width, out height );

            _sMemoryStream.Seek( 0, SeekOrigin.Begin );

            if ( width < 4 || height < 4 )
            {
                width = Math.Max( 1, width );
                height = Math.Max( 1, height );
                ConvertDdsToPng( _sMemoryStream, outStream, width, height );
            } else {
                ConvertDdsToPng( _sMemoryStream, outStream );
            }
        }
    }
}