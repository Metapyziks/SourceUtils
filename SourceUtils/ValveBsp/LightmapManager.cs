using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.ValveBsp
{
    public class LightmapManager
    {
        private readonly ValveBspFile _bspFile;

        public IntVector2 TextureSize
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        internal LightmapManager( ValveBspFile bsp )
        {
            _bspFile = bsp;
        }

        public IntRect GetLightmapRegion( int faceIndex )
        {
            throw new NotImplementedException();
        }

        public void GetUvs( int faceIndex, out Vector2 min, out Vector2 max )
        {
            throw new NotImplementedException();
        }
    }
}
