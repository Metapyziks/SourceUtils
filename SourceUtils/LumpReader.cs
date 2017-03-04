using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    public class LumpReader<TLump>
        where TLump : struct
    {
        public static TLump[] ReadLump(byte[] src, int offset, int length)
        {
            var size = Marshal.SizeOf(typeof(TLump));
            var count = length/size;
            var array = new TLump[count];

            if (typeof (TLump) == typeof (byte))
            {
                Array.Copy(src, array, array.Length);
                return array;
            }

            var tempPtr = Marshal.AllocHGlobal(size);
            
            for (var i = 0; i < count; ++i)
            {
                Marshal.Copy(src, offset + i * size, tempPtr, size);
                array[i] = (TLump) Marshal.PtrToStructure(tempPtr, typeof (TLump));
            }

            Marshal.FreeHGlobal(tempPtr);

            return array;
        }

        public static void ReadLumpToList(byte[] src, int offset, int length, List<TLump> dstList)
        {
            var size = Marshal.SizeOf(typeof(TLump));
            var count = length/size;

            if (typeof(TLump) == typeof(byte))
            {
                ((List<byte>) (object) dstList).AddRange(src);
            }

            var tempPtr = Marshal.AllocHGlobal(size);

            for (var i = 0; i < count; ++i)
            {
                Marshal.Copy(src, offset + i * size, tempPtr, size);
                dstList.Add((TLump) Marshal.PtrToStructure(tempPtr, typeof(TLump)));
            }

            Marshal.FreeHGlobal(tempPtr);
        }

        [ThreadStatic]
        private static byte[] _sReadLumpBuffer;

        [ThreadStatic]
        private static List<TLump> _sReadLumpList;

        public static TLump ReadSingleFromStream(Stream stream)
        {
            if (_sReadLumpList == null) _sReadLumpList = new List<TLump>();
            else _sReadLumpList.Clear();

            ReadLumpFromStream(stream, 1, _sReadLumpList);

            return _sReadLumpList[0];
        }

        public static void ReadLumpFromStream(Stream stream, int count, Action<TLump> handler, bool reseekPerItem = true)
        {
            ReadLumpFromStream( stream, count, ( index, lump ) => handler( lump ), reseekPerItem );
        }

        public static void ReadLumpFromStream(Stream stream, int count, Action<int, TLump> handler, bool reseekPerItem = true)
        {
            if (_sReadLumpList == null) _sReadLumpList = new List<TLump>();
            else _sReadLumpList.Clear();

            var size = Marshal.SizeOf(typeof (TLump));
            var start = stream.Position;

            ReadLumpFromStream(stream, count, _sReadLumpList);
            var end = stream.Position;

            for (var i = 0; i < count; ++i)
            {
                if (reseekPerItem) stream.Seek(start + i*size, SeekOrigin.Begin);
                handler(i, _sReadLumpList[i]);
            }

            if (reseekPerItem) stream.Seek( end, SeekOrigin.Begin );
        }

        public static void ReadLumpFromStream( Stream stream, int count, TLump[] dst, int dstOffset = 0 )
        {
            ReadLumpFromStream( stream, count, ( index, item ) => dst[dstOffset + index] = item, false );
        }

        public static TLump[] ReadLumpFromStream(Stream stream, int count)
        {
            var array = new TLump[count];
            ReadLumpFromStream( stream, count, array );
            return array;
        }

        public static TValue[] ReadLumpFromStream<TValue>(Stream stream, int count, Func<TLump, TValue> selectFunc)
        {
            if (_sReadLumpList == null) _sReadLumpList = new List<TLump>();
            else _sReadLumpList.Clear();

            ReadLumpFromStream(stream, count, _sReadLumpList);

            var output = new TValue[count];
            for (var i = 0; i < count; ++i)
            {
                output[i] = selectFunc( _sReadLumpList[i] );
            }

            return output;
        }

        public static void ReadLumpFromStream(Stream stream, int count, List<TLump> dstList)
        {
            var size = Marshal.SizeOf(typeof (TLump));
            var length = count*size;

            if (_sReadLumpBuffer == null || _sReadLumpBuffer.Length < length)
            {
                _sReadLumpBuffer = new byte[length];
            }

            stream.Read(_sReadLumpBuffer, 0, length);
            ReadLumpToList(_sReadLumpBuffer, 0, length, dstList);
        }
    }
}