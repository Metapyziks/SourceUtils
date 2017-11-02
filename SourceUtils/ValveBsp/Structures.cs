using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.Contracts;
using System.Runtime.InteropServices;

namespace SourceUtils.ValveBsp
{
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Vector3S
    {
        public readonly short X;
        public readonly short Y;
        public readonly short Z;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct BspModel
    {
        public readonly Vector3 Min;
        public readonly Vector3 Max;
        public readonly Vector3 Origin;
        public readonly int HeadNode;
        public readonly int FirstFace;
        public readonly int NumFaces;
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
        public readonly int PlaneNum;
        public readonly BspChild ChildA;
        public readonly BspChild ChildB;
        public readonly Vector3S Min;
        public readonly Vector3S Max;
        public readonly ushort FirstFace;
        public readonly ushort NumFaces;
        public readonly short Area;

        private readonly short _padding;
    }

    [Flags]
    public enum LeafFlags : byte
    {
        Sky = 1,
        Radial = 2,
        Sky2D = 4
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct AreaFlags
    {
        private readonly short _value;

        public int Area => _value & 0x1f;
        public LeafFlags Flags => (LeafFlags) (_value >> 9);
    }

    public interface IBspLeaf
    {
        short Cluster { get; }
        Vector3S Min { get; }
        Vector3S Max { get; }
        AreaFlags AreaFlags { get; }
        ushort FirstLeafFace { get; }
        ushort NumLeafFaces { get; }
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    [StructVersion( MaxVersion = 0 )]
    public unsafe struct BspLeafV0 : IBspLeaf
    {
        public readonly int Contents;
        public readonly short Cluster;
        public readonly AreaFlags AreaFlags;
        public readonly Vector3S Min;
        public readonly Vector3S Max;
        public readonly ushort FirstLeafFace;
        public readonly ushort NumLeafFaces;
        public readonly ushort FirstLeafBrush;
        public readonly ushort NumLeafBrushes;
        public readonly short LeafWaterDataId;

        private fixed uint _compressedLightCube[6];
        private readonly short _padding;

        short IBspLeaf.Cluster => Cluster;
        Vector3S IBspLeaf.Min => Min;
        Vector3S IBspLeaf.Max => Max;
        AreaFlags IBspLeaf.AreaFlags => AreaFlags;
        ushort IBspLeaf.FirstLeafFace => FirstLeafFace;
        ushort IBspLeaf.NumLeafFaces => NumLeafFaces;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    [StructVersion( MinVersion = 1 )]
    public struct BspLeafV1 : IBspLeaf
    {
        public readonly int Contents;
        public readonly short Cluster;
        public readonly AreaFlags AreaFlags;
        public readonly Vector3S Min;
        public readonly Vector3S Max;
        public readonly ushort FirstLeafFace;
        public readonly ushort NumLeafFaces;
        public readonly ushort FirstLeafBrush;
        public readonly ushort NumLeafBrushes;
        public readonly short LeafWaterDataId;

        private readonly short _padding;

        short IBspLeaf.Cluster => Cluster;
        Vector3S IBspLeaf.Min => Min;
        Vector3S IBspLeaf.Max => Max;
        AreaFlags IBspLeaf.AreaFlags => AreaFlags;
        ushort IBspLeaf.FirstLeafFace => FirstLeafFace;
        ushort IBspLeaf.NumLeafFaces => NumLeafFaces;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Plane
    {
        public readonly Vector3 Normal;
        public readonly float Dist;
        public readonly int Type;

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
        public readonly ushort A;
        public readonly ushort B;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct Face
    {
        public readonly ushort PlaneNum;
        public readonly Side Side;

        [MarshalAs( UnmanagedType.U1 )] public readonly bool OnNode;

        public readonly int FirstEdge;
        public readonly short NumEdges;
        public readonly short TexInfo;
        public readonly short DispInfo;
        public readonly short FogVolumeId;
        private readonly uint _styles;
        public readonly int LightOffset;
        public readonly float Area;
        public readonly int LightMapOffsetX;
        public readonly int LightMapOffsetY;
        public readonly int LightMapSizeX;
        public readonly int LightMapSizeY;
        public readonly int OriginalFace;
        public readonly ushort NumPrimitives;
        public readonly ushort FirstPrimitive;
        public readonly uint SmoothingGroups;

        public IntVector2 LightMapSize => LightOffset == -1 ? IntVector2.Zero : new IntVector2( LightMapSizeX + 1, LightMapSizeY + 1 );

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
        public readonly PrimitiveType Type;
        public readonly ushort FirstIndex;
        public readonly ushort IndexCount;
        public readonly ushort FirstVert;
        public readonly ushort VertCount;
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
        public readonly Vector3 Normal;
        public readonly float Offset;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct TextureInfo
    {
        public readonly TexAxis TextureUAxis;
        public readonly TexAxis TextureVAxis;

        public readonly TexAxis LightmapUAxis;
        public readonly TexAxis LightmapVAxis;

        public readonly SurfFlags Flags;
        public readonly int TexData;
    }
    
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct TextureData
    {
        public readonly Vector3 Reflectivity;
        public readonly int NameStringTableId;
        public readonly int Width;
        public readonly int Height;
        public readonly int ViewWidth;
        public readonly int ViewHeight;
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
        TEAM1 = 0x800,
        // per team contents used to differentiate collisions between players and objects on different teams
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
        public readonly int FirstSide;
        public readonly int NumSides;
        public readonly BrushContents Contents;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct BrushSide
    {
        public readonly ushort PlaneNum;
        public readonly short TexInfo;
        public readonly short DispInfo;
        public readonly short Bevel;
    }

    public enum NeighborCorner
    {
        LowerLeft,
        UpperLeft,
        UpperRight,
        LowerRight
    }

    public enum NeighborSpan : byte
    {
        CornerToCorner,
        CornerToMidpoint,
        MidpointToCorner
    }

    public enum NeighborEdge : byte
    {
        Left,
        Top,
        Right,
        Bottom
    }

    public enum NeighborOrientation : byte
    {
        CounterClockwise0,
        CounterClockwise90,
        CounterClockwise180,
        CounterClockwise270,
        Unknown = 255
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1, Size = 6 )]
    public struct DispSubNeighbor
    {
        public readonly ushort NeighborIndex;
        public readonly NeighborOrientation NeighborOrientation;
        public readonly NeighborSpan Span;
        public readonly NeighborSpan NeighborSpan;

        public bool IsValid => NeighborIndex != 0xffff;

        public override string ToString()
        {
            return IsValid ? $"{NeighborIndex}" : "null";
        }
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct DispNeighbor
    {
        private readonly DispSubNeighbor _subNeighbor0;
        private readonly DispSubNeighbor _subNeighbor1;

        public bool Any => _subNeighbor0.IsValid || _subNeighbor1.IsValid;
        public bool CornerToCorner => _subNeighbor0.IsValid && _subNeighbor0.Span == NeighborSpan.CornerToCorner;
        public bool SimpleCornerToCorner => CornerToCorner && _subNeighbor0.NeighborSpan == NeighborSpan.CornerToCorner;

        public DispSubNeighbor this[ int index ]
        {
            get
            {
                switch ( index )
                {
                    case 0:
                        return _subNeighbor0;
                    case 1:
                        return _subNeighbor1;
                    default:
                        throw new IndexOutOfRangeException();
                }
            }
        }

        public override string ToString()
        {
            return $"({_subNeighbor0}, {_subNeighbor1})";
        }
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1, Size = 10 )]
    public struct DispCornerNeighbors : IEnumerable<ushort>
    {
        private readonly ushort _neighbor0;
        private readonly ushort _neighbor1;
        private readonly ushort _neighbor2;
        private readonly ushort _neighbor3;

        public readonly byte NumNeighbors;

        public ushort this[ int index ]
        {
            get
            {
                if ( index < 0 || index >= NumNeighbors ) throw new IndexOutOfRangeException();

                switch ( index )
                {
                    case 0:
                        return _neighbor0;
                    case 1:
                        return _neighbor1;
                    case 2:
                        return _neighbor2;
                    case 3:
                        return _neighbor3;
                    default:
                        throw new IndexOutOfRangeException();
                }
            }
        }

        public override string ToString()
        {
            return $"({string.Join( ", ", this )})";
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        public IEnumerator<ushort> GetEnumerator()
        {
            for ( var i = 0; i < NumNeighbors; ++i ) yield return this[i];
        }
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1, Size = 176 )]
    public struct DispInfo
    {
        public readonly Vector3 StartPosition;
        public readonly int DispVertStart;
        public readonly int DispTriStart;
        public readonly int Power;
        public readonly int MinTess;
        public readonly float SmoothingAngle;
        public readonly int Contents;
        public readonly ushort MapFace;

        private readonly ushort _unknown;

        public readonly int LightmapAlphaStart;
        public readonly int LightmapSamplePositionStart;

        private readonly DispNeighbor _edgeNeighbor0;
        private readonly DispNeighbor _edgeNeighbor1;
        private readonly DispNeighbor _edgeNeighbor2;
        private readonly DispNeighbor _edgeNeighbor3;

        public DispNeighbor GetEdgeNeighbor( NeighborEdge edge )
        {
            switch ( (int) edge )
            {
                case 0:
                    return _edgeNeighbor0;
                case 1:
                    return _edgeNeighbor1;
                case 2:
                    return _edgeNeighbor2;
                case 3:
                    return _edgeNeighbor3;
                default:
                    throw new IndexOutOfRangeException();
            }
        }

        private readonly DispCornerNeighbors _cornerNeighbors0;
        private readonly DispCornerNeighbors _cornerNeighbors1;
        private readonly DispCornerNeighbors _cornerNeighbors2;
        private readonly DispCornerNeighbors _cornerNeighbors3;

        public DispCornerNeighbors GetCornerNeighbor( NeighborCorner corner )
        {
            switch ( (int) corner )
            {
                case 0:
                    return _cornerNeighbors0;
                case 1:
                    return _cornerNeighbors1;
                case 2:
                    return _cornerNeighbors2;
                case 3:
                    return _cornerNeighbors3;
                default:
                    throw new IndexOutOfRangeException();
            }
        }
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct DispVert
    {
        public readonly Vector3 Vector;
        public readonly float Distance;
        public readonly float Alpha;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct ColorRGBExp32
    {
        public static implicit operator int(ColorRGBExp32 color)
        {
            return color.R | (color.G << 8) | (color.B << 16) | ((color.Exponent + 128) << 24);
        }

        public readonly byte R;
        public readonly byte G;
        public readonly byte B;
        public readonly sbyte Exponent;
    }

    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct CubemapSample
    {
        public readonly int OriginX;
        public readonly int OriginY;
        public readonly int OriginZ;
        public readonly int Size;
    }
    
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct LeafAmbientLighting
    {
        public readonly CompressedLightCube Cube;
        public readonly byte X;
        public readonly byte Y;
        public readonly byte Z;
        private readonly byte _padding;
    }
    
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct LeafAmbientIndex
    {
        public readonly ushort AmbientSampleCount;
        public readonly ushort FirstAmbientSample;
    }
    
    [StructLayout( LayoutKind.Sequential, Pack = 1 )]
    public struct CompressedLightCube
    {
        public readonly ColorRGBExp32 Face0;
        public readonly ColorRGBExp32 Face1;
        public readonly ColorRGBExp32 Face2;
        public readonly ColorRGBExp32 Face3;
        public readonly ColorRGBExp32 Face4;
        public readonly ColorRGBExp32 Face5;

        public ColorRGBExp32 this[int face]
        {
            get {
                switch ( face )
                {
                    case 0: return Face0;
                    case 1: return Face1;
                    case 2: return Face2;
                    case 3: return Face3;
                    case 4: return Face4;
                    case 5: return Face5;
                    default: throw new IndexOutOfRangeException();
                }
            }
        }
    }
}
