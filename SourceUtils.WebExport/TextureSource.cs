using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace SourceUtils.WebExport
{
    public static partial class TextureSource
    {
        private const string UrlPrefix = "/materials/";
        private const string VtfSegment = ".vtf/";
        private const string InfoSuffix = ".vtf.json";
        private const string MissingSuffix = ".json";
        private const int HashLength = 16;
        private static readonly Regex _sImageFileNameRegex = new Regex( @"^((?<param>mip|face|frame)(?<value>[0-9]+)\.)*(?<format>png)$", RegexOptions.IgnoreCase | RegexOptions.Compiled );

        public static string NormalizePath( string path )
        {
            if ( path == null ) return null;

            path = NormalizeSlashes( path.ToLowerInvariant() ).TrimStart( '/' );
            if ( !path.StartsWith( "materials/" ) ) path = $"materials/{path}";
            if ( !path.EndsWith( ".vtf" ) ) path = $"{path}.vtf";

            return IsSafePath( path ) ? path : null;
        }

        public static string ComputeHash( Stream vtf )
        {
            using ( var sha1 = SHA1.Create() )
            {
                var bytes = sha1.ComputeHash( vtf );
                var builder = new StringBuilder( HashLength );
                for ( var i = 0; i < HashLength / 2; ++i ) builder.Append( bytes[i].ToString( "x2" ) );
                return builder.ToString();
            }
        }

        public static string BuildUrl( string path, string hash, string file )
        {
            if ( hash == null ) return $"/{path}{MissingSuffix}";
            if ( file == null ) return $"/{path}/{hash}{InfoSuffix}";
            return $"/{path}/{hash}/{file}";
        }

        public static bool TryParseUrl( string absolutePath, out string path, out string hash, out string file )
        {
            path = null; hash = null; file = null;
            if ( absolutePath == null ) return false;
            var url = NormalizeSlashes( Uri.UnescapeDataString( absolutePath ) );
            if ( !url.StartsWith( UrlPrefix, StringComparison.Ordinal ) ) return false;
            var vtfIndex = url.LastIndexOf( VtfSegment, StringComparison.Ordinal );
            if ( vtfIndex < 0 )
            {
                if ( !url.EndsWith( InfoSuffix, StringComparison.Ordinal ) ) return false;
                path = url.Substring( 1, url.Length - 1 - MissingSuffix.Length );
                return IsSafePath( path );
            }
            var rest = url.Substring( vtfIndex + VtfSegment.Length );
            string parsedHash;
            string parsedFile = null;
            if ( rest.EndsWith( InfoSuffix, StringComparison.Ordinal ) && rest.IndexOf( '/' ) < 0 )
                parsedHash = rest.Substring( 0, rest.Length - InfoSuffix.Length );
            else
            {
                var slash = rest.IndexOf( '/' );
                if ( slash < 0 ) return false;
                parsedHash = rest.Substring( 0, slash );
                parsedFile = rest.Substring( slash + 1 );
                if ( parsedFile.Length == 0 || parsedFile.IndexOf( '/' ) >= 0 ) return false;
            }
            if ( !IsValidHash( parsedHash ) ) return false;
            path = url.Substring( 1, vtfIndex + ".vtf".Length - 1 );
            if ( !IsSafePath( path ) ) return false;
            hash = parsedHash; file = parsedFile;
            return true;
        }

        /// <summary>
        /// True if the url points into the global materials folder, whatever form it takes. Note
        /// that a map's own material page lives under /maps and is not one of these.
        /// </summary>
        public static bool IsMaterialUrl( string url )
        {
            return url != null && url.StartsWith( UrlPrefix, StringComparison.Ordinal );
        }

        /// <summary>
        /// True if the url names a specific version of a texture by the hash of its contents, and
        /// so can never go stale while the file it points at exists.
        /// </summary>
        public static bool IsContentAddressed( string url )
        {
            return TryParseUrl( url, out _, out var hash, out _ ) && hash != null;
        }

        public static bool TryParseImageFileName( string fileName, int mipCount, int frameCount, int faceCount,
            out int mip, out int frame, out int face )
        {
            mip = 0;
            frame = 0;
            face = 0;

            var match = _sImageFileNameRegex.Match( fileName ?? "" );
            if ( !match.Success ) return false;

            var index = 0;
            foreach ( Capture capture in match.Groups["param"].Captures )
            {
                if ( !int.TryParse( match.Groups["value"].Captures[index++].Value, NumberStyles.None,
                    CultureInfo.InvariantCulture, out var value ) ) return false;

                switch ( capture.Value.ToLowerInvariant() )
                {
                    case "mip":
                        mip = value;
                        break;
                    case "face":
                        face = value;
                        break;
                    case "frame":
                        frame = value;
                        break;
                }
            }

            return mip >= 0 && mip < mipCount
                && frame >= 0 && frame < frameCount
                && face >= 0 && face < faceCount;
        }

        private static bool IsValidHash( string hash )
        {
            if ( hash.Length != HashLength ) return false;
            foreach ( var c in hash )
                if ( (c < '0' || c > '9') && (c < 'a' || c > 'f') ) return false;
            return true;
        }

        private static string NormalizeSlashes( string path )
        {
            path = path.Replace( '\\', '/' );
            while ( path.Contains( "//" ) ) path = path.Replace( "//", "/" );
            return path;
        }

        private static bool IsSafePath( string path )
        {
            if ( path == null || !path.StartsWith( "materials/", StringComparison.Ordinal ) ) return false;

            foreach ( var segment in path.Split( '/' ) )
            {
                if ( segment == "." || segment == ".." ) return false;
            }

            return true;
        }
    }

    public sealed class TextureSourceInfo
    {
        public TextureSourceInfo( IResourceProvider provider, string mapName, string path, string hash )
        {
            Provider = provider;
            MapName = mapName;
            Path = path;
            Hash = hash;
        }

        public IResourceProvider Provider { get; }

        /// <summary>
        /// Name of the map whose pakfile contains this texture, or null for game resources.
        /// </summary>
        public string MapName { get; }

        public string Path { get; }

        public string Hash { get; }
    }

    public static partial class TextureSource
    {
        private static readonly Dictionary<string, string> _sHashCache = new Dictionary<string, string>();
        private static readonly Dictionary<string, string> _sRegistry = new Dictionary<string, string>();

        private static string GetCacheKey( string mapName, string path )
        {
            return $"{mapName ?? ""}|{path}";
        }

        private static string GetRegistryKey( string path, string hash )
        {
            return $"{path}|{hash}";
        }

        internal static TextureSourceInfo Resolve( ValveBspFile bsp, string path )
        {
            path = NormalizePath( path );
            if ( path == null ) return null;

            IResourceProvider provider;
            string mapName;

            if ( bsp != null && bsp.PakFile.ContainsFile( path ) )
            {
                provider = bsp.PakFile;
                mapName = bsp.Name;
            }
            else if ( Program.Resources.ContainsFile( path ) )
            {
                provider = Program.Resources;
                mapName = null;
            }
            else
            {
                return null;
            }

            var cacheKey = GetCacheKey( mapName, path );
            string hash;

            lock ( _sHashCache )
            {
                _sHashCache.TryGetValue( cacheKey, out hash );
            }

            if ( hash == null )
            {
                using ( var stream = provider.OpenFile( path ) )
                {
                    hash = ComputeHash( stream );
                }

                lock ( _sHashCache )
                {
                    _sHashCache[cacheKey] = hash;
                }
            }

            lock ( _sRegistry )
            {
                // Last registration wins, so host mode prefers the most recently viewed map.
                _sRegistry[GetRegistryKey( path, hash )] = mapName;
            }

            return new TextureSourceInfo( provider, mapName, path, hash );
        }

        internal static TextureSourceInfo Lookup( string path, string hash )
        {
            path = NormalizePath( path );
            if ( path == null ) return null;

            bool registered;
            string mapName;

            lock ( _sRegistry )
            {
                registered = _sRegistry.TryGetValue( GetRegistryKey( path, hash ), out mapName );
            }

            var bsp = registered && mapName != null ? Program.GetMap( mapName ) : null;
            var info = Resolve( bsp, path );

            return info != null && info.Hash == hash ? info : null;
        }

        internal static void ForgetMap( string mapName )
        {
            var prefix = GetCacheKey( mapName, "" );

            lock ( _sHashCache )
            {
                foreach ( var key in _sHashCache.Keys.Where( x => x.StartsWith( prefix ) ).ToArray() )
                {
                    _sHashCache.Remove( key );
                }
            }
        }
    }
}
