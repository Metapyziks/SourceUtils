using System.Collections.Generic;
using System.Linq;

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
                    EnsureLoaded();
                    return _array[index];
                }
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
    }
}
