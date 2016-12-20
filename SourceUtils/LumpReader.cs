using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    internal class LumpReader<T>
        where T : struct
    {
        public static T[] ReadLump(byte[] src, int offset, int length)
        {
            var size = Marshal.SizeOf(typeof(T));
            var count = length/size;
            var array = new T[count];

            if (typeof (T) == typeof (byte))
            {
                Array.Copy(src, array, array.Length);
                return array;
            }

            var tempPtr = Marshal.AllocHGlobal(size);
            
            for (var i = 0; i < count; ++i)
            {
                Marshal.Copy(src, offset + i * size, tempPtr, size);
                array[i] = (T) Marshal.PtrToStructure(tempPtr, typeof (T));
            }

            Marshal.FreeHGlobal(tempPtr);

            return array;
        }

        public static void ReadLumpToList(byte[] src, int offset, int length, List<T> dstList)
        {
            var size = Marshal.SizeOf(typeof(T));
            var count = length/size;

            if (typeof(T) == typeof(byte))
            {
                ((List<byte>) (object) dstList).AddRange(src);
            }

            var tempPtr = Marshal.AllocHGlobal(size);

            for (var i = 0; i < count; ++i)
            {
                Marshal.Copy(src, offset + i * size, tempPtr, size);
                dstList.Add((T) Marshal.PtrToStructure(tempPtr, typeof(T)));
            }

            Marshal.FreeHGlobal(tempPtr);
        }

        [ThreadStatic]
        private static byte[] _sReadLumpBuffer;

        [ThreadStatic]
        private static List<T> _sReadLumpList;

        public static T ReadSingleFromStream(Stream stream)
        {
            if (_sReadLumpList == null) _sReadLumpList = new List<T>();
            else _sReadLumpList.Clear();

            ReadLumpFromStream(stream, 1, _sReadLumpList);

            return _sReadLumpList[0];
        }

        public static void ReadLumpFromStream(Stream stream, int count, Action<T> handler)
        {
            if (_sReadLumpList == null) _sReadLumpList = new List<T>();
            else _sReadLumpList.Clear();

            var size = Marshal.SizeOf(typeof (T));
            var start = stream.Position;

            ReadLumpFromStream(stream, count, _sReadLumpList);

            for (var i = 0; i < count; ++i)
            {
                stream.Seek(start + i*size, SeekOrigin.Begin);
                handler(_sReadLumpList[i]);
            }
        }

        public static T[] ReadLumpFromStream(Stream stream, int count)
        {
            if (_sReadLumpList == null) _sReadLumpList = new List<T>();
            else _sReadLumpList.Clear();

            var size = Marshal.SizeOf(typeof (T));
            var start = stream.Position;

            ReadLumpFromStream(stream, count, _sReadLumpList);

            var output = new T[count];
            for (var i = 0; i < count; ++i)
            {
                output[i] = _sReadLumpList[i];
            }

            return output;
        }

        public static void ReadLumpFromStream(Stream stream, int count, List<T> dstList)
        {
            var size = Marshal.SizeOf(typeof (T));
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