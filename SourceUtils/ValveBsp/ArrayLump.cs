using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public interface ILump
        {
            LumpType LumpType { get; }
        }

        public class ArrayLump<T> : ILump, IEnumerable<T>
            where T : struct
        {
            public LumpType LumpType { get; }

            private bool _firstRequest = true;
            private readonly ValveBspFile _bspFile;
            private T[] _array;
            private int _length = -1;

            public ArrayLump( ValveBspFile bspFile, LumpType type )
            {
                _bspFile = bspFile;
                LumpType = type;
            }

            public void EnsureLoaded()
            {
                if ( _array != null ) return;
                _array = new T[Length];
                _bspFile.ReadLumpValues( LumpType, 0, _array, 0, Length );
            }

            public int Length
            {
                get
                {
                    if ( _length == -1 )
                    {
                        _length = _bspFile.GetLumpLength<T>( LumpType );
                    }

                    return _length;
                }
            }

            public T this[ int index ]
            {
                get
                {
                    if ( _firstRequest )
                    {
                        _firstRequest = false;
                        return GetSingle( index );
                    }

                    EnsureLoaded();
                    return _array[index];
                }
            }

            [ThreadStatic]
            private static T[] _sSingleArray;

            private T GetSingle( int index )
            {
                if ( _array != null ) return _array[index];
                if ( _sSingleArray == null ) _sSingleArray = new T[1];

                _bspFile.ReadLumpValues( LumpType, index, _sSingleArray, 0, 1 );
                return _sSingleArray[0];
            }

            public IEnumerable<T> Range( int start, int count )
            {
                if ( _array != null ) return _array.Skip( start ).Take( count );
                if ( start + count > Length ) count = Length - start;
                if ( count <= 0 ) return Enumerable.Empty<T>();

                var array = new T[count];
                _bspFile.ReadLumpValues( LumpType, start, array, 0, count );
                return array;
            }

            public IEnumerator<T> GetEnumerator()
            {
                EnsureLoaded();
                return ((IEnumerable<T>) _array).GetEnumerator();
            }

            System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
            {
                return GetEnumerator();
            }
        }

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
