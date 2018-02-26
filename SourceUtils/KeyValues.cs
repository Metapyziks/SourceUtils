using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Facepunch.Parse;
using SourceUtils.Properties;

namespace SourceUtils
{
    [Flags]
    public enum KeyValuesFlags
    {
        Default = 0,
        UsesEscapeSequences = 1
    }

    public class KeyValuesParserException : Exception
    {
        public ParseResult ParseResult { get; }

        public KeyValuesParserException( ParseResult parseResult )
            : base( parseResult.ErrorMessage )
        {
            ParseResult = parseResult;
        }
    }

    public class KeyValues : IEnumerable<KeyValuePair<string, KeyValues.Entry>>
    {
        public class EntryCollection : IEnumerable<Entry>
        {
            public static EntryCollection Empty { get; } = new EntryCollection();

            public static implicit operator Entry( EntryCollection collection )
            {
                return collection.FirstOrDefault();
            }
            
            public static implicit operator string( EntryCollection collection )
            {
                return collection.FirstOrDefault();
            }

            public static implicit operator bool( EntryCollection collection )
            {
                return collection.FirstOrDefault();
            }

            public static implicit operator int( EntryCollection collection )
            {
                return collection.FirstOrDefault();
            }

            public static implicit operator float( EntryCollection collection )
            {
                return collection.FirstOrDefault();
            }
            
            public static implicit operator Color32( EntryCollection collection )
            {
                return collection.FirstOrDefault();
            }

            private readonly List<Entry> _entries = new List<Entry>();
        
            internal void AddValue( ParseResult result, KeyValuesFlags flags )
            {
                var entry = new Entry();
                entry.AddValue( result, flags );
                _entries.Add( entry );
            }

            public IEnumerator<Entry> GetEnumerator()
            {
                return _entries.GetEnumerator();
            }

            IEnumerator IEnumerable.GetEnumerator()
            {
                return GetEnumerator();
            }
        }

        public class Entry : IEnumerable<KeyValuePair<string, Entry>>
        {
            public static bool operator==( Entry a, object b )
            {
                return ReferenceEquals( a, b ) || b == null && a.IsNull;
            }

            public static bool operator !=( Entry a, object b )
            {
                return !(a == b);
            }

            public static implicit operator string( Entry entry )
            {
                return entry == null || !entry.HasValue ? null : entry._value;
            }

            public static implicit operator bool( Entry entry )
            {
                return (int) entry != 0;
            }

            public static implicit operator int( Entry entry )
            {
                return int.TryParse( entry, NumberStyles.Integer, CultureInfo.InvariantCulture, out var result ) ? result : 0;
            }

            public static implicit operator float( Entry entry )
            {
                return float.TryParse( entry, NumberStyles.Float, CultureInfo.InvariantCulture, out var result ) ? result : 0f;
            }

            private static readonly Regex _sColor32Regex = new Regex( @"^\s*\{\s*(?<red>[0-9]+)\s+(?<green>[0-9]+)\s+(?<blue>[0-9]+)\s*\}\s*$" );
            private static readonly Regex _sColorFloatRegex = new Regex( @"^\s*\[\s*(?<red>[0-9]+|([0-9]+)?\.[0-9]+)\s+(?<green>[0-9]+|([0-9]+)?\.[0-9]+)\s+(?<blue>[0-9]+|([0-9]+)?\.[0-9]+)\s*\]\s*$" );

            public static implicit operator Color32( Entry entry )
            {
                var value = (string) entry;
                var match = _sColor32Regex.Match( value );

                if ( match.Success )
                {
                    return new Color32
                    {
                        R = (byte) int.Parse( match.Groups["red"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture ),
                        G = (byte) int.Parse( match.Groups["green"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture ),
                        B = (byte) int.Parse( match.Groups["blue"].Value, NumberStyles.Integer, CultureInfo.InvariantCulture ),
                        A = 255
                    };
                }

                match = _sColorFloatRegex.Match( value );

                if ( match.Success )
                {
                    return new Color32
                    {
                        R = (byte) Math.Round(float.Parse( match.Groups["red"].Value, NumberStyles.Float, CultureInfo.InvariantCulture ) * 255f),
                        G = (byte) Math.Round(float.Parse( match.Groups["green"].Value, NumberStyles.Float, CultureInfo.InvariantCulture ) * 255f),
                        B = (byte) Math.Round(float.Parse( match.Groups["blue"].Value, NumberStyles.Float, CultureInfo.InvariantCulture ) * 255f),
                        A = 255
                    };
                }

                return new Color32( 0xff, 0x00, 0xff );
            }

            private Dictionary<string, EntryCollection> _subEntries;
            private string _value;

            public EntryCollection this[string key] => _subEntries != null && _subEntries.TryGetValue( key, out var entry ) ? entry : EntryCollection.Empty;

            public bool IsNull => !HasValue && !HasKeys;
            
            public bool HasValue => _value != null;
            public bool HasKeys => _subEntries != null && _subEntries.Count > 0;

            public string Value => HasValue ? _value : null;

            public IEnumerable<string> Keys => _subEntries == null ? Enumerable.Empty<string>() : _subEntries.Keys;

            internal Entry() { }

            internal void AddValue( ParseResult result, KeyValuesFlags flags )
            {
                if ( result.Parser.ElementName.EndsWith( ".String" ) )
                {
                    _value = ReadString( result, flags );
                    return;
                }

                AssertParser( result, ".Definition.List" );

                if ( result.Length == 0 ) return;

                if ( _subEntries == null ) _subEntries = new Dictionary<string, EntryCollection>( StringComparer.InvariantCultureIgnoreCase );
                
                foreach ( var def in result )
                {
                    var key = ReadString( def[0], flags );

                    if ( !_subEntries.TryGetValue( key, out var existing ) )
                    {
                        _subEntries.Add( key, existing = new EntryCollection() );
                    }

                    existing.AddValue( def[1], flags );
                }
            }

            public bool ContainsKey( string key )
            {
                return HasKeys && _subEntries.ContainsKey( key );
            }

            public void MergeFrom( Entry other, bool replace )
            {
                if ( other == null || !other.HasKeys ) return;

                foreach ( var key in other.Keys )
                {
                    if ( _subEntries.ContainsKey( key ) )
                    {
                        if ( replace ) _subEntries[key] = other[key];
                    }
                    else
                    {
                        _subEntries.Add( key, other[key] );
                    }
                }
            }

            public IEnumerator<KeyValuePair<string, Entry>> GetEnumerator()
            {
                if ( _subEntries == null ) yield break;

                foreach ( var keyValue in _subEntries )
                {
                    foreach ( var entry in keyValue.Value )
                    {
                        yield return new KeyValuePair<string, Entry>( keyValue.Key, entry );
                    }
                }
            }

            public override string ToString()
            {
                return IsNull ? "null" : HasValue ? Value : $"KeyValues[{_subEntries.Count}]";
            }

            IEnumerator IEnumerable.GetEnumerator()
            {
                return GetEnumerator();
            }
        }

        private static readonly Parser _sEscapedParser;
        private static readonly Parser _sUnescapedParser;

        static KeyValues()
        {
            var grammar = GrammarBuilder.FromString( Resources.KeyValues );

            _sEscapedParser = grammar["Escaped.Document"];
            _sUnescapedParser = grammar["Unescaped.Document"];
        }

        [Conditional( "DEBUG" )]
        private static void AssertParser( ParseResult result, string name )
        {
            Debug.Assert( result.Parser.ElementName.EndsWith( name ) );
        }

        [ThreadStatic]
        private static StringBuilder _sBuilder;

        private static string ReadString( ParseResult result, KeyValuesFlags flags )
        {
            AssertParser( result, ".String" );
            
            var rawValue = result[0].Value;

            if ( (flags & KeyValuesFlags.UsesEscapeSequences) != 0 )
            {
                var builder = _sBuilder ?? (_sBuilder = new StringBuilder());
                builder.Remove( 0, builder.Length );

                for ( var i = 0; i < rawValue.Length; ++i )
                {
                    var c = rawValue[i];
                    switch ( c )
                    {
                        case '\\':
                            switch ( c = rawValue[++i] )
                            {
                                case 'n':
                                    builder.Append( '\n' );
                                    break;
                                case 't':
                                    builder.Append( '\t' );
                                    break;
                                case '"':
                                case '\\':
                                    builder.Append( c );
                                    break;
                            }
                            break;
                        default:
                            builder.Append( c );
                            break;
                    }
                }

                return builder.ToString();
            }

            return rawValue;
        }

        public static bool TryParse( string value, out KeyValues result, KeyValuesFlags flags = KeyValuesFlags.Default )
        {
            try
            {
                result = Parse( value, flags );
                return true;
            }
            catch
            {
                result = null;
                return false;
            }
        }

        public static KeyValues Parse( string value, KeyValuesFlags flags = KeyValuesFlags.Default )
        {
            value = value.TrimEnd( '\0' );

            var parser = (flags & KeyValuesFlags.UsesEscapeSequences) != 0 ? _sEscapedParser : _sUnescapedParser;
            var result = parser.Parse( value );

            if ( !result.Success )
            {
                throw new KeyValuesParserException( result );
            }

            return new KeyValues( result.First(), flags );
        }

        public static IEnumerable<KeyValues> ParseList( string value, KeyValuesFlags flags = KeyValuesFlags.Default )
        {
            value = value.TrimEnd( '\0' );

            var parser = (flags & KeyValuesFlags.UsesEscapeSequences) != 0 ? _sEscapedParser : _sUnescapedParser;
            var result = parser.Parse( value );

            if ( !result.Success )
            {
                throw new KeyValuesParserException( result );
            }

            foreach ( var parsed in result )
            {
                yield return new KeyValues( parsed, flags );
            }
        }

        public static KeyValues FromStream( Stream stream, KeyValuesFlags flags = KeyValuesFlags.Default )
        {
            using ( var reader = new StreamReader( stream ) )
            {
                return Parse( reader.ReadToEnd(), flags );
            }
        }

        public static IEnumerable<KeyValues> ListFromStream( Stream stream, KeyValuesFlags flags = KeyValuesFlags.Default )
        {
            using ( var reader = new StreamReader( stream ) )
            {
                return ParseList( reader.ReadToEnd(), flags );
            }
        }

        private readonly Entry _root;

        public IEnumerable<string> Keys => _root.Keys;

        public IEnumerable<Entry> Values => _root.SelectMany( x => x.Value.Select( y => y.Value ) );

        private KeyValues( ParseResult result, KeyValuesFlags flags )
        {
            AssertParser( result, ".Definition.List" );

            _root = new Entry();
            _root.AddValue( result, flags );
        }

        public bool ContainsKey( string key )
        {
            return _root.ContainsKey( key );
        }

        public EntryCollection this[string key] => _root[key];

        public IEnumerator<KeyValuePair<string, Entry>> GetEnumerator()
        {
            return _root.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
