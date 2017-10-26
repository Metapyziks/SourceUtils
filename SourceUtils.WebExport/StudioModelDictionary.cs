using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.WebExport
{
    internal class StudioModelDictionary : ResourceDictionary<StudioModelDictionary>
    {
        public static int GetVertexCount( ValveBspFile bsp, int index )
        {
            return GetDictionary( bsp ).GetVertexCount( index );
        }

        private readonly List<int> _vertexCounts = new List<int>();

        protected override IEnumerable<string> OnFindResourcePaths( ValveBspFile bsp )
        {
            var items = Enumerable.Range( 0, bsp.StaticProps.ModelCount )
                .Select( x => bsp.StaticProps.GetModelName( x ) )
                .Select( x =>
                {
                    var mdl = StudioModelFile.FromProvider( x, bsp.PakFile, Program.Resources );
                    if ( mdl == null ) return null;
                    return new
                    {
                        Path = x,
                        VertexCount = mdl.TotalVertices,
                        FirstMaterialIndex = MaterialDictionary.GetResourceIndex( bsp, mdl.GetMaterialName( 0, bsp.PakFile, Program.Resources ) )
                    };
                } )
                .Where( x => x != null )
                .GroupBy( x => x.FirstMaterialIndex )
                .OrderByDescending( x => x.Count() )
                .SelectMany( x => x )
                .ToArray();

            foreach ( var item in items )
            {
                yield return item.Path;

                var index = GetResourceIndex( item.Path );
                if ( index == _vertexCounts.Count )
                {
                    _vertexCounts.Add( item.VertexCount );
                }
            }
        }

        public int GetVertexCount( int index )
        {
            return _vertexCounts[index];
        }

        protected override string NormalizePath( string path )
        {
            path = base.NormalizePath( path );

            if ( !path.StartsWith( "models/" ) ) path = $"models/{path}";
            if ( !path.EndsWith( ".mdl" ) ) path = $"{path}.mdl";

            return path;
        }
    }
}
