using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.WebExport
{
    internal class StudioModelDictionary : ResourceDictionary<StudioModel, StudioModelDictionary>
    {
        protected override IEnumerable<string> OnFindResourcePaths( ValveBspFile bsp )
        {
            for ( var i = 0; i < bsp.StaticProps.ModelCount; ++i )
            {
                yield return bsp.StaticProps.GetModelName( i );
            }
        }

        protected override string NormalizePath( string path )
        {
            path = base.NormalizePath( path );

            if ( !path.StartsWith( "models/" ) ) path = $"models/{path}";
            if ( !path.EndsWith( ".mdl" ) ) path = $"{path}.mdl";

            return path;
        }
    }

    public class StudioModel
    {
        public static StudioModel Get( ValveBspFile bsp, string path )
        {
            var mdl = bsp == null
                ? StudioModelFile.FromProvider( path, Program.Resources )
                : StudioModelFile.FromProvider( path, bsp.PakFile, Program.Resources );

            if ( mdl == null ) return null;

            var smd = new StudioModel();



            return smd;
        }
    }
}
