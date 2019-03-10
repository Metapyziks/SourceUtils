using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.ValveBsp
{
    [Flags]
    public enum StaticPropFlags : byte
    {
        Fades = 1,
        UseLightingOrigin = 2,
        NoDraw = 4,
        IgnoreNormals = 8,
        NoShadow = 0x10,
        Unused = 0x20,
        NoPerVertexLighting = 0x40,
        NoSelfShadowing = 0x80
    }

    public interface IStaticProp
    {
        Vector3 Origin { get; }
        Vector3 Angles { get; }
        ushort PropType { get; }
        int Skin { get; }
        ushort FirstLeaf { get; }
        ushort LeafCount { get; }
        StaticPropFlags Flags { get; }
        bool Solid { get; }
        uint ColorModulation { get; }
        float FadeMinDist { get; }
        float FadeMaxDist { get; }
        float ForcedFadeScale { get; }
        Vector3 LightingOrigin { get; }
        float Scale { get; }
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1, Size = 60)]
    public struct StaticPropV5 : IStaticProp
    {
        public readonly Vector3 Origin;
        public readonly Vector3 Angles;
        public readonly ushort PropType;
        public readonly ushort FirstLeaf;
        public readonly ushort LeafCount;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool Solid;
        public readonly StaticPropFlags Flags;
        public readonly int Skin;
        public readonly float FadeMinDist;
        public readonly float FadeMaxDist;
        public readonly Vector3 LightingOrigin;

        public readonly float ForcedFadeScale;

        Vector3 IStaticProp.Origin => Origin;
        Vector3 IStaticProp.Angles => Angles;
        ushort IStaticProp.PropType => PropType;
        int IStaticProp.Skin => Skin;
        ushort IStaticProp.FirstLeaf => FirstLeaf;
        ushort IStaticProp.LeafCount => LeafCount;
        StaticPropFlags IStaticProp.Flags => Flags;
        bool IStaticProp.Solid => Solid;
        uint IStaticProp.ColorModulation => 0xffffffff;
        float IStaticProp.FadeMinDist => FadeMinDist;
        float IStaticProp.FadeMaxDist => FadeMaxDist;
        float IStaticProp.ForcedFadeScale => ForcedFadeScale;
        Vector3 IStaticProp.LightingOrigin => LightingOrigin;
        float IStaticProp.Scale => 1f;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1, Size = 64)]
    public struct StaticPropV6 : IStaticProp
    {
        public readonly Vector3 Origin;
        public readonly Vector3 Angles;
        public readonly ushort PropType;
        public readonly ushort FirstLeaf;
        public readonly ushort LeafCount;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool Solid;
        public readonly StaticPropFlags Flags;
        public readonly int Skin;
        public readonly float FadeMinDist;
        public readonly float FadeMaxDist;
        public readonly Vector3 LightingOrigin;

        public readonly float ForcedFadeScale;

        public readonly ushort MinDXLevel;
        public readonly ushort MaxDXLevel;

        Vector3 IStaticProp.Origin => Origin;
        Vector3 IStaticProp.Angles => Angles;
        ushort IStaticProp.PropType => PropType;
        int IStaticProp.Skin => Skin;
        ushort IStaticProp.FirstLeaf => FirstLeaf;
        ushort IStaticProp.LeafCount => LeafCount;
        StaticPropFlags IStaticProp.Flags => Flags;
        bool IStaticProp.Solid => Solid;
        uint IStaticProp.ColorModulation => 0xffffffff;
        float IStaticProp.FadeMinDist => FadeMinDist;
        float IStaticProp.FadeMaxDist => FadeMaxDist;
        float IStaticProp.ForcedFadeScale => ForcedFadeScale;
        Vector3 IStaticProp.LightingOrigin => LightingOrigin;
        float IStaticProp.Scale => 1f;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1, Size = 72)]
    public struct StaticPropV10Bsp20 : IStaticProp
    {
        public readonly Vector3 Origin;
        public readonly Vector3 Angles;
        public readonly ushort PropType;
        public readonly ushort FirstLeaf;
        public readonly ushort LeafCount;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool Solid;
        public readonly StaticPropFlags Flags;
        public readonly int Skin;
        public readonly float FadeMinDist;
        public readonly float FadeMaxDist;
        public readonly Vector3 LightingOrigin;

        public readonly float ForcedFadeScale;

        public readonly byte MinCpuLevel;
        public readonly byte MaxCpuLevel;
        public readonly byte MinGpuLevel;
        public readonly byte MaxGpuLevel;

        public readonly uint ColorModulation;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool DisableX360;

        Vector3 IStaticProp.Origin => Origin;
        Vector3 IStaticProp.Angles => Angles;
        ushort IStaticProp.PropType => PropType;
        int IStaticProp.Skin => Skin;
        ushort IStaticProp.FirstLeaf => FirstLeaf;
        ushort IStaticProp.LeafCount => LeafCount;
        StaticPropFlags IStaticProp.Flags => Flags;
        bool IStaticProp.Solid => Solid;
        uint IStaticProp.ColorModulation => ColorModulation;
        float IStaticProp.FadeMinDist => FadeMinDist;
        float IStaticProp.FadeMaxDist => FadeMaxDist;
        float IStaticProp.ForcedFadeScale => ForcedFadeScale;
        Vector3 IStaticProp.LightingOrigin => LightingOrigin;
        float IStaticProp.Scale => 1f;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1, Size = 76)]
    public struct StaticPropV10Bsp21 : IStaticProp
    {
        public readonly Vector3 Origin;
        public readonly Vector3 Angles;
        public readonly ushort PropType;
        public readonly ushort FirstLeaf;
        public readonly ushort LeafCount;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool Solid;
        public readonly StaticPropFlags Flags;
        public readonly int Skin;
        public readonly float FadeMinDist;
        public readonly float FadeMaxDist;
        public readonly Vector3 LightingOrigin;

        public readonly float ForcedFadeScale;

        public readonly byte MinCpuLevel;
        public readonly byte MaxCpuLevel;
        public readonly byte MinGpuLevel;
        public readonly byte MaxGpuLevel;

        public readonly uint ColorModulation;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool DisableX360;

        Vector3 IStaticProp.Origin => Origin;
        Vector3 IStaticProp.Angles => Angles;
        ushort IStaticProp.PropType => PropType;
        int IStaticProp.Skin => Skin;
        ushort IStaticProp.FirstLeaf => FirstLeaf;
        ushort IStaticProp.LeafCount => LeafCount;
        StaticPropFlags IStaticProp.Flags => Flags;
        bool IStaticProp.Solid => Solid;
        uint IStaticProp.ColorModulation => ColorModulation;
        float IStaticProp.FadeMinDist => FadeMinDist;
        float IStaticProp.FadeMaxDist => FadeMaxDist;
        float IStaticProp.ForcedFadeScale => ForcedFadeScale;
        Vector3 IStaticProp.LightingOrigin => LightingOrigin;
        float IStaticProp.Scale => 1f;
    }

    [StructLayout(LayoutKind.Sequential, Pack = 1, Size = 80)]
    public unsafe struct StaticPropV11 : IStaticProp
    {
        public readonly Vector3 Origin;
        public readonly Vector3 Angles;
        public readonly ushort PropType;
        public readonly ushort FirstLeaf;
        public readonly ushort LeafCount;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool Solid;
        public readonly StaticPropFlags Flags;
        public readonly int Skin;
        public readonly float FadeMinDist;
        public readonly float FadeMaxDist;
        public readonly Vector3 LightingOrigin;

        public readonly float ForcedFadeScale;

        public readonly byte MinCpuLevel;
        public readonly byte MaxCpuLevel;
        public readonly byte MinGpuLevel;
        public readonly byte MaxGpuLevel;

        public readonly uint ColorModulation;
        [MarshalAs(UnmanagedType.U1)]
        public readonly bool DisableX360;
        
        private fixed byte _unknown1[7];

        //[FieldOffset(76)]
        public readonly float Scale;

        Vector3 IStaticProp.Origin => Origin;
        Vector3 IStaticProp.Angles => Angles;
        ushort IStaticProp.PropType => PropType;
        int IStaticProp.Skin => Skin;
        ushort IStaticProp.FirstLeaf => FirstLeaf;
        ushort IStaticProp.LeafCount => LeafCount;
        StaticPropFlags IStaticProp.Flags => Flags;
        bool IStaticProp.Solid => Solid;
        uint IStaticProp.ColorModulation => ColorModulation;
        float IStaticProp.FadeMinDist => FadeMinDist;
        float IStaticProp.FadeMaxDist => FadeMaxDist;
        float IStaticProp.ForcedFadeScale => ForcedFadeScale;
        Vector3 IStaticProp.LightingOrigin => LightingOrigin;
        float IStaticProp.Scale => Scale;
    }

    public class StaticProps
    {
        private readonly ValveBspFile _bspFile;

        private string[] _modelDict;
        private ushort[] _leafDict;
        private IStaticProp[] _props;

        public StaticProps( ValveBspFile bsp )
        {
            _bspFile = bsp;
        }

        public int ModelCount
        {
            get
            {
                EnsureLoaded();
                return _modelDict.Length;
            }
        }

        public int PropCount
        {
            get
            {
                EnsureLoaded();
                return _props.Length;
            }
        }

        public string GetModelName( int modelIndex )
        {
            return _modelDict[modelIndex];
        }

        public void GetPropModelSkin( int propIndex, out int modelIndex, out int skin )
        {
            EnsureLoaded();
            modelIndex = _props[propIndex].PropType;
            skin = _props[propIndex].Skin;
        }

        public IEnumerable<int> GetPropLeaves( int propIndex )
        {
            EnsureLoaded();
            var prop = _props[propIndex];

            for ( var i = prop.FirstLeaf; i < prop.FirstLeaf + prop.LeafCount; ++i )
            {
                yield return _leafDict[i];
            }
        }

        public void GetPropInfo( int propIndex, out StaticPropFlags flags, out bool solid, out uint diffuseModulation )
        {
            EnsureLoaded();

            flags = _props[propIndex].Flags;
            solid = _props[propIndex].Solid;
            diffuseModulation = _props[propIndex].ColorModulation;
        }

        public void GetFadeInfo( int propIndex, out float fadeMin, out float fadeMax, out float fadeScale )
        {
            EnsureLoaded();

            fadeMin = _props[propIndex].FadeMinDist;
            fadeMax = _props[propIndex].FadeMaxDist;
            fadeScale = _props[propIndex].ForcedFadeScale;
        }

        public Vector3 GetLightingOrigin( int propIndex )
        {
            return _props[propIndex].LightingOrigin;
        }

        public void GetPropTransform( int propIndex, out Vector3 origin, out Vector3 angles, out float scale )
        {
            EnsureLoaded();

            var prop = _props[propIndex];

            origin = prop.Origin;
            angles = prop.Angles;
            scale = prop.Scale;
        }

        private void EnsureLoaded()
        {
            lock ( this )
            {
                if ( _props != null ) return;

                const int charBufferSize = 128;

                var version = _bspFile.GameData.GetItemVersion( "sprp" );

                using ( var reader = new BinaryReader( _bspFile.GameData.OpenItem( "sprp" ) ) )
                {
                    var charBuffer = new byte[charBufferSize];

                    _modelDict = new string[reader.ReadInt32()];
                    for ( var i = 0; i < _modelDict.Length; ++i )
                    {
                        reader.BaseStream.Read( charBuffer, 0, charBufferSize );
                        int end;
                        for ( end = 0; end < charBufferSize && charBuffer[end] != 0; ++end ) ;
                        _modelDict[i] = Encoding.ASCII.GetString( charBuffer, 0, end );
                    }

                    var leafCount = reader.ReadInt32();
                    _leafDict = LumpReader<ushort>.ReadLumpFromStream( reader.BaseStream, leafCount );

                    var propCount = reader.ReadInt32();
                    if ( propCount == 0 )
                    {
                        _props = new IStaticProp[0];
                        return;
                    }

                    switch ( version )
                    {
                        case 5:
                            _props = LumpReader<StaticPropV5>.ReadLumpFromStream( reader.BaseStream, propCount )
                                .Cast<IStaticProp>()
                                .ToArray();
                            break;
                        case 6:
                            _props = LumpReader<StaticPropV6>.ReadLumpFromStream( reader.BaseStream, propCount )
                                .Cast<IStaticProp>()
                                .ToArray();
                            break;
                        case 10:
                            if (_bspFile.Version <= 20)
                            {
                                _props = LumpReader<StaticPropV10Bsp20>.ReadLumpFromStream(reader.BaseStream, propCount)
                                    .Cast<IStaticProp>()
                                    .ToArray();
                            }
                            else
                            {
                                _props = LumpReader<StaticPropV10Bsp21>.ReadLumpFromStream(reader.BaseStream, propCount)
                                    .Cast<IStaticProp>()
                                    .ToArray();
                            }
                            break;
                        case 11:
                            _props = LumpReader<StaticPropV11>.ReadLumpFromStream(reader.BaseStream, propCount)
                                .Cast<IStaticProp>()
                                .ToArray();
                            break;

                        default:
#if DEBUG
                            var remaining = reader.BaseStream.Length - reader.BaseStream.Position;
                            var size = (int) (remaining / propCount);

                            const int debugPropCount = 10;
                            const int bytesPerRow = 8;

                            Console.WriteLine($"Static Prop size: {size}");
                            Console.WriteLine($"Printing first {debugPropCount} props");

                            var buffer = new byte[size];
                            for ( var i = 0; i < propCount && i < debugPropCount; ++i )
                            {
                                Console.WriteLine($"Prop {i}:");
                                reader.Read( buffer, 0, size );

                                for ( var j = 0; j < size; j += bytesPerRow)
                                {
                                    Console.WriteLine( $"  0x{j:x4}: {string.Join(" ", buffer.Skip( j ).Take( bytesPerRow ).Select( x => x.ToString( "x2" ) ) )}");
                                }
                            }

#endif
                            throw new NotSupportedException( $"Static prop version {version} is not supported." );
                    }
                }
            }
        }
    }
}
