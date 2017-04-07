using System;
using System.Collections.Generic;
using System.IO;
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
            var encoded = HttpUtility.UrlEncode( url.Value ).Replace( "%2f", "/" );
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

            writer.WriteStartArray();

            if ( floatArr != null )
            {
                writer.WriteRaw( string.Join( ",", floatArr ) );
            }
            else if ( intArr != null )
            {
                writer.WriteRaw( string.Join( ",", intArr ) );
            }
            else
            {
                throw new NotImplementedException();
            }

            writer.WriteEndArray();
        }

        public override object ReadJson( JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer )
        {
            throw new NotImplementedException();
        }

        public override bool CanConvert( Type objectType )
        {
            return typeof(IEnumerable<float>).IsAssignableFrom( objectType ) ||
                   typeof(IEnumerable<int>).IsAssignableFrom( objectType );
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
