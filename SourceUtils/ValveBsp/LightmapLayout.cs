using System;
using System.IO;
using System.Linq;
using System.Text;

namespace SourceUtils.ValveBsp
{
    public class LightmapLayout
    {
        private const uint MagicIdent = 0x50414d4c;
        private const uint Version = 0x0001;

        private readonly ValveBspFile _bspFile;

        private IntVector2 _boundingSize;
        private Vector2 _uvScale;
        private IntRect[] _packing;

        private bool FoundPacking => _packing != null;

        public IntVector2 TextureSize
        {
            get
            {
                FindPacking();
                return _boundingSize;
            }
        }

        public string CacheFilePath { get; set; }

        internal LightmapLayout( ValveBspFile bsp )
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
                Width = face.LightMapSizeX + 3;
                Height = face.LightMapSizeY + 3;
                HasSamples = face.LightOffset != -1;
            }
        }

        private void SetBoundingSize( int width, int height )
        {
            _boundingSize = new IntVector2( width, height );
            _uvScale = new Vector2( 1f / width, 1f / height );
        }

        private bool TryPacking( int width, int height, Packable[] packables )
        {
            var packer = new RectanglePacker( width, height, 2048, 2048 );

            foreach ( var face in packables )
            {
                int x, y;
                if ( !packer.Pack( face.Width, face.Height, out x, out y ) ) return false;
                _packing[face.Index] = new IntRect( x + 1, y + 1, face.Width - 2, face.Height - 2 );
            }

            SetBoundingSize( packer.Width, packer.Height );
            return true;
        }

        private static int GetWidth( int sizeIndex )
        {
            return 1 << ((sizeIndex + 1) >> 1);
        }

        private static int GetHeight( int sizeIndex )
        {
            return 1 << (sizeIndex >> 1);
        }

        private bool TryLoadFromCached()
        {
            if ( string.IsNullOrEmpty( CacheFilePath ) ) return false;
            if ( !File.Exists( CacheFilePath ) ) return false;

            using ( var stream = File.Open( CacheFilePath, FileMode.Open, FileAccess.Read, FileShare.Read ) )
            {
                Read( stream );
                return true;
            }
        }

        private static readonly object _sSyncContext = new object();

        private void FindPacking()
        {
            lock ( this )
            {
                if ( FoundPacking ) return;
                if ( TryLoadFromCached() ) return;

                var faces = _bspFile.FacesHdr.Length > 0 ? _bspFile.FacesHdr : _bspFile.Faces;

                _packing = new IntRect[faces.Length];

                var toPack = faces
                    .Select( ( x, i ) => new Packable( i, x ) )
                    .Where( x => x.HasSamples )
                    .OrderByDescending( x => x.Width * 65536 + x.Height )
                    .ToArray();

                var area = toPack.Sum( x => x.Width * x.Height );
                var sizeIndex = 1;

                while ( GetWidth( sizeIndex ) * GetHeight( sizeIndex ) < area ) ++sizeIndex;

                var tries = 2;
                while ( tries-- > 0 && !TryPacking( GetWidth( sizeIndex ), GetHeight( sizeIndex ), toPack ) )
                {
                    ++sizeIndex;

                    if ( tries == 0 )
                    {
                        throw new Exception( "Unable to pack lightmap!" );
                    }
                }

                if ( string.IsNullOrEmpty( CacheFilePath ) ) return;

                lock ( _sSyncContext )
                {
                    var fullName = new FileInfo( CacheFilePath ).FullName;
                    var dirName = Path.GetDirectoryName( fullName );
                    if ( !Directory.Exists( dirName ) ) Directory.CreateDirectory( dirName );
                    Write( fullName );
                }
            }
        }

        public IntRect GetLightmapRegion( int faceIndex )
        {
            FindPacking();
            return _packing[faceIndex];
        }

        public void GetUvs( int faceIndex, out Vector2 min, out Vector2 size )
        {
            var rect = GetLightmapRegion( faceIndex );
            min.X = (rect.X + 0.5f) * _uvScale.X;
            min.Y = (rect.Y + 0.5f) * _uvScale.Y;
            size.X = (rect.Width - 1f) * _uvScale.X;
            size.Y = (rect.Height - 1f) * _uvScale.Y;
        }

        public void Write( Stream stream )
        {
            FindPacking();

            using ( var writer = new BinaryWriter( stream, Encoding.UTF8, true ) )
            {
                writer.Write( MagicIdent );
                writer.Write( Version );

                writer.Write( (ushort) _boundingSize.X );
                writer.Write( (ushort) _boundingSize.Y );
                
                writer.Write( _packing.Length );

                foreach ( var rect in _packing )
                {
                    writer.Write( (ushort) rect.X );
                    writer.Write( (ushort) rect.Y );
                    writer.Write( (ushort) rect.Width );
                    writer.Write( (ushort) rect.Height );
                }
            }
        }

        public void Write( string filePath )
        {
            using (var stream = File.Create( filePath ) )
            {
                Write( stream );
            }
        }

        private void Read( Stream stream )
        {
            using ( var reader = new BinaryReader( stream, Encoding.UTF8, true ) )
            {
                if ( reader.ReadUInt32() != MagicIdent ) throw new Exception( "Unknown file type." );

                var version = reader.ReadUInt32();
                if ( version > Version ) throw new Exception( $"Unknown file version (0x{version:x})." );

                SetBoundingSize( reader.ReadUInt16(), reader.ReadUInt16() );

                var count = reader.ReadInt32();
                _packing = new IntRect[count];

                for ( var i = 0; i < count; ++i )
                {
                    _packing[i] = new IntRect( reader.ReadUInt16(), reader.ReadUInt16(), reader.ReadUInt16(), reader.ReadUInt16() );
                }
            }
        }
    }
}
