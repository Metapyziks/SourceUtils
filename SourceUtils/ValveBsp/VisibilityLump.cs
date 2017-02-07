using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public class VisibilityLump : ILump
        {
            [StructLayout(LayoutKind.Sequential, Pack = 1)]
            private struct ByteOffset
            {
                public int Pvs;
                public int Pas;
            }

            private int _numClusters = -1;

            private bool Loaded => _numClusters != -1;

            public LumpType LumpType { get; }

            public int NumClusters
            {
                get
                {
                    EnsureLoaded();
                    return _numClusters;
                }
            }

            private readonly ValveBspFile _bspFile;
            private BinaryReader _reader;
            private ByteOffset[] _offsets;
            private HashSet<int>[] _vpsList;

            public VisibilityLump( ValveBspFile bspFile, LumpType type )
            {
                _bspFile = bspFile;
                LumpType = type;
            }

            public HashSet<int> this[ int clusterIndex ]
            {
                get
                {
                    EnsureLoaded();
                    var set = _vpsList[clusterIndex];
                    return set ?? (_vpsList[clusterIndex] = ReadSet( _offsets[clusterIndex].Pvs ));
                }
            }

            private HashSet<int> ReadSet( int byteOffset )
            {
                _reader.BaseStream.Seek( byteOffset, SeekOrigin.Begin );

                var set = new HashSet<int>();

                var clusters = NumClusters;
                var offset = 0;
                while ( offset < clusters )
                {
                    var bits = _reader.ReadByte();
                    if ( bits == 0 )
                    {
                        offset += _reader.ReadByte() * 8;
                        continue;
                    }

                    for ( var i = 0; i < 8 && offset + i < clusters; ++i )
                    {
                        if ( (bits & (1 << i)) != 0 ) set.Add( offset + i );
                    }

                    offset += 8;
                }

                return set;
            }

            private void EnsureLoaded()
            {
                if ( Loaded ) return;

                _reader = new BinaryReader( _bspFile.GetLumpStream( LumpType ) );
                _numClusters = _reader.ReadInt32();
                _vpsList = new HashSet<int>[_numClusters];
                _offsets = LumpReader<ByteOffset>.ReadLumpFromStream( _reader.BaseStream, _numClusters );
            }
        }
    }
}
