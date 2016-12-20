using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Diagnostics;
using SourceUtils;

namespace MapViewServer
{
    public class VtfServlet : ResourceServlet
    {
        [Flags]
        private enum DDSHeaderFlags : uint
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
        
        private enum DDSCaps : uint
        {
            COMPLEX = 0x8,
            MIPMAP = 0x400000,
            TEXTURE = 0x1000
        }
        
        [Flags]
        private enum DDSPixelFormatFlags
        {
            ALPHAPIXELS = 0x1,
            ALPHA = 0x2,
            FOURCC = 0x4,
            RGB = 0x40,
            YUV = 0x200,
            LUMINANCE = 0x20000
        }
        
        [StructLayout(LayoutKind.Sequential)]
        private struct DDSPixelFormat
        {
            public uint dwSize;
            public DDSPixelFormatFlags dwFlags;
            public uint dwFourCC;
            public uint dwRGBBitCount;
            public uint dwRBitMask;
            public uint dwGBitMask;
            public uint dwBBitMask;
            public uint dwABitMask;
        }
        
        [StructLayout(LayoutKind.Sequential)]
        private unsafe struct DDSHeader
        {
            public uint dwSize;
            public DDSHeaderFlags dwFlags;
            public uint dwHeight;
            public uint dwWidth;
            public uint dwPitchOrLinearSize;
            public uint dwDepth;
            public uint dwMipMapCount;
            public fixed uint dwReserved1[11];
            public DDSPixelFormat ddspf;
            public DDSCaps dwCaps;
            public uint dwCaps2;
            public uint dwCaps3;
            public uint dwCaps4;
            public uint dwReserved2;
        }
        
        [ThreadStatic]
        private static byte[] _sHeaderBuffer;
        
        protected override unsafe void OnService()
        {
            Response.ContentType = "image/png";
            
            var cachePath = Path.Combine(Program.CacheDirectory, FilePath);
            var pngPath = $"{cachePath}.png";
            
            if (!File.Exists(pngPath))
            {
                var ddsPath = $"{cachePath}.dds";
                var vtf = Program.Loader.Load<ValveTextureFile>(FilePath);
                
                var cacheDir = Path.GetDirectoryName(cachePath);
                if (!Directory.Exists(cacheDir)) Directory.CreateDirectory(cacheDir);
                
                var header = new DDSHeader();
                var hasMipMaps = vtf.Header.MipMapCount > 1;
                
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
                
                header.dwSize = (uint) Marshal.SizeOf(typeof(DDSHeader));
                header.dwFlags = DDSHeaderFlags.CAPS | DDSHeaderFlags.HEIGHT | DDSHeaderFlags.WIDTH
                    | DDSHeaderFlags.PIXELFORMAT | (hasMipMaps ? DDSHeaderFlags.MIPMAPCOUNT : 0);
                header.dwHeight = vtf.Header.Height;
                header.dwWidth = vtf.Header.Width;
                header.dwPitchOrLinearSize = (uint) (Math.Max(1, (vtf.Header.Width + 3) / 4) * blockSize);
                header.dwDepth = 1;
                header.dwMipMapCount = vtf.Header.MipMapCount;
                header.dwCaps = DDSCaps.TEXTURE | (hasMipMaps ? DDSCaps.MIPMAP : 0);
                header.ddspf.dwSize = (uint) Marshal.SizeOf(typeof(DDSPixelFormat));
                header.ddspf.dwFlags = DDSPixelFormatFlags.FOURCC;
                header.ddspf.dwFourCC = fourCC;
                
                Debug.Assert(header.dwSize == 124);
                Debug.Assert(header.ddspf.dwSize == 32);
                
                if (_sHeaderBuffer == null) _sHeaderBuffer = new byte[header.dwSize];
                
                fixed (byte* bufferPtr = _sHeaderBuffer)
                {
                    DDSHeader* headerPtr = (DDSHeader*) bufferPtr;
                    *headerPtr = header;
                }
                
                using (var stream = File.Open(ddsPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new BinaryWriter(stream))
                {
                    writer.Write((uint) 0x20534444);
                    writer.Write(_sHeaderBuffer);
                    writer.Write(vtf.PixelData);
                }
                
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "convert",
                        Arguments = string.Format("\"{0}\" \"{1}\"", ddsPath, pngPath)
                    }
                };

                process.Start();
                process.WaitForExit(5000);
                
                File.Delete(ddsPath);
            }
            
            using (var stream = File.Open(pngPath, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                stream.CopyTo(Response.OutputStream);
            }
        }
    }
}