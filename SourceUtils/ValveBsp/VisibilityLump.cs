using System;
using System.Collections;
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
        public class VisibilityLump : ILump, IEnumerable<HashSet<int>>
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
                using ( var stream = _bspFile.GetLumpStream( LumpType ) )
                {
                    stream.Seek( byteOffset, SeekOrigin.Begin );

                    var set = new HashSet<int>();

                    var clusters = NumClusters;
                    var offset = 0;
                    while ( offset < clusters )
                    {
                        var bits = stream.ReadByte();
                        if ( bits == 0 )
                        {
                            offset += stream.ReadByte() * 8;
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
            }

            private void EnsureLoaded()
            {
                lock ( this )
                {
                    if ( Loaded ) return;

                    using ( var reader = new BinaryReader( _bspFile.GetLumpStream( LumpType ) ) )
                    {
                        if ( reader.BaseStream.Length == 0 )
                        {
                            _numClusters = 0;
                            return;
                        }

                        _numClusters = reader.ReadInt32();
                        _vpsList = new HashSet<int>[_numClusters];
                        _offsets = LumpReader<ByteOffset>.ReadLumpFromStream( reader.BaseStream, _numClusters );
                    }
                }
            }

            private struct Enumerator : IEnumerator<HashSet<int>>
            {
                private readonly VisibilityLump _lump;
                private int _currentIndex;

                public Enumerator( VisibilityLump lump )
                {
                    _lump = lump;
                    _currentIndex = -1;
                }

                public void Dispose() { }

                public bool MoveNext()
                {
                    return ++_currentIndex < _lump.NumClusters;
                }

                public void Reset()
                {
                    _currentIndex = -1;
                }

                public HashSet<int> Current => _lump[_currentIndex];
                object IEnumerator.Current => _lump[_currentIndex];
            }

            IEnumerator IEnumerable.GetEnumerator()
            {
                return GetEnumerator();
            }

            public IEnumerator<HashSet<int>> GetEnumerator()
            {
                EnsureLoaded();
                return new Enumerator(this);
            }
        }
    }
}
