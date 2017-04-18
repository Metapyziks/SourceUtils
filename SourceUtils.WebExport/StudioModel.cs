using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.WebExport
{
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
