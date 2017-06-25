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
            for ( var i = 0; i < bsp.StaticProps.ModelCount; ++i )
            {
                var path = bsp.StaticProps.GetModelName( i );
                yield return path;

                var index = GetResourceIndex( path );
                if ( index == _vertexCounts.Count )
                {
                    _vertexCounts.Add( FindVertexCount( bsp, GetResourcePath( index ) ) );
                }
            }
        }

        public int GetVertexCount( int index )
        {
            return _vertexCounts[index];
        }

        private int FindVertexCount( ValveBspFile bsp, string path )
        {
            var mdl = StudioModelFile.FromProvider( path, bsp.PakFile, Program.Resources );
            return mdl?.TotalVertices ?? 0;
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
