using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
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
    }

    [Flags]
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

    [PathPrefix( "materials" )]
    public class ValveTextureFile
    {
        private enum VtfResourceType : uint
        {
            LowResImage = 0x01,
            HiResImage = 0x30
        }
        
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct VtfResource
        {
            public readonly VtfResourceType Type;
            public readonly uint Data;

            public VtfResource( VtfResourceType type, uint data )
            {
                Type = type;
                Data = data;
            }
        }

        public static ValveTextureFile FromStream( Stream stream )
        {
            return new ValveTextureFile( stream );
        }

        public static int GetImageDataSize( int width, int height, int depth, int mipCount, TextureFormat format )
        {
            if ( mipCount == 0 || width == 0 && height == 0 ) return 0;

            var toAdd = 0;
            if ( mipCount > 1 ) toAdd += GetImageDataSize( width >> 1, height >> 1, depth, mipCount - 1, format );

            if ( format == TextureFormat.DXT1 || format == TextureFormat.DXT3 || format == TextureFormat.DXT5 )
            {
                if ( width < 4 ) width = 4;
                if ( height < 4 ) height = 4;
            }
            else
            {
                if ( width < 1 ) width = 1;
                if ( height < 1 ) height = 1;
            }

            switch ( format )
            {
                case TextureFormat.NONE:
                    return toAdd;
                case TextureFormat.DXT1:
                    return toAdd + ((width * height) >> 1) * depth;
                case TextureFormat.DXT3:
                case TextureFormat.DXT5:
                    return toAdd + width * height * depth;
                case TextureFormat.I8:
                    return toAdd + width * height * depth;
                case TextureFormat.IA88:
                    return toAdd + (width * height * depth) << 1;
                case TextureFormat.ABGR8888:
                case TextureFormat.BGRA8888:
                case TextureFormat.RGBA8888:
                    return toAdd + ((width * height * depth) << 2);
                case TextureFormat.RGBA16161616F:
                    return toAdd + ((width * height * depth) << 3);
                case TextureFormat.BGR888:
                case TextureFormat.RGB888:
                case TextureFormat.RGB888_BLUESCREEN:
                    return toAdd + width * height * depth * 3;
                case TextureFormat.BGR565:
                case TextureFormat.RGB565:
                    return toAdd + width * height * depth * 2;
                default:
                    throw new NotImplementedException();
            }
        }
        
        private readonly byte[] _hiResPixelData;
        private readonly ImageData[] _imageData;

        public TextureHeader Header { get; }
        public int MipmapCount { get; }
        public int FrameCount { get; }
        public int FaceCount { get; }
        public int ZSliceCount { get; }
        
        [StructLayout( LayoutKind.Sequential, Pack = 1 )]
        private struct ImageData
        {
            public readonly int Offset;
            public readonly int Length;

            public ImageData( int offset, int length )
            {
                Offset = offset;
                Length = length;
            }
        }

        [ThreadStatic] private static byte[] _sTempBuffer;

        private static void Skip( Stream stream, long count )
        {
            if ( count == 0 ) return;
            if ( stream.CanSeek )
            {
                stream.Seek( count, SeekOrigin.Current );
                return;
            }

            if ( _sTempBuffer == null || _sTempBuffer.Length < count )
            {
                var size = 256;
                while ( size < count ) size <<= 1;

                _sTempBuffer = new byte[size];
            }

            stream.Read( _sTempBuffer, 0, (int) count );
        }

        public ValveTextureFile( Stream stream, bool onlyHeader = false )
        {
            Header = LumpReader<TextureHeader>.ReadSingleFromStream( stream );
            var readCount = Marshal.SizeOf<TextureHeader>();

            ZSliceCount = 1;

            if ( Header.MajorVersion > 7 || Header.MajorVersion == 7 && Header.MinorVersion >= 2 )
            {
                ZSliceCount = stream.ReadByte() | (stream.ReadByte() << 8);
                readCount += 2;
            }

            MipmapCount = Header.MipMapCount;
            FrameCount = Header.Frames;
            FaceCount = (Header.Flags & TextureFlags.ENVMAP) != 0 ? 6 : 1;

            if ( onlyHeader ) return;

            var thumbSize = GetImageDataSize( Header.LowResWidth, Header.LowResHeight, 1, 1, Header.LowResFormat );

            VtfResource[] resources = null;
            var buffer = new byte[8];

            if ( Header.MajorVersion > 7 || Header.MajorVersion == 7 && Header.MinorVersion >= 3 )
            {
                Skip( stream, 3 );
                readCount += 3;

                stream.Read( buffer, 0, 4 );
                readCount += 4;

                var resourceCount = BitConverter.ToInt32( buffer, 0 );

                // Probably padding?
                stream.Read( buffer, 0, 8 );
                readCount += 8;

                resources = LumpReader<VtfResource>.ReadLumpFromStream( stream, resourceCount );
                readCount += Marshal.SizeOf<VtfResource>() * resourceCount;
            }

            if ( resources == null || resources.Length == 0 )
            {
                resources = new VtfResource[2];
                resources[0] = new VtfResource(VtfResourceType.LowResImage, Header.HeaderSize);
                resources[1] = new VtfResource(VtfResourceType.HiResImage, Header.HeaderSize + (uint) thumbSize);
            }

            Skip( stream, Header.HeaderSize - readCount );
            readCount = (int) Header.HeaderSize;

            switch ( Header.HiResFormat )
            {
                case TextureFormat.DXT1:
                case TextureFormat.DXT3:
                case TextureFormat.DXT5:
                case TextureFormat.I8:
                case TextureFormat.IA88:
                case TextureFormat.BGR565:
                case TextureFormat.RGB565:
                case TextureFormat.BGR888:
                case TextureFormat.RGB888:
                case TextureFormat.RGB888_BLUESCREEN:
                case TextureFormat.ABGR8888:
                case TextureFormat.BGRA8888:
                case TextureFormat.RGBA8888:
                case TextureFormat.RGBA16161616F:
                    break;
                default:
                    throw new NotImplementedException( $"VTF format: {Header.HiResFormat}" );
            }

            _imageData = new ImageData[MipmapCount * FrameCount * FaceCount * ZSliceCount];

            var offset = 0;
            for ( var mipmap = MipmapCount - 1; mipmap >= 0; --mipmap )
            {
                var length = GetImageDataSize( Header.Width >> mipmap, Header.Height >> mipmap, 1, 1, Header.HiResFormat );

                for ( var frame = 0; frame < FrameCount; ++frame )
                for ( var face = 0; face < FaceCount; ++face )
                for ( var zslice = 0; zslice < ZSliceCount; ++zslice )
                {
                    var index = GetImageDataIndex( mipmap, frame, face, zslice );
                    _imageData[index] = new ImageData( offset, length );
                    offset += length;
                }
            }

            var hiResEntry = resources.First( x => x.Type == VtfResourceType.HiResImage );

            Skip( stream, hiResEntry.Data - readCount );

            _hiResPixelData = new byte[offset];
            stream.Read( _hiResPixelData, 0, offset );
        }

        private int GetImageDataIndex( int mipmap, int frame, int face, int zslice )
        {
            return zslice + ZSliceCount * (face + FaceCount * (frame + FrameCount * mipmap));
        }

        public int GetHiResPixelDataLength( int mipmap )
        {
            return GetHiResPixelData( mipmap, 0, 0, 0, null );
        }

        public int GetHiResPixelData( int mipmap, int frame, int face, int zslice, byte[] dst, int dstOffset = 0 )
        {
            var entry = _imageData[GetImageDataIndex( mipmap, frame, face, zslice )];
            if ( dst != null ) Array.Copy( _hiResPixelData, entry.Offset, dst, dstOffset, entry.Length );

            return entry.Length;
        }

        public void WriteHiResPixelData( int mipmap, int frame, int face, int zslice, BinaryWriter writer )
        {
            var entry = _imageData[GetImageDataIndex( mipmap, frame, face, zslice )];
            writer.Write( _hiResPixelData, entry.Offset, entry.Length );
        }

        public void WriteHiResPixelData( int mipmap, int frame, int face, int zslice, Stream stream )
        {
            var entry = _imageData[GetImageDataIndex( mipmap, frame, face, zslice )];
            stream.Write( _hiResPixelData, entry.Offset, entry.Length );
        }
    }
}