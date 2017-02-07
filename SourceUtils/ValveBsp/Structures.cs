using System;
using System.Runtime.InteropServices;

namespace SourceUtils.ValveBsp
{
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Vector3S
    {
        public short X;
        public short Y;
        public short Z;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct BspModel
    {
        public Vector3 Min;
        public Vector3 Max;
        public Vector3 Origin;
        public int HeadNode;
        public int FirstFace;
        public int NumFaces;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct BspChild
    {
        private readonly int _value;

        public bool IsLeaf => _value < 0;
        public int Index => _value >= 0 ? _value : -(_value + 1);
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
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

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct AreaFlags
    {
        private readonly short _value;

        public int Area => _value & 0x1f;
        public int Flags => _value >> 9;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
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

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Plane
    {
        public Vector3 Normal;
        public float Dist;
        public int Type;

        public bool IsInFront( Vector3 vec )
        {
            return vec.Dot( Normal ) > Dist;
        }
    }

    public enum Side : byte
    {
        OutFacing = 0,
        InFacing = 1
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Edge
    {
        public ushort A;
        public ushort B;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Face
    {
        public ushort PlaneNum;
        public Side Side;

        [MarshalAs( UnmanagedType.U1 )] public bool OnNode;

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

        public byte GetLightStyle( int index )
        {
            return (byte) ((_styles >> (index << 3)) & 0xff);
        }
    }

    public enum PrimitiveType : ushort
    {
        TriangleList,
        TriangleStrip,
        TriangleFan
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Primitive
    {
        public PrimitiveType Type;
        public ushort FirstIndex;
        public ushort IndexCount;
        public ushort FirstVert;
        public ushort VertCount;
    }

    [Flags]
    public enum SurfFlags : int
    {
        LIGHT = 0x1,
        SKY2D = 0x2,
        SKY = 0x4,
        WARP = 0x8,
        TRANS = 0x10,
        NOPORTAL = 0x20,
        TRIGGER = 0x40,
        NODRAW = 0x80,
        HINT = 0x100,
        SKIP = 0x200,
        NOLIGHT = 0x400,
        BUMPLIGHT = 0x800,
        NOSHADOWS = 0x1000,
        NODECALS = 0x2000,
        NOCHOP = 0x4000,
        HITBOX = 0x8000
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct TexAxis
    {
        public Vector3 Normal;
        public float Offset;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct TextureInfo
    {
        public TexAxis TextureUAxis;
        public TexAxis TextureVAxis;

        public TexAxis LightmapUAxis;
        public TexAxis LightmapVAxis;

        public SurfFlags Flags;
        public int TexData;
    }

    [Flags]
    public enum BrushContents : int
    {
        EMPTY = 0, // No contents
        SOLID = 0x1, // an eye is never valid in a solid
        WINDOW = 0x2, // translucent, but not watery (glass)
        AUX = 0x4,
        GRATE = 0x8, // alpha-tested "grate" textures. Bullets/sight pass through, but solids don't
        SLIME = 0x10,
        WATER = 0x20,
        MIST = 0x40,
        OPAQUE = 0x80, // block AI line of sight
        TESTFOGVOLUME = 0x100, // things that cannot be seen through (may be non-solid though)
        UNUSED = 0x200, // unused
        UNUSED6 = 0x400, // unused
        TEAM1 = 0x800, // per team contents used to differentiate collisions between players and objects on different teams
        TEAM2 = 0x1000,
        IGNORE_NODRAW_OPAQUE = 0x2000, // ignore CONTENTS_OPAQUE on surfaces that have SURF_NODRAW
        MOVEABLE = 0x4000, // hits entities which are MOVETYPE_PUSH (doors, plats, etc.)
        AREAPORTAL = 0x8000, // remaining contents are non-visible, and don't eat brushes
        PLAYERCLIP = 0x10000,
        MONSTERCLIP = 0x20000,
        CURRENT_0 = 0x40000, // currents can be added to any other contents, and may be mixed
        CURRENT_90 = 0x80000,
        CURRENT_180 = 0x100000,
        CURRENT_270 = 0x200000,
        CURRENT_UP = 0x400000,
        CURRENT_DOWN = 0x800000,
        ORIGIN = 0x1000000, // removed before bsping an entity
        MONSTER = 0x2000000, // should never be on a brush, only in game
        DEBRIS = 0x4000000,
        DETAIL = 0x8000000, // brushes to be added after vis leafs
        TRANSLUCENT = 0x10000000, // auto set if any surface has trans
        LADDER = 0x20000000,
        HITBOX = 0x40000000, // use accurate hitboxes on trace
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Brush
    {
        public int FirstSide;
        public int NumSides;
        public BrushContents Contents;
    }
    
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct BrushSide
    {
        public ushort PlaneNum;
        public short TexInfo;
        public short DispInfo;
        public short Bevel;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct DispSubNeighbor
    {
        public ushort NeighborIndex;
        public byte NeighborOrientation;
        public byte Span;
        public byte NeighborSpan;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct DispNeighbor
    {
        public DispSubNeighbor SubNeighbor0;
        public DispSubNeighbor SubNeighbor1;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct DispCornerNeighbors
    {
        public ushort Neighbor0;
        public ushort Neighbor1;
        public ushort Neighbor2;
        public ushort Neighbor3;

        public byte NumNeighbors;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1, Size = 176 )]
    public struct DispInfo
    {
        public Vector3 StartPosition;
        public int DispVertStart;
        public int DispTriStart;
        public int Power;
        public int MinTess;
        public float SmoothingAngle;
        public int Contents;
        public ushort MapFace;

        public int LightmapAlphaStart;
        private readonly short _unknown;
        public int LightmapSamplePositionStart;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct DispVert
    {
        public Vector3 Vector;
        public float Distance;
        public float Alpha;
    }
}
