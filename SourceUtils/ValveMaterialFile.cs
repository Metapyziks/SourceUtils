using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace SourceUtils
{
    public class MaterialPropertyGroup
    {
        private static readonly Regex _sPropertyRegex = new Regex(@"^([^""{}“”]*(""|“)((?<context>[^\?]+)\?)?(?<name>[\$%]?[^""“”]+)(""|”)|\s*(?<name>[\$%]?[a-zA-Z0-9_]+))\s*((""|“)(?<value>[^""“”]+)(""|”)[^""{}“”]*|(?<value>\S+(\s+\S+)*)\s*)$", RegexOptions.Compiled);
        private static readonly Regex _sNestedRegex = new Regex(@"^\s*((""|“)(?<name>[^""“”]+)(""|”)|(?<name>[$%a-zA-Z0-9_]+))\s*$", RegexOptions.Compiled);
        private static readonly Regex _sColorRegex = new Regex(@"^\s*\{\s*(?<red>[0-9]+)\s+(?<green>[0-9]+)\s+(?<blue>[0-9]+)\s*\}\s*$", RegexOptions.Compiled);

        private readonly Dictionary<string, string> _properties
            = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase);

        private readonly Dictionary<string, MaterialPropertyGroup> _nested =
            new Dictionary<string, MaterialPropertyGroup>( StringComparer.InvariantCultureIgnoreCase );

        public IEnumerable<string> PropertyNames => _properties.Keys;

        public string this[ string name ] => GetString( name );

        public string GetString(string name, string @default = null)
        {
            string value;
            return !_properties.TryGetValue(name, out value) ? @default : value;
        }

        public int GetInt32(string name, int @default = 0)
        {
            var value = GetString(name, @default.ToString());

            int intValue;
            return int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out intValue) ? intValue : @default;
        }

        public float GetSingle(string name, float @default = 0f)
        {
            var value = GetString(name, @default.ToString());

            float floatValue;
            return float.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out floatValue) ? floatValue : @default;
        }

        public Color32 GetColor(string name, Color32 @default = default(Color32))
        {
            var value = GetString(name, @default.ToString());
            var match = _sColorRegex.Match( value );

            if ( !match.Success )
            {
                return @default;
            }

            var color = new Color32
            {
                R = (byte) int.Parse( match.Groups["red"].Value ),
                G = (byte) int.Parse( match.Groups["green"].Value ),
                B = (byte) int.Parse( match.Groups["blue"].Value ),
                A = 255
            };

            return color;
        }

        public bool GetBoolean(string name, bool @default = false)
        {
            var value = GetInt32(name, @default ? 1 : 0);
            return value != 0;
        }

        public MaterialPropertyGroup GetNested( string name )
        {
            MaterialPropertyGroup nested;
            return _nested.TryGetValue( name, out nested ) ? nested : null;
        }

        internal void MergeFrom( MaterialPropertyGroup other, bool replace )
        {
            if ( other == null ) return;

            foreach ( var name in other.PropertyNames )
            {
                if ( _properties.ContainsKey( name ) )
                {
                    if ( replace ) _properties[name] = other[name];
                }
                else _properties.Add( name, other[name] );
            }
        }

        internal MaterialPropertyGroup( ValveMaterialFile.Reader reader )
        {
            reader.AssertToken( "{" );

            while ( !reader.ReadToken( "}" ) )
            {
                Match match;
                if ( reader.ReadRegex( _sNestedRegex, out match ) )
                {
                    var name = match.Groups["name"].Value;
                    var value = new MaterialPropertyGroup( reader );

                    if ( _nested.ContainsKey( name ) ) _nested[name] = value;
                    else _nested.Add( name, value );
                }
                else
                {
                    reader.AssertRegex( _sPropertyRegex, out match, "shader property" );

                    var name = match.Groups["name"].Value;
                    var value = match.Groups["value"].Value;

                    if ( _properties.ContainsKey( name ) ) _properties[name] = value;
                    else _properties.Add( name, value );
                }
            }
        }
    }

    public class VmtParserException : Exception
    {
        public VmtParserException(string expected, int line, string lineValue)
            : base( $"Error while parsing material: expected {expected} on line {line}.{Environment.NewLine}{lineValue}" ) { }
    }
    
    [PathPrefix("materials")]
    public class ValveMaterialFile
    {
        internal class Reader
        {
            private readonly List<string> _lines;
            private int _offset;

            public string OriginalString { get; }
    
            public Reader(Stream stream)
            {
                var reader = new StreamReader(stream);
                OriginalString = reader.ReadToEnd();
    
                _lines = OriginalString.Split(new[] {"\r\n", "\n"}, StringSplitOptions.None)
                    .Select(TrimLine)
                    .ToList();

                for ( var i = 0; i < _lines.Count; ++i )
                {
                    var line = _lines[i];
                    var quoteCount = 0;
                    for ( var j = 0; j < line.Length; ++j )
                    {
                        if ( line[j] == '"' )
                        {
                            ++quoteCount;
                            if ( quoteCount == 5 )
                            {
                                _lines[i] = line.Substring( 0, j ).TrimEnd();
                                _lines.Insert( i + 1, line.Substring( j ).TrimStart() );
                                break;
                            }
                        }
                    }
                }
            }
    
            public void AssertToken(string token)
            {
                if (!ReadToken(token)) ExpectedError( $"'{token}'" );
            }
    
            public void AssertRegex(Regex regex, out Match match, string token)
            {
                if (!ReadRegex(regex, out match)) ExpectedError(token);
            }
    
            private string TrimLine(string line)
            {
                var comment = line.IndexOf("//");
                if (comment != -1) line = line.Substring(0, comment);
                
                line = line.Trim();
    
                return line;
            }
    
            public bool ReadToken(string token)
            {
                var curOffset = _offset;
    
                while (curOffset < _lines.Count)
                {
                    var line = _lines[curOffset++];
                    if (string.IsNullOrEmpty(line)) continue;
    
                    if (!line.Equals(token)) return false;
    
                    _offset = curOffset;
                    return true;
                }
    
                return false;
            }
    
            public bool ReadRegex(Regex regex, out Match match)
            {
                var curOffset = _offset;
    
                match = null;
                while (curOffset < _lines.Count)
                {
                    var line = _lines[curOffset++];
                    if (string.IsNullOrEmpty(line)) continue;
    
                    match = regex.Match(line);
                    if (!match.Success) return false;
    
                    _offset = curOffset;
                    return true;
                }
    
                return false;
            }
    
            public void ExpectedError(string expected)
            {
                throw new VmtParserException(expected, _offset + 1, _lines[_offset]);
            }
        }

        public static ValveMaterialFile FromStream(Stream stream)
        {
            return new ValveMaterialFile( stream );
        }

        public static ValveMaterialFile FromProvider( string path, params IResourceProvider[] providers )
        {
            var provider = providers.FirstOrDefault( x => x.ContainsFile( path ) );
            if ( provider == null ) return null;

            ValveMaterialFile vmt;
            using ( var stream = provider.OpenFile( path ) )
            {
                vmt = new ValveMaterialFile( stream );
            }
            
            if ( !vmt.Shaders.Any() ) return null;

            var shader = vmt.Shaders.First();
            var props = vmt[shader];

            if ( !shader.Equals( "patch", StringComparison.InvariantCultureIgnoreCase ) ) return vmt;

            var includePath = props.GetString( "include" ).Replace( '\\', '/' );
            vmt = FromProvider( includePath, providers );

            vmt[vmt.Shaders.First()].MergeFrom( props.GetNested( "insert" ), false );
            vmt[vmt.Shaders.First()].MergeFrom( props.GetNested( "replace" ), true );

            return vmt;
        }

        private readonly Dictionary<string, MaterialPropertyGroup> _propertyGroups = new Dictionary<string, MaterialPropertyGroup>(StringComparer.InvariantCultureIgnoreCase);
        private static readonly Regex _sShaderNameRegex = new Regex(@"^[^""{}]*(""|“)(?<shader>[a-zA-Z0-9/\\]+)(""|”)[^""{}]*|\s*(?<shader>[a-zA-Z0-9/\\]+)\s*$", RegexOptions.Compiled);

        private ValveMaterialFile( Stream stream )
        {
            var reader = new Reader( stream );

            Match match;
            while ( reader.ReadRegex( _sShaderNameRegex, out match ) )
            {
                var shader = match.Groups["shader"].Value;
                var group = new MaterialPropertyGroup( reader );

                _propertyGroups.Add( shader, group );
            }
        }

        public IEnumerable<string> Shaders => _propertyGroups.Keys;

        public bool ContainsShader(string shader)
        {
            return _propertyGroups.ContainsKey(shader);
        }

        public MaterialPropertyGroup this[string shader] => _propertyGroups[shader];
    }
}