using System;
using System.Collections.Generic;
using System.Text;

namespace SourceUtils.WebExport
{
    static class Utils
    {
        [ThreadStatic]
        private static StringBuilder _sArrayBuilder;

        public static string CompressArray<T>(IEnumerable<T> enumerable)
        {
            return CompressArray(enumerable, x => x.ToString());
        }

        public static string CompressArray<T>(IEnumerable<T> enumerable, Func<T, string> serializer)
        {
            if (_sArrayBuilder == null) _sArrayBuilder = new StringBuilder();
            else _sArrayBuilder.Remove(0, _sArrayBuilder.Length);

            _sArrayBuilder.Append("[");
            foreach (var item in enumerable)
            {
                _sArrayBuilder.Append(serializer(item));
                _sArrayBuilder.Append(",");
            }

            if (_sArrayBuilder.Length > 1) _sArrayBuilder.Remove(_sArrayBuilder.Length - 1, 1);
            _sArrayBuilder.Append("]");

            return LZString.compressToBase64( _sArrayBuilder.ToString() );
        }
    }
}
