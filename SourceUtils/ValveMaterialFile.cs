using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Facepunch.Parse;

namespace SourceUtils
{
    public class VmtParserException : Exception
    {
        public VmtParserException(string expected, int line, string lineValue)
            : base( $"Error while parsing material: expected {expected} on line {line}.{Environment.NewLine}{lineValue}" ) { }
    }
    
    [PathPrefix("materials")]
    public class ValveMaterialFile
    {
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

            var includePath = ((string) props["include"]).Replace( '\\', '/' );
            var includeVmt = FromProvider( includePath, providers );

            if (includeVmt == null)
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine($"Missing material '{includePath}' included by '{path}'!");
                Console.ResetColor();

                return null;
            }

            var includeShader = includeVmt.Shaders.First();

            includeVmt[includeShader].MergeFrom( props["insert"], false );
            includeVmt[includeShader].MergeFrom( props["replace"], true );

            return includeVmt;
        }

        private readonly KeyValues _keyValues;

        private ValveMaterialFile( Stream stream )
        {
            _keyValues = KeyValues.FromStream( stream );
        }

        public IEnumerable<string> Shaders => _keyValues.Keys;

        public bool ContainsShader(string shader)
        {
            return _keyValues.ContainsKey(shader);
        }

        public KeyValues.Entry this[string shader] => _keyValues[shader];
    }
}