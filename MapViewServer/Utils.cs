using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using System.Linq;
using System.Text;
using ImageMagick;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;

namespace MapViewServer
{
    public static class Utils
    {
        private static readonly Regex _sRepeatedSepRegex = new Regex("//+", RegexOptions.Compiled);
        
        public static string JoinUrl(params string[] parts)
        {
            return _sRepeatedSepRegex.Replace(string.Join("/", parts.Where(x => x.Length > 0)), "/");
        }

        public static JToken ToJson( this IntVector2 vector )
        {
            return new JObject
            {
                { "x", vector.X },
                { "y", vector.Y }
            };
        }

        public static JToken ToJson( this Vector3 vector )
        {
            return new JObject
            {
                { "x", vector.X },
                { "y", vector.Y },
                { "z", vector.Z }
            };
        }

        public static JToken ToJson( this Vector3S vector )
        {
            return new JObject
            {
                { "x", vector.X },
                { "y", vector.Y },
                { "z", vector.Z }
            };
        }

        public static JToken ToJson( this Color32 color )
        {
            return new JObject
            {
                {"r", color.R},
                {"g", color.G},
                {"b", color.B},
                {"a", color.A}
            };
        }

        public static JToken ToJson( this Plane plane )
        {
            return new JObject
            {
                { "normal", plane.Normal.ToJson() },
                { "dist", plane.Dist }
            };
        }

        public static JToken ToJson( this IntRect rect )
        {
            return new JObject
            {
                { "x", rect.X },
                { "y", rect.Y },
                { "width", rect.Width },
                { "height", rect.Height }
            };
        }

        public static void ImageMagickConvert( Stream src, Stream dst,
            MagickFormat srcFormat, MagickFormat dstFormat, int dstWidth = -1, int dstHeight = -1 )
        {
            ImageMagickConvert( src, dst, srcFormat, -1, -1, dstFormat, dstWidth, dstHeight );
        }

        [ThreadStatic]
        private static StringBuilder _sArrayBuilder;

        public static JToken SerializeArray<T>( IEnumerable<T> enumerable, bool compressed )
        {
            return SerializeArray( enumerable, x => x.ToString(), compressed );
        }

        public static JToken SerializeArray<T>( IEnumerable<T> enumerable, Func<T, string> serializer, bool compressed )
        {
            if ( _sArrayBuilder == null ) _sArrayBuilder = new StringBuilder();
            else _sArrayBuilder.Remove( 0, _sArrayBuilder.Length );

            _sArrayBuilder.Append( "[" );
            foreach ( var item in enumerable )
            {
                _sArrayBuilder.Append( serializer( item ) );
                _sArrayBuilder.Append( "," );
            }

            if ( _sArrayBuilder.Length > 1 ) _sArrayBuilder.Remove( _sArrayBuilder.Length - 1, 1 );
            _sArrayBuilder.Append( "]" );
            
            return compressed
                ? (JToken) LZString.compressToBase64( _sArrayBuilder.ToString() )
                : JArray.Parse( _sArrayBuilder.ToString() );
        }

        [ThreadStatic]
        private static MemoryStream _sBufferStream;

        public static void ImageMagickConvert( byte[] src, Stream dst,
            MagickFormat srcFormat, int srcWidth, int srcHeight,
            MagickFormat dstFormat, int dstWidth = -1, int dstHeight = -1 )
        {
            if ( _sBufferStream == null ) _sBufferStream = new MemoryStream();
            else
            {
                _sBufferStream.Seek( 0, SeekOrigin.Begin );
                _sBufferStream.SetLength( 0 );
            }

            _sBufferStream.Write( src, 0, src.Length );
            _sBufferStream.Seek( 0, SeekOrigin.Begin );

            ImageMagickConvert( _sBufferStream, dst, srcFormat, srcWidth, srcHeight, dstFormat, dstWidth, dstHeight );
        }

        public static void ImageMagickConvert( Stream src, Stream dst,
            MagickFormat srcFormat, int srcWidth, int srcHeight,
            MagickFormat dstFormat, int dstWidth = -1, int dstHeight = -1 )
        {
            if ( Environment.OSVersion.Platform == PlatformID.Unix ||
                 Environment.OSVersion.Platform == PlatformID.MacOSX )
            {
                try
                {
                    var args = "";
                    if ( dstWidth != -1 && dstHeight != -1 && (dstWidth != srcWidth || dstHeight != srcHeight) )
                    {
                        args += $"-resize {dstWidth}x{dstHeight}! ";
                    }

                    if ( srcFormat == MagickFormat.Bgra || srcFormat == MagickFormat.Bgr || srcFormat == MagickFormat.Rgba )
                    {
                        args += $"-size {srcWidth}x{srcHeight} -depth 8 ";
                    }

                    var processStart = new ProcessStartInfo
                    {
                        FileName = "convert",
                        Arguments = $"{args}{srcFormat.ToString().ToLower()}:- {dstFormat.ToString().ToLower()}:-",
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
                var readSettings = new MagickReadSettings
                {
                    Format = srcFormat
                };

                if ( srcFormat == MagickFormat.Bgra || srcFormat == MagickFormat.Rgba || srcFormat == MagickFormat.Bgr )
                {
                    readSettings.PixelStorage = new PixelStorageSettings
                    {
                        Mapping = srcFormat.ToString().ToUpper(),
                        StorageType = StorageType.Char
                    };

                    readSettings.Width = srcWidth;
                    readSettings.Height = srcHeight;
                }

                using ( var image = new MagickImage( src, readSettings ) )
                {
                    if ( dstWidth != -1 && dstHeight != -1 )
                    {
                        image.Resize( new MagickGeometry( dstWidth, dstHeight ) {IgnoreAspectRatio = true} );
                    }

                    image.Write( dst, dstFormat );
                }
            }
        }
    }
}
