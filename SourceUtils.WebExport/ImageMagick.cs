#if LINUX
using System;
using System.IO;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;

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
        
        public Pixel( byte r, byte g, byte b )
        {
            Channels = 3;
            _r = r;
            _g = g;
            _b = b;
            _a = 0;
        }
        
        public Pixel( byte r, byte g, byte b, byte a )
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
                switch ( channel )
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
    
    public class MagickImage : IDisposable
    {
        [ThreadStatic]
        private static StringBuilder _sArgBuilder;

        private static void Cli( Stream input, MagickReadSettings inputReadSettings,
            Stream output, MagickReadSettings outputReadSettings, params string[] args )
        {
            if ( _sArgBuilder == null ) _sArgBuilder = new StringBuilder();
            else _sArgBuilder.Remove( 0, _sArgBuilder.Length );

            if ( input != null )
            {
                switch ( inputReadSettings.Format )
                {
                    case MagickFormat.Default:
                        _sArgBuilder.Append( $" -size {inputReadSettings.Width}x{inputReadSettings.Height}" );
                        _sArgBuilder.Append( $" -depth {8}" );
                        _sArgBuilder.Append( $" {inputReadSettings.PixelStorage.ChannelFormat.ToString().ToLower()}:-");
                        break;
                    case MagickFormat.Png:
                        _sArgBuilder.Append( $" png:-" );
                        break;
                    case MagickFormat.Dds:
                        _sArgBuilder.Append( $" dds:-" );
                        break;
                    default: throw new NotImplementedException();
                }
            }

            foreach ( var arg in args )
            {
                _sArgBuilder.Append( $" \"{arg}\"" );
            }

            if ( output != null )
            {
                switch ( outputReadSettings.Format )
                {
                    case MagickFormat.Default:
                        _sArgBuilder.Append( $" {outputReadSettings.PixelStorage.ChannelFormat.ToString().ToLower()}:-");
                        break;
                    case MagickFormat.Png:
                        _sArgBuilder.Append( $" png:-" );
                        break;
                    case MagickFormat.Dds:
                        _sArgBuilder.Append( $" dds:-" );
                        break;
                    default: throw new NotImplementedException();
                }
            }

            var process = new Process
            {
                StartInfo =
                {
                    FileName = "convert",
                    Arguments = _sArgBuilder.ToString().Substring( 1 ),
                    CreateNoWindow = true,
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false
                }
            };
            
            process.Start();

            if ( input != null )
            {
                input.CopyTo( process.StandardInput.BaseStream );
                process.StandardInput.BaseStream.Close();
            }

            if ( output != null )
            {
                process.StandardOutput.BaseStream.CopyTo( output );
            }
            
            process.WaitForExit();
        }

        public class Pixels
        {
            public Pixel this[int x, int y]
            {
                get
                {
                    var baseIndex = _rowStride * y + _channels * x;
                    return new Pixel(
                        _pixelData[baseIndex + _rloc],
                        _pixelData[baseIndex + _gloc],
                        _pixelData[baseIndex + _bloc],
                        _pixelData[baseIndex + _aloc] );
                }
            }

            private readonly byte[] _pixelData;

            private readonly int _channels;
            private readonly int _rowStride;
            private readonly int _rloc;
            private readonly int _gloc;
            private readonly int _bloc;
            private readonly int _aloc;

            public Pixels( MagickImage image )
            {
                _pixelData = image._mainBuffer.GetBuffer();

                _channels = image.ChannelCount;
                _rowStride = _channels * image.Width;
                
                var channelFormat = image._readSettings.PixelStorage.ChannelFormat;

                _rloc = Math.Max( channelFormat.IndexOf( 'R' ), 0 );
                _gloc = Math.Max( channelFormat.IndexOf( 'G' ), 0 );
                _bloc = Math.Max( channelFormat.IndexOf( 'B' ), 0 );
                _aloc = Math.Max( channelFormat.IndexOf( 'A' ), 0 );
            }
        }
        
        private const int MaxPooledStreams = 64;
        private static readonly List<MemoryStream> _sStreamPool = new List<MemoryStream>();
        
        private static MemoryStream CreateStream()
        {
            MemoryStream last;
            lock ( _sStreamPool )
            {
                if ( _sStreamPool.Count < 1 ) return new MemoryStream();
                last = _sStreamPool[_sStreamPool.Count - 1];
                _sStreamPool.RemoveAt( _sStreamPool.Count - 1 );
            }
            
            last.Seek( 0, SeekOrigin.Begin );
            last.SetLength( 0 );
            
            return last;
        }
        
        private static void ReleaseStream( MemoryStream stream )
        {
            lock ( _sStreamPool )
            {
                if ( _sStreamPool.Count >= MaxPooledStreams ) return;
                _sStreamPool.Add( stream );
            }
        }
        
        private MemoryStream _mainBuffer;
        private MagickReadSettings _readSettings;
        private Pixels _pixels;
        
        public int Width => _readSettings.Width;
        public int Height => _readSettings.Height;
        
        public int ChannelCount => _readSettings.Format == MagickFormat.Default
            ? _readSettings.PixelStorage.ChannelFormat.Length
            : 4;
        
        private MagickImage( MagickReadSettings readSettings )
        {
            _mainBuffer = CreateStream();
            _readSettings = readSettings;
        }

        public MagickImage( string filePath, MagickReadSettings readSettings )
            : this( readSettings )
        {
            using ( var stream = File.Open( filePath, FileMode.Open, FileAccess.Read ) )
            {
                stream.CopyTo( _mainBuffer );
            }
        }
        
        public MagickImage( Stream stream, MagickReadSettings readSettings )
            : this( readSettings )
        {
            stream.CopyTo( _mainBuffer );
        }
        
        public MagickImage( byte[] rawData, MagickReadSettings readSettings )
            : this( readSettings )
        {
            _mainBuffer.Write( rawData, 0, rawData.Length );
        }

        private bool CanReadPixels
        {
            get { return _readSettings.Format == MagickFormat.Default; }
        }

        private void Cli( MagickReadSettings readSettings, params string[] args )
        {
            var dest = CreateStream();

            if ( readSettings.Width == 0 ) readSettings.Width = _readSettings.Width;
            if ( readSettings.Height == 0 ) readSettings.Height = _readSettings.Height;

            _mainBuffer.Seek( 0, SeekOrigin.Begin );
            Cli( _mainBuffer, _readSettings, dest, readSettings, args );

            ReleaseStream( _mainBuffer );
            _mainBuffer = dest;
            _readSettings = readSettings;

            _pixels = null;
        }
        
        public Pixels GetPixels()
        {
            if ( !CanReadPixels )
            {
                Cli( new MagickReadSettings
                {
                    Format = MagickFormat.Default,
                    PixelStorage = new PixelStorageSettings( StorageType.Char, "RGBA" )
                } );
            }

            return _pixels ?? (_pixels = new Pixels( this ));
        }
        
        public void Resize( MagickGeometry geometry )
        {
            var postfix = geometry.IgnoreAspectRatio ? "!" : "";

            Cli( _readSettings, "-resize", $"{geometry.Width}x{geometry.Height}{postfix}" );

            _readSettings.Width = geometry.Width;
            _readSettings.Height = geometry.Height;
        }
        
        public void Write( string filePath )
        {
            _mainBuffer.Seek( 0, SeekOrigin.Begin );
            Cli( _mainBuffer, _readSettings, null, null, filePath );
        }
        
        public void Write( Stream stream, MagickFormat format )
        {
            _mainBuffer.Seek( 0, SeekOrigin.Begin );
            Cli( _mainBuffer, _readSettings, stream, new MagickReadSettings { Format = format } );
        }
        
        public void Dispose()
        {
            if ( _mainBuffer != null )
            {
                ReleaseStream( _mainBuffer );
                _mainBuffer = null;
            }
        }
    }
}

#endif