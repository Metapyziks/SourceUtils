using System;
using SourceUtils.ValveBsp;

namespace SourceUtils
{
    partial class ValveBspFile
    {
        /// <summary>
        /// Centre of a leaf's bounds, where the single sample of a legacy ambient lump sits.
        /// </summary>
        private const byte LegacyAmbientPosition = 128;

        /// <summary>
        /// The same lump as <see cref="LeafAmbientLighting"/>, read as the legacy layout of one
        /// bare cube per leaf.
        /// </summary>
        [BspLump( LumpType.LEAF_AMBIENT_LIGHTING )]
        public StructArrayLump<CompressedLightCube> LeafAmbientCubes { get; private set; }

        [BspLump( LumpType.LEAF_AMBIENT_LIGHTING_HDR )]
        public StructArrayLump<CompressedLightCube> LeafAmbientCubesHdr { get; private set; }

        private bool UseHdrAmbient => LeafAmbientLightingHdr.Length > LeafAmbientLighting.Length;

        /// <summary>
        /// Maps compiled before the Orange Box store one ambient cube per leaf and write no
        /// index lump. They also write the lump length into its version field, so the layout has
        /// to be recognised by size rather than by version.
        /// </summary>
        private bool IsLegacyLeafAmbient
        {
            get
            {
                var indices = UseHdrAmbient ? LeafAmbientIndicesHdr : LeafAmbientIndices;
                var cubes = UseHdrAmbient ? LeafAmbientCubesHdr : LeafAmbientCubes;

                return Leaves.Length > 0 && indices.Length == 0 && cubes.Length == Leaves.Length;
            }
        }

        /// <summary>
        /// Number of ambient light samples stored for the given leaf, which is 0 when the map
        /// has no usable ambient lighting at all.
        /// </summary>
        public int GetLeafAmbientSampleCount( int leafIndex )
        {
            if ( leafIndex < 0 || leafIndex >= Leaves.Length ) return 0;
            if ( IsLegacyLeafAmbient ) return 1;

            var indices = UseHdrAmbient ? LeafAmbientIndicesHdr : LeafAmbientIndices;

            return leafIndex >= indices.Length ? 0 : indices[leafIndex].AmbientSampleCount;
        }

        public LeafAmbientLighting GetLeafAmbientSample( int leafIndex, int sampleIndex )
        {
            var count = GetLeafAmbientSampleCount( leafIndex );

            if ( sampleIndex < 0 || sampleIndex >= count )
            {
                throw new IndexOutOfRangeException(
                    $"Leaf {leafIndex} has {count} ambient samples, so {sampleIndex} is out of range." );
            }

            if ( IsLegacyLeafAmbient )
            {
                var cubes = UseHdrAmbient ? LeafAmbientCubesHdr : LeafAmbientCubes;

                return new LeafAmbientLighting( cubes[leafIndex],
                    LegacyAmbientPosition, LegacyAmbientPosition, LegacyAmbientPosition );
            }

            var indices = UseHdrAmbient ? LeafAmbientIndicesHdr : LeafAmbientIndices;
            var samples = UseHdrAmbient ? LeafAmbientLightingHdr : LeafAmbientLighting;

            var first = indices[leafIndex].FirstAmbientSample + sampleIndex;

            return first >= samples.Length ? default( LeafAmbientLighting ) : samples[first];
        }
    }
}
