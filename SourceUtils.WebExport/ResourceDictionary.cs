using System;
using System.Collections;
using System.Collections.Generic;

namespace SourceUtils.WebExport
{
    public abstract class ResourceDictionary<TDictionary>
        where TDictionary : ResourceDictionary<TDictionary>, new()
    {
        private static readonly Dictionary<ValveBspFile, TDictionary> _sDicts =
            new Dictionary<ValveBspFile, TDictionary>();

        protected static TDictionary GetDictionary( ValveBspFile bsp )
        {
            TDictionary dict;
            if ( _sDicts.TryGetValue( bsp, out dict ) ) return dict;

            dict = new TDictionary();
            dict.FindResourcePaths( bsp );

            bsp.Disposing += _ => _sDicts.Remove( bsp );

            _sDicts.Add( bsp, dict );

            return dict;
        }

        public static int GetResourceCount( ValveBspFile bsp )
        {
            return GetDictionary( bsp ).ResourceCount;
        }

        public static int GetResourceIndex( ValveBspFile bsp, string path )
        {
            return GetDictionary( bsp ).GetResourceIndex( path );
        }

        public static string GetResourcePath( ValveBspFile bsp, int index )
        {
            return GetDictionary( bsp ).GetResourcePath( index );
        }

        private readonly List<string> _resources = new List<string>();

        private readonly Dictionary<string, int> _indices =
            new Dictionary<string, int>( StringComparer.InvariantCultureIgnoreCase );

        public int ResourceCount => _resources.Count;

        private void FindResourcePaths( ValveBspFile bsp )
        {
            foreach ( var path in OnFindResourcePaths( bsp ) )
            {
                Add( path );
            }
        }

        protected abstract IEnumerable<string> OnFindResourcePaths( ValveBspFile bsp );

        protected virtual string NormalizePath( string path )
        {
            return path.ToLower().Replace( '\\', '/' ).Replace( "//", "/" );
        }

        private void Add( string path )
        {
            path = NormalizePath( path );

            if ( _indices.ContainsKey( path ) ) return;

            _indices.Add( path, _resources.Count );
            _resources.Add( path );
        }

        public string GetResourcePath( int index )
        {
            return _resources[index];
        }

        public int GetResourceIndex( string path )
        {
            path = NormalizePath( path );

            int index;
            if ( _indices.TryGetValue( path, out index ) ) return index;
            return -1;
        }
    }
}
