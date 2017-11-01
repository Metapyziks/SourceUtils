using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Web;
using MimeTypes;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    [JsonConverter( typeof(UrlConverter) )]
    public struct Url : IEquatable<Url>
    {
        public static implicit operator Url( string value )
        {
            return new Url( value );
        }

        public static implicit operator string( Url url )
        {
            return url.Value;
        }

        public readonly string Value;
        public readonly bool Export;

        public Url( string value, bool export = true )
        {
            Value = value;
            Export = export;
        }

        public bool Equals( Url other )
        {
            return string.Equals( Value, other.Value );
        }

        public override bool Equals( object obj )
        {
            if ( ReferenceEquals( null, obj ) ) return false;
            return obj is Url && Equals( (Url) obj );
        }

        public override int GetHashCode()
        {
            return Value != null ? Value.GetHashCode() : 0;
        }

        public override string ToString()
        {
            return Value;
        }
    }

    public class UrlConverter : JsonConverter
    {
        private static string GetTimeHash()
        {
            return GetFileVersionHash( DateTime.UtcNow );
        }

        private static string GetFileVersionHash(DateTime timestamp)
        {
            var major = (int)(timestamp - new DateTime(2000, 1, 1)).TotalDays;
            var minor = (int)(timestamp - new DateTime(timestamp.Year, timestamp.Month, timestamp.Day)).TotalSeconds;
            return $"{major:x}-{minor:x}";
        }

        private static bool ShouldAppendVersionSuffix( Url url )
        {
            switch ( Path.GetExtension( url ).ToLower() )
            {
                case ".png":
                    return false;
                default:
                    return true;
            }
        }

        public override void WriteJson( JsonWriter writer, object value, JsonSerializer serializer )
        {
            var url = (Url) value;

            if ( url.Value == null )
            {
                writer.WriteNull();
                return;
            }

            var encoded = HttpUtility.UrlEncode( url.Value ).Replace( "%2f", "/" ).Replace( "+", "%20" );
            var suffix = ShouldAppendVersionSuffix(url) ? $"?v={GetTimeHash()}" : "";

            if ( url.Export && Program.IsExporting )
            {
                Program.AddExportUrl( url );
                writer.WriteValue( $"{Program.ExportOptions.UrlPrefix}{encoded}{suffix}" );
            }
            else writer.WriteValue( $"{encoded}{suffix}" );
        }

        public override object ReadJson( JsonReader reader, Type objectType, object existingValue,
            JsonSerializer serializer )
        {
            return new Url( reader.ReadAsString() );
        }

        public override bool CanConvert( Type objectType )
        {
            return objectType == typeof(Url);
        }
    }

    internal interface ICompressedList
    {
        int Count { get; }
        int MaxUncompressedCount { get; set; }
        void WriteRaw( JsonWriter writer, JsonSerializer serializer );
    }

    [JsonConverter(typeof(CompressedListConverter))]
    public class CompressedList<T> : List<T>, ICompressedList
    {
        private class EnumerableHack : IEnumerable<T>
        {
            private readonly CompressedList<T> _list;

            public EnumerableHack( CompressedList<T> list )
            {
                _list = list;
            }

            public IEnumerator<T> GetEnumerator()
            {
                return _list.GetEnumerator();
            }

            IEnumerator IEnumerable.GetEnumerator()
            {
                return GetEnumerator();
            }
        }

        private readonly EnumerableHack _enumerable;

        public CompressedList()
        {
            _enumerable = new EnumerableHack( this );
        }

        public CompressedList( IEnumerable<T> collection )
            : base( collection )
        {
            _enumerable = new EnumerableHack( this );
        }

        public int MaxUncompressedCount { get; set; } = 256;

        public virtual void WriteRaw( JsonWriter writer, JsonSerializer serializer )
        {
            serializer.Serialize( writer, _enumerable, typeof(IEnumerable<T>) );
        }
    }

    public class CompressedFloatList : CompressedList<float>
    {
        [ThreadStatic]
        private static StringBuilder _sStringBuilder;

        public string FormatString { get; set; } = "G";

        public override void WriteRaw( JsonWriter writer, JsonSerializer serializer )
        {
            if ( _sStringBuilder == null ) _sStringBuilder = new StringBuilder();
            else _sStringBuilder.Remove( 0, _sStringBuilder.Length );

            writer.WriteStartArray();

            var formatString = FormatString;

            foreach ( var item in this )
            {
                _sStringBuilder.Append( item.ToString( formatString ).TrimEnd( '0' ).TrimEnd( '.' ) );
                _sStringBuilder.Append( "," );
            }

            writer.WriteRaw( _sStringBuilder.ToString( 0, _sStringBuilder.Length - 1 ) );
            writer.WriteEndArray();
        }
    }

    public class CompressedListConverter : JsonConverter
    {
        private struct TempWriter : IDisposable
        {
            private readonly StringWriter _textWriter;

            public readonly JsonTextWriter Writer;

            public TempWriter( StringWriter textWriter )
            {
                _textWriter = textWriter;
                Writer = new JsonTextWriter( textWriter );
            }

            public void Clear()
            {
                Writer.Flush();
                _textWriter.GetStringBuilder().Clear();
            }

            public string GetString()
            {
                Writer.Flush();
                return _textWriter.ToString();
            }

            public void Dispose()
            {
                ReleaseTempWriter( this );
            }
        }

        private const int MaxPoolSize = 256;

        [ThreadStatic]
        private static List<TempWriter> _sTempWriters;

        private static TempWriter GetTempWriter()
        {
            if ( _sTempWriters == null || _sTempWriters.Count == 0 )
            {
                return new TempWriter( new StringWriter() );
            }

            var last = _sTempWriters[_sTempWriters.Count - 1];
            _sTempWriters.RemoveAt( _sTempWriters.Count - 1 );

            last.Clear();

            return last;
        }

        private static void ReleaseTempWriter( TempWriter writer )
        {
            if ( _sTempWriters == null ) _sTempWriters = new List<TempWriter>();
            if ( _sTempWriters.Count >= MaxPoolSize ) return;

            _sTempWriters.Add( writer );
        }

        public override void WriteJson( JsonWriter writer, object value, JsonSerializer serializer )
        {
            var list = (ICompressedList) value;

            if ( list == null )
            {
                writer.WriteNull();
                return;
            }

            if ( list.Count <= list.MaxUncompressedCount )
            {
                list.WriteRaw( writer, serializer );
                return;
            }

            string raw;
            using ( var tempWriter = GetTempWriter() )
            {
                list.WriteRaw( tempWriter.Writer, serializer );
                raw = tempWriter.GetString();
            }

            writer.WriteValue( LZString.compressToBase64( raw ) );
        }

        public override object ReadJson( JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer )
        {
            throw new NotImplementedException();
        }

        public override bool CanConvert( Type objectType )
        {
            return typeof(ICompressedList).IsAssignableFrom( objectType );
        }
    }

    public class NiceArrayConverter : JsonConverter
    {
        public override void WriteJson( JsonWriter writer, object value, JsonSerializer serializer )
        {
            if ( value == null )
            {
                writer.WriteNull();
                return;
            }

            var floatArr = value as IEnumerable<float>;
            var intArr = value as IEnumerable<int>;
            var uintArr = value as IEnumerable<uint>;

            string raw;

            if ( floatArr != null )
            {
                raw = string.Join( ",", floatArr );
            }
            else if ( intArr != null )
            {
                raw = string.Join( ",", intArr );
            }
            else if ( uintArr != null )
            {
                raw = string.Join( ",", uintArr );
            }
            else
            {
                throw new NotImplementedException();
            }

            writer.WriteStartArray();
            writer.WriteRaw( raw );
            writer.WriteEndArray();
        }

        public override object ReadJson( JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer )
        {
            throw new NotImplementedException();
        }

        public override bool CanConvert( Type objectType )
        {
            return typeof(IEnumerable<float>).IsAssignableFrom( objectType ) ||
                   typeof(IEnumerable<int>).IsAssignableFrom( objectType ) ||
                   typeof(IEnumerable<uint>).IsAssignableFrom( objectType );
        }
    }

    class ResourceController : Controller
    {
        private static readonly JsonSerializer _sSerializer = new JsonSerializer
        {
            NullValueHandling = NullValueHandling.Ignore,
#if DEBUG
            Formatting = Formatting.Indented,
#else
            Formatting = Formatting.None,
#endif
        };

        static ResourceController()
        {
            _sSerializer.Converters.Add( new NiceArrayConverter() );
        }

        protected override void OnServiceText( string text )
        {
            var ext = Path.GetExtension( Request.Url.AbsolutePath );

            Response.ContentType = MimeTypeMap.GetMimeType( ext );

            using ( var writer = new StreamWriter( Response.OutputStream ) )
            {
                writer.Write( text );
            }
        }

        [ResponseWriter]
        public void OnWriteObject( object obj )
        {
            OnServiceJson( obj == null ? null : JObject.FromObject( obj, _sSerializer ) );
        }

        protected virtual bool ForceNoFormatting => false;

        protected bool Skip => Request.QueryString["skip"] == "1";

        protected override void OnServiceJson( JToken token )
        {
            Response.ContentType = MimeTypeMap.GetMimeType( ".json" );

            if ( token != null )
            {
                using ( var writer = new StreamWriter( Response.OutputStream ) )
                {
#if DEBUG
                    writer.Write( token.ToString( ForceNoFormatting ? Formatting.None : Formatting.Indented ) );
#else
                    writer.Write( token.ToString( Formatting.None ) );
#endif
                }
            }
        }
    }
}
