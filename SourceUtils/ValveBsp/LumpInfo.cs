using System.Runtime.InteropServices;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        [StructLayout(LayoutKind.Sequential)]
        public struct LumpInfo
        {
            public int Offset;
            public int Length;
            public int Version;
            // https://github.com/ValveSoftware/source-sdk-2013/blob/master/mp/src/public/bspfile.h#L381
            // public LumpType IdentCode;
            public int UncompressedSize;

            public override string ToString()
            {
                return $"{{ UncompressedSize: {UncompressedSize}, Length: {Length:N0}, Version: {Version} }}";
            }
        }
    }
}
