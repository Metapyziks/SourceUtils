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

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct LzmaHeader
        {
            public const uint ExpectedId = ('A' << 24) | ('M' << 16) | ('Z' << 8) | 'L';

            public uint Id;
            public uint ActualSize;
            public uint LzmaSize;
            public fixed byte Properties[5];
        }

        [StructLayout(LayoutKind.Sequential, Pack = 1)]
        public unsafe struct StandardLzmaHeader
        {
            public fixed byte Properties[5];
            public ulong ActualSize;
        }
    }
}
