using System;
using System.Collections.Generic;
using System.Linq;

namespace SourceUtils
{
    partial class ValveBspFile
    {
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

            public int IndexOf( T value )
            {
                EnsureLoaded();
                return Array.IndexOf( _array, value );
            }

            public int IndexOf( Predicate<T> predicate )
            {
                EnsureLoaded();

                for ( var i = 0; i < _array.Length; ++i )
                {
                    if ( predicate( _array[i] ) ) return i;
                }

                return -1;
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
    }
}
