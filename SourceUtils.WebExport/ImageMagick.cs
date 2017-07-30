#if LINUX
using System;
using System.IO;

namespace ImageMagick
{
    public enum MagickFormat
    {
        Default,
        Png,
        Dds
    }
    
    public enum StorageType
    {
        Char
    }
    
    public struct MagickGeometry
    {
        public int Width;
        public int Height;
        public bool IgnoreAspectRatio;
        
        public MagickGeometry( int width, int height )
        {
            Width = width;
            Height = height;
            IgnoreAspectRatio = false;
        }
    }
    
    public class MagickReadSettings
    {
        public int Width { get; set; }
        public int Height { get; set; }
        public MagickFormat Format { get; set; }
        public PixelStorageSettings PixelStorage { get; set; }
    }
    
    public class PixelStorageSettings
    {
        public StorageType StorageType { get; set; }
        public string ChannelFormat { get; set; }
        
        public PixelStorageSettings( StorageType storageType, string channelFormat )
        {
            StorageType = storageType;
            ChannelFormat = channelFormat;
        }
    }
    
    public struct Pixel
    {
        public readonly int Channels;
        
        private readonly byte _r;
        private readonly byte _g;
        private readonly byte _b;
        private readonly byte _a;
        
        public Pixel(byte r, byte g, byte b)
        {
            Channels = 3;
            _r = r;
            _g = g;
            _b = b;
            _a = 0;
        }
        
        public Pixel(byte r, byte g, byte b, byte a)
        {
            Channels = 4;
            _r = r;
            _g = g;
            _b = b;
            _a = a;
        }
        
        public byte this[int channel]
        {
            get
            {
                switch (channel)
                {
                    case 0: return _r;
                    case 1: return _g;
                    case 2: return _b;
                    case 3: return _a;
                    default: return 0;
                }
            }
        }
    }
    
    public class ImagePixels
    {
        public Pixel this[int x, int y]
        {
            get { throw new NotImplementedException(); }
        }
    }
    
    public class MagickImage : IDisposable
    {
        public int Width { get; private set; }
        public int Height { get; private set; }
        
        public int ChannelCount { get; private set; }
        
        public MagickImage( string filePath, MagickReadSettings readSettings )
        {
            throw new NotImplementedException();
        }
        
        public MagickImage( Stream stream, MagickReadSettings readSettings )
        {
            throw new NotImplementedException();
        }
        
        public MagickImage( byte[] rawData, MagickReadSettings readSettings )
        {
            throw new NotImplementedException();
        }
        
        public ImagePixels GetPixels()
        {
            throw new NotImplementedException();
        }
        
        public void Resize( MagickGeometry geometry )
        {
            throw new NotImplementedException();
        }
        
        public void Write( string filePath )
        {
            throw new NotImplementedException();
        }
        
        public void Write( Stream stream, MagickFormat format )
        {
            throw new NotImplementedException();
        }
        
        public void Dispose()
        {
            
        }
    }
}

#endif