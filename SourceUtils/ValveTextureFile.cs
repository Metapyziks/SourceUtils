using System;
using System.IO;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct TextureHeader
    {
        public int Signature;
        public uint MajorVersion;
        public uint MinorVersion;
        public uint HeaderSize;
        public ushort Width;
        public ushort Height;
        public TextureFlags Flags;
        public ushort Frames;
        public ushort FirstFrame;
        private int _padding0;
        public float ReflectivityR;
        public float ReflectivityG;
        public float ReflectivityB;
        private int _padding1;
        public float BumpmapScale;
        public TextureFormat HiResFormat;
        public byte MipMapCount;
        public TextureFormat LowResFormat;
        public byte LowResWidth;
        public byte LowResHeight;
        public ushort Depth;
    }
    
    public enum TextureFlags : uint
    {
        POINTSAMPLE = 0x00000001,
        TRILINEAR = 0x00000002,
        CLAMPS = 0x00000004,
        CLAMPT = 0x00000008,
        ANISOTROPIC = 0x00000010,
        HINT_DXT5 = 0x00000020,
        PWL_CORRECTED = 0x00000040,
        NORMAL = 0x00000080,
        NOMIP = 0x00000100,
        NOLOD = 0x00000200,
        ALL_MIPS = 0x00000400,
        PROCEDURAL = 0x00000800,
        
        ONEBITALPHA = 0x00001000,
        EIGHTBITALPHA = 0x00002000,
        
        ENVMAP = 0x00004000,
        RENDERTARGET = 0x00008000,
        DEPTHRENDERTARGET = 0x00010000,
        NODEBUGOVERRIDE = 0x00020000,
        SINGLECOPY = 0x00040000,
        PRE_SRGB = 0x00080000,

        UNUSED_00100000 = 0x00100000,
        UNUSED_00200000 = 0x00200000,
        UNUSED_00400000 = 0x00400000,

        NODEPTHBUFFER = 0x00800000,

        UNUSED_01000000 = 0x01000000,

        CLAMPU = 0x02000000,
        VERTEXTEXTURE = 0x04000000,
        SSBUMP = 0x08000000,

        UNUSED_10000000 = 0x10000000,

        BORDER = 0x20000000,

        UNUSED_40000000 = 0x40000000,
        UNUSED_80000000 = 0x80000000
    }

    public enum TextureFormat : uint
    {
        NONE = 0xffffffff,
        RGBA8888 = 0,
        ABGR8888,
        RGB888,
        BGR888,
        RGB565,
        I8,
        IA88,
        P8,
        A8,
        RGB888_BLUESCREEN,
        BGR888_BLUESCREEN,
        ARGB8888,
        BGRA8888,
        DXT1,
        DXT3,
        DXT5,
        BGRX8888,
        BGR565,
        BGRX5551,
        BGRA4444,
        DXT1_ONEBITALPHA,
        BGRA5551,
        UV88,
        UVWQ8888,
        RGBA16161616F,
        RGBA16161616,
        UVLX8888
    }

    public class ValveTextureFile
    {
        public static ValveTextureFile FromStream(Stream stream)
        {
            return new ValveTextureFile(stream);
        }

        public static int GetImageDataSize(int width, int height, int depth, int mipCount, TextureFormat format)
        {
            if (mipCount == 0 || width == 0 && height == 0) return 0;

            var toAdd = 0;
            if (mipCount > 1) toAdd += GetImageDataSize(width >> 1, height >> 1, depth, mipCount - 1, format);
            
            // TODO: move this when supporting non-DXT formats
            if (width < 4) width = 4;
            if (height < 4) height = 4;

            switch (format)
            {
                case TextureFormat.NONE: return toAdd;
                case TextureFormat.DXT1: return toAdd + ((width*height) >> 1) * depth;
                case TextureFormat.DXT5: return toAdd + width * height*depth;
                default: throw new NotImplementedException();
            }
        }

        public TextureHeader Header { get; }
        public byte[] PixelData { get; }

        private ValveTextureFile(Stream stream)
        {
            Header = LumpReader<TextureHeader>.ReadSingleFromStream(stream);

            stream.Seek(Header.HeaderSize, SeekOrigin.Begin);

            var thumbSize = GetImageDataSize(Header.LowResWidth, Header.LowResHeight, 1, 1, Header.LowResFormat);

            switch (Header.HiResFormat)
            {
                case TextureFormat.DXT1: break;
                case TextureFormat.DXT5: break;
                default: throw new NotImplementedException(string.Format("VTF format: {0}", Header.HiResFormat));
            }
            
            stream.Seek(thumbSize, SeekOrigin.Current);
            
            var totalSize = GetImageDataSize(Header.Width, Header.Height, 1, Header.MipMapCount, Header.HiResFormat);

            PixelData = new byte[totalSize];
            
            var width = Header.Width;
            var height = Header.Height;

            var start = stream.Position;
            var offset = totalSize;
            var writePos = 0;

            for (var i = 0; i < Header.MipMapCount; ++i)
            {
                var size = GetImageDataSize(width, height, 1, 1, Header.HiResFormat);

                offset -= size;

                stream.Seek(start + offset, SeekOrigin.Begin);
                stream.Read(PixelData, writePos, size);

                writePos += size;

                width >>= 1;
                height >>= 1;
            }
        }
    }
}