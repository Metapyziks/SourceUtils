using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.ValveBsp
{
    public class Displacement
    {
        private readonly ValveBspFile _bspFile;
        private readonly DispInfo _dispInfo;
        private readonly Vector3[] _corners;
        private readonly int _firstCorner;

        public int Size => (1 << _dispInfo.Power) + 1;
        public Vector3 Normal { get; }

        public Displacement( ValveBspFile bsp, int index )
            : this( bsp, bsp.DisplacementInfos[index] ) { }

        public Displacement( ValveBspFile bsp, DispInfo dispInfo )
        {
            _bspFile = bsp;
            _dispInfo = dispInfo;
            _corners = new Vector3[8];

            var face = bsp.FacesHdr[_dispInfo.MapFace];
            var firstCornerDist2 = float.MaxValue;

            Normal = bsp.Planes[face.PlaneNum].Normal;

            for ( var i = 0; i < 4; ++i )
            {
                var vert = bsp.GetVertexFromSurfEdgeId( face.FirstEdge + i );
                _corners[i] = vert;

                var dist2 = (_dispInfo.StartPosition - vert).LengthSquared;
                if ( dist2 < firstCornerDist2 )
                {
                    _firstCorner = i;
                    firstCornerDist2 = dist2;
                }
            }
        }

        public Vector3 GetPosition( int x, int y )
        {
            var size = Size;
            var vert = _bspFile.DisplacementVerts[_dispInfo.DispVertStart + x + y * size];

            var tx = x / (size - 1f);
            var ty = y / (size - 1f);
            var sx = 1f - tx;
            var sy = 1f - ty;

            var cornerA = _corners[(0 + _firstCorner) & 3];
            var cornerB = _corners[(1 + _firstCorner) & 3];
            var cornerC = _corners[(2 + _firstCorner) & 3];
            var cornerD = _corners[(3 + _firstCorner) & 3];

            var origin = ty * (sx * cornerB + tx * cornerC) + sy * (sx * cornerA + tx * cornerD);

            return origin + vert.Vector * vert.Distance;
        }
    }
}
