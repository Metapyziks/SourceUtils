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

        private IntVector2 _boundingSize;
        private IntRect[] _packing;

        private bool FoundPacking => _packing != null;

        public IntVector2 TextureSize
        {
            get
            {
                if (!FoundPacking) FindPacking();
                return _boundingSize;
            }
        }

        internal LightmapManager( ValveBspFile bsp )
        {
            _bspFile = bsp;
        }

        private struct Packable
        {
            public readonly int Index;
            public readonly int Width;
            public readonly int Height;
            public readonly bool HasSamples;

            public Packable( int index, Face face )
            {
                Index = index;
                Width = face.LightMapSizeX + 1;
                Height = face.LightMapSizeY + 1;
                HasSamples = face.LightOffset != -1;
            }
        }

        private bool TryPacking( int size, Packable[] packables )
        {
            var packer = new RectanglePacker( size, size );

            foreach ( var face in packables )
            {
                int x, y;
                if ( !packer.Pack( face.Width, face.Height, out x, out y ) ) return false;
                _packing[face.Index] = new IntRect( x, y, face.Width, face.Height );
            }
            
            _boundingSize = new IntVector2( packer.Width, packer.Height );
            return true;
        }

        private void FindPacking()
        {
            _packing = new IntRect[_bspFile.FacesHdr.Length];

            var toPack = _bspFile.FacesHdr
                .Select( ( x, i ) => new Packable( i, x ) )
                .Where( x => x.HasSamples )
                .OrderByDescending( x => x.Width * 65536 + x.Height )
                .ToArray();

            var area = toPack.Sum( x => x.Width * x.Height );
            var size = 1;

            while ( size * size < area ) size <<= 1;
            while ( !TryPacking( size, toPack ) ) size <<= 1;
        }

        public IntRect GetLightmapRegion( int faceIndex )
        {
            if (!FoundPacking) FindPacking();
            return _packing[faceIndex];
        }

        public void GetUvs( int faceIndex, out Vector2 min, out Vector2 max )
        {
            throw new NotImplementedException();
        }
    }
}
