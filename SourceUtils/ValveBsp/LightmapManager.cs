using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.ValveBsp
{
    public class LightmapManager
    {
        private const int Padding = 1;

        private readonly ValveBspFile _bspFile;

        private IntVector2 _textureSize;
        private Vector2 _uvScale;
        private IntRect[] _faceRects;

        public bool IsGenerated => _faceRects != null;

        public IntVector2 TextureSize
        {
            get
            {
                if (!IsGenerated) Generate();
                return _textureSize;
            }
        }

        internal LightmapManager( ValveBspFile bsp )
        {
            _bspFile = bsp;
        }

        private void Generate()
        {
            _faceRects = new IntRect[_bspFile.FacesHdr.Length];

            var area = _bspFile.FacesHdr.Sum( x => x.LightMapSize.X * x.LightMapSize.Y );
            var max = _bspFile.FacesHdr.Max( x => Math.Max( x.LightMapSize.X, x.LightMapSize.Y ) );

            var size = 1;
            while ( size < max || size * size < area ) size <<= 1;

            var packer = new MaxRectsBinPack( size, size ) { Padding = Padding };
            while ( !packer.Insert( _bspFile.FacesHdr, x => x.LightMapSize,
                ( index, face, rect ) => _faceRects[index] = rect ) )
            {
                size <<= 1;
                packer.Init( size, size );
            }

            _textureSize = new IntVector2( size, size );
            _uvScale = new Vector2( 1f / size, 1f / size );
        }

        public void GetUvs( int faceIndex, out Vector2 min, out Vector2 max )
        {
            if ( !IsGenerated ) Generate();

            var rect = _faceRects[faceIndex];

            min = rect.Min * _uvScale;
            max = rect.Max * _uvScale;
        }
    }
}
