using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        public abstract class ArrayLump<T> : ILump, IEnumerable<T>
        {
            protected ValveBspFile BspFile { get; }
            public LumpType LumpType { get; }
            public int Length { get; }

            protected virtual Type StructType => typeof(T);

            public ArrayLump( ValveBspFile bspFile, LumpType type )
            {
                BspFile = bspFile;
                LumpType = type;
                Length = BspFile.GetLumpLength( type, StructType );
            }

            public abstract IEnumerator<T> GetEnumerator();

            public abstract T this[int index] { get; }

            IEnumerator IEnumerable.GetEnumerator()
            {
                return GetEnumerator();
            }

            public override string ToString()
            {
                return $"{StructType}[{Length}]";
            }
        }

        public class VersionedArrayLump<T> : ArrayLump<T>
            where T : class
        {
            private T[] _array;
            private Type _structType;

            protected override Type StructType => _structType ?? (_structType = FindStructType());

            public VersionedArrayLump( ValveBspFile bspFile, LumpType type )
                : base( bspFile, type ) { }
            
            private void EnsureLoaded()
            {
                lock ( this )
                {
                    if ( _array != null ) return;

                    _array = new T[Length];

                    var temp = Array.CreateInstance( StructType, Length );
                    var method = typeof(ValveBspFile)
                        .GetMethod( nameof(ReadLumpValues), BindingFlags.Instance | BindingFlags.NonPublic )
                        .MakeGenericMethod( StructType );

                    method.Invoke( BspFile, new object[] { LumpType, 0, temp, 0, Length } );

                    for ( var i = 0; i < Length; ++i )
                    {
                        _array[i] = (T) temp.GetValue( i );
                    }
                }
            }

            private Type FindStructType()
            {
                var version = BspFile.GetLumpInfo( LumpType ).Version;

                foreach ( var type in Assembly.GetExecutingAssembly().GetTypes() )
                {
                    if ( !typeof(T).IsAssignableFrom( type ) ) continue;

                    var versionAttrib = type.GetCustomAttribute<StructVersionAttribute>();

                    if ( versionAttrib != null && versionAttrib.MinVersion <= version && versionAttrib.MaxVersion >= version )
                    {
                        return type;
                    }
                }

                throw new NotSupportedException( $"Version {version} of lump {LumpType} is not supported." );
            }

            public override T this[ int index ]
            {
                get
                { 
                    EnsureLoaded();
                    
                    if ( index < 0 || index >= _array.Length )
                    {
                        throw new IndexOutOfRangeException( $"{index} is not >= 0 and < {_array.Length}." );
                    }
                    
                    return _array[index];
                }
            }

            public override IEnumerator<T> GetEnumerator()
            {
                EnsureLoaded();
                return ((IEnumerable<T>) _array).GetEnumerator();
            }
        }

        public class StructArrayLump<T> : ArrayLump<T>
            where T : struct
        {
            private T[] _array;
            
            private volatile bool _firstRequest = true;

            public StructArrayLump( ValveBspFile bspFile, LumpType type )
                : base( bspFile, type ) { }

            private void EnsureLoaded()
            {
                lock ( this )
                {
                    if ( _array != null ) return;
                    _array = new T[Length];
                    BspFile.ReadLumpValues( LumpType, 0, _array, 0, Length );
                }
            }

            public override T this[ int index ]
            {
                get
                {
                    if ( _firstRequest )
                    {
                        _firstRequest = false;
                        return GetSingle( index );
                    }

                    EnsureLoaded();

                    if ( index < 0 || index >= _array.Length )
                    {
                        throw new IndexOutOfRangeException( $"{index} is not >= 0 and < {_array.Length}." );
                    }

                    return _array[index];
                }
            }

            [ThreadStatic]
            private static T[] _sSingleArray;

            private T GetSingle( int index )
            {
                if ( _array != null ) return _array[index];
                if ( _sSingleArray == null ) _sSingleArray = new T[1];

                BspFile.ReadLumpValues( LumpType, index, _sSingleArray, 0, 1 );
                return _sSingleArray[0];
            }

            public IEnumerable<T> Range( int start, int count )
            {
                if ( _array != null ) return _array.Skip( start ).Take( count );
                if ( start + count > Length ) count = Length - start;
                if ( count <= 0 ) return Enumerable.Empty<T>();

                var array = new T[count];
                BspFile.ReadLumpValues( LumpType, start, array, 0, count );
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

            public override IEnumerator<T> GetEnumerator()
            {
                EnsureLoaded();
                return ((IEnumerable<T>) _array).GetEnumerator();
            }
        }
    }
}
