using System.Runtime.InteropServices;

namespace SourceUtils.ValveBsp
{
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct Vector3S
    {
        public short X;
        public short Y;
        public short Z;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct BspModel
    {
        public Vector3 Min;
        public Vector3 Max;
        public Vector3 Origin;
        public int HeadNode;
        public int FirstFace;
        public int NumFaces;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct BspChild
    {
        private readonly int _value;

        public bool IsLeaf => _value < 0;
        public int Index => _value >= 0 ? _value : -(_value + 1);
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct BspNode
    {
        public int PlaneNum;
        public BspChild ChildA;
        public BspChild ChildB;
        public Vector3S Min;
        public Vector3S Max;
        public ushort FirstFace;
        public ushort NumFaces;
        public short Area;

        private readonly short _padding;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct AreaFlags
    {
        private readonly short _value;

        public int Area => _value & 0x1f;
        public int Flags => _value >> 9;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct BspLeaf
    {
        public int Contents;
        public short Cluster;
        public AreaFlags AreaFlags;
        public Vector3S Min;
        public Vector3S Max;
        public ushort FirstLeafFace;
        public ushort NumLeafFaces;
        public ushort FirstLeafBrush;
        public ushort NumLeafBrushes;
        public short LeafWaterDataId;

        private readonly short _padding;
    }
    
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct Plane
    {
        public Vector3 Normal;
        public float Dist;
        public int Type;
    }

    public enum Side : byte
    {
        OutFacing = 0,
        InFacing = 1
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct Edge
    {
        public ushort A;
        public ushort B;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct Face
    {
        public ushort PlaneNum;
        public Side Side;

        [MarshalAs(UnmanagedType.U1)]
        public bool OnNode;

        public int FirstEdge;
        public short NumEdges;
        public short TexInfo;
        public short DispInfo;
        public short FogVolumeId;
        private readonly uint _styles;
        public int LightOffset;
        public float Area;
        public int LightMapOffsetX;
        public int LightMapOffsetY;
        public int LightMapSizeX;
        public int LightMapSizeY;
        public int OriginalFace;
        public ushort NumPrimitives;
        public ushort FirstPrimitive;
        public uint SmoothingGroups;

        public byte GetLightStyle(int index)
        {
            return (byte) ((_styles >> (index << 3)) & 0xff);
        }
    }
}
