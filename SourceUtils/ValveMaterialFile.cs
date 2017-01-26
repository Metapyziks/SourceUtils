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
        private static readonly Regex _sPropertyRegex = new Regex(@"^([^""{}]*""(?<name>[^""]+)""|\s*(?<name>[$%a-zA-Z0-9_]+))\s*(""(?<value>[^""]+)""[^""{}]*|(?<value>\S+)\s*)$", RegexOptions.Compiled);
        private static readonly Regex _sNestedRegex = new Regex(@"^\s*(""(?<name>[^""]+)""|(?<name>[$%a-zA-Z0-9_]+))\s*$", RegexOptions.Compiled);

        private readonly Dictionary<string, string> _properties = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase);

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

        public bool GetBoolean(string name, bool @default = false)
        {
            var value = GetInt32(name, @default ? 1 : 0);
            return value != 0;
        }

        internal MaterialPropertyGroup(ValveMaterialFile.Reader reader)
        {
            reader.AssertToken("{");

            while (!reader.ReadToken("}"))
            {
                Match match;
                if (reader.ReadRegex(_sNestedRegex, out match))
                {
                    // TODO
                    var nested = new MaterialPropertyGroup(reader);
                    continue;
                }

                reader.AssertRegex(_sPropertyRegex, out match, "shader property");

                var name = match.Groups["name"];
                var value = match.Groups["value"];

                _properties.Add(name.Value, value.Value);
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
            private readonly string[] _lines;
            private int _offset;
    
            public Reader(Stream stream)
            {
                var reader = new StreamReader(stream);
                var value = reader.ReadToEnd();
    
                _lines = value.Split(new[] {"\r\n", "\n"}, StringSplitOptions.None).Select(TrimLine).ToArray();
            }
    
            public void AssertToken(string token)
            {
                if (!ReadToken(token)) ExpectedError(string.Format("'{0}'", token));
            }
    
            public void AssertRegex(Regex regex, out Match match, string token)
            {
                if (!ReadRegex(regex, out match)) ExpectedError(token);
            }
    
            private string TrimLine(string line)
            {
                line = line.Trim();
    
                var comment = line.IndexOf("//");
                if (comment != -1) line = line.Substring(0, comment);
    
                return line;
            }
    
            public bool ReadToken(string token)
            {
                var curOffset = _offset;
    
                while (curOffset < _lines.Length)
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
                while (curOffset < _lines.Length)
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
                throw new VmtParserException(expected, _offset, _lines[_offset]);
            }
        }

        public static ValveMaterialFile FromStream(Stream stream)
        {
            var reader = new Reader(stream);
            var file = new ValveMaterialFile(reader);

            return file;
        }

        private readonly Dictionary<string, MaterialPropertyGroup> _propertyGroups = new Dictionary<string, MaterialPropertyGroup>(StringComparer.InvariantCultureIgnoreCase);

        private ValveMaterialFile(Reader reader)
        {
            var shaderNameRegex = new Regex(@"^[^""{}]*""(?<shader>[a-zA-Z0-9/\\]+)""[^""{}]*|\s*(?<shader>[a-zA-Z0-9/\\]+)\s*$", RegexOptions.Compiled);

            Match match;
            while (reader.ReadRegex(shaderNameRegex, out match))
            {
                var shader = match.Groups["shader"].Value;
                var group = new MaterialPropertyGroup(reader);

                _propertyGroups.Add(shader, group);
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