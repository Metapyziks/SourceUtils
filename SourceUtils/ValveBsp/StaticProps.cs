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

    [StructLayout(LayoutKind.Sequential, Pack = 1, Size = 76)]
    public struct StaticProp
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
    }

    public class StaticProps
    {
        private readonly ValveBspFile _bspFile;

        private string[] _modelDict;
        private ushort[] _leafDict;
        private StaticProp[] _props;

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

        public void GetPropTransform( int propIndex, out Vector3 origin, out Vector3 angles )
        {
            EnsureLoaded();

            origin = _props[propIndex].Origin;
            angles = _props[propIndex].Angles;
        }

        private void EnsureLoaded()
        {
            lock ( this )
            {
                if ( _props != null ) return;

                const int charBufferSize = 128;

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
                    _props = LumpReader<StaticProp>.ReadLumpFromStream( reader.BaseStream, propCount );
                }
            }
        }
    }
}
