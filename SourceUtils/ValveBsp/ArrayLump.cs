using System.Collections.Generic;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public interface ILump
        {
            LumpType LumpType { get; }
        }
        
        public class ArrayLump<T> : ILump, IEnumerable<T>
        {
            public LumpType LumpType { get; }
            
            private readonly ValveBspFile _bspFile;
            private T[] _array;
            
            public ArrayLump(ValveBspFile bspFile, LumpType type)
            {
                _bspFile = bspFile;
                LumpType = type;
            }
            
            private void EnsureLoaded()
            {
            
            }
            
            public int Length
            {
                get
                {
                    EnsureLoaded();
                    return _array.Length;
                }
            }
            
            public T this[int index]
            {
                get
                {
                    EnsureLoaded();
                    return _array[index];
                }
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
