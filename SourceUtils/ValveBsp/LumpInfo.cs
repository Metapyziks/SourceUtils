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
            public LumpType IdentCode;

            public override string ToString()
            {
                return $"{{ Type: {IdentCode}, Length: {Length:N0}, Version: {Version} }}";
            }
        }
    }
}
