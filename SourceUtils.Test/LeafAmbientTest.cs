using System;
using System.IO;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace SourceUtils.Test
{
    using LumpType = ValveBspFile.LumpType;

    /// <summary>
    /// Maps compiled by pre-Orange Box tools store one ambient cube per leaf and write no leaf
    /// ambient index lump at all. These tests build minimal BSP files covering both layouts.
    /// </summary>
    [TestClass]
    public class LeafAmbientTest
    {
        private const int LeafSize = 32;
        private const int CubeSize = 24;
        private const int SampleSize = 28;
        private const int IndexSize = 4;

        private static byte[] Leaves( int count )
        {
            var data = new byte[count * LeafSize];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                for ( var i = 0; i < count; ++i )
                {
                    writer.Write( 0 );                    // Contents
                    writer.Write( (short) i );            // Cluster
                    writer.Write( (short) 0 );            // AreaFlags
                    writer.Write( (short) (i * 10) );     // Min.X
                    writer.Write( (short) 0 );            // Min.Y
                    writer.Write( (short) 0 );            // Min.Z
                    writer.Write( (short) (i * 10 + 8) ); // Max.X
                    writer.Write( (short) 8 );            // Max.Y
                    writer.Write( (short) 8 );            // Max.Z
                    writer.Write( (ushort) 0 );           // FirstLeafFace
                    writer.Write( (ushort) 0 );           // NumLeafFaces
                    writer.Write( (ushort) 0 );           // FirstLeafBrush
                    writer.Write( (ushort) 0 );           // NumLeafBrushes
                    writer.Write( (short) -1 );           // LeafWaterDataId
                    writer.Write( (short) 0 );            // Padding
                }
            }

            return data;
        }

        /// <summary>Red channel of face 0 identifies each cube.</summary>
        private static void WriteCube( BinaryWriter writer, byte id )
        {
            writer.Write( id );
            writer.Write( (byte) 0 );
            writer.Write( (byte) 0 );
            writer.Write( (byte) 0 );

            for ( var face = 1; face < 6; ++face ) writer.Write( new byte[4] );
        }

        private static byte[] LegacyAmbient( int leafCount )
        {
            var data = new byte[leafCount * CubeSize];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                for ( var i = 0; i < leafCount; ++i ) WriteCube( writer, (byte) (i + 1) );
            }

            return data;
        }

        private static byte[] IndexedAmbient( params byte[] ids )
        {
            var data = new byte[ids.Length * SampleSize];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                foreach ( var id in ids )
                {
                    WriteCube( writer, id );
                    writer.Write( (byte) (id * 2) ); // X
                    writer.Write( (byte) 0 );        // Y
                    writer.Write( (byte) 0 );        // Z
                    writer.Write( (byte) 0 );        // Padding
                }
            }

            return data;
        }

        private static byte[] AmbientIndices( params int[] countsAndFirsts )
        {
            var data = new byte[countsAndFirsts.Length / 2 * IndexSize];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                for ( var i = 0; i < countsAndFirsts.Length; i += 2 )
                {
                    writer.Write( (ushort) countsAndFirsts[i] );
                    writer.Write( (ushort) countsAndFirsts[i + 1] );
                }
            }

            return data;
        }

        private static void WithBsp( BspBuilder builder, Action<ValveBspFile> action )
        {
            builder.With( action );
        }

        [TestMethod]
        public void LegacyLayoutGivesOneCentredSamplePerLeaf()
        {
            var ambient = LegacyAmbient( 3 );

            // Pre-Orange Box tools write the lump length into the version field as well.
            var builder = new BspBuilder()
                .Lump( LumpType.LEAFS, Leaves( 3 ), 1 )
                .Lump( LumpType.LEAF_AMBIENT_LIGHTING, ambient, ambient.Length );

            WithBsp( builder, bsp =>
            {
                Assert.AreEqual( 3, bsp.Leaves.Length );

                for ( var leaf = 0; leaf < 3; ++leaf )
                {
                    Assert.AreEqual( 1, bsp.GetLeafAmbientSampleCount( leaf ), $"leaf {leaf}" );

                    var sample = bsp.GetLeafAmbientSample( leaf, 0 );

                    Assert.AreEqual( leaf + 1, sample.Cube[0].R, $"leaf {leaf} cube" );
                    Assert.AreEqual( 128, sample.X, $"leaf {leaf} x" );
                    Assert.AreEqual( 128, sample.Y, $"leaf {leaf} y" );
                    Assert.AreEqual( 128, sample.Z, $"leaf {leaf} z" );
                }
            } );
        }

        [TestMethod]
        public void IndexedLayoutReadsSamplesThroughTheIndex()
        {
            var builder = new BspBuilder()
                .Lump( LumpType.LEAFS, Leaves( 3 ), 1 )
                .Lump( LumpType.LEAF_AMBIENT_INDEX, AmbientIndices( 0, 0, 2, 0, 1, 2 ) )
                .Lump( LumpType.LEAF_AMBIENT_LIGHTING, IndexedAmbient( 10, 20, 30 ), 1 );

            WithBsp( builder, bsp =>
            {
                Assert.AreEqual( 0, bsp.GetLeafAmbientSampleCount( 0 ) );
                Assert.AreEqual( 2, bsp.GetLeafAmbientSampleCount( 1 ) );
                Assert.AreEqual( 1, bsp.GetLeafAmbientSampleCount( 2 ) );

                Assert.AreEqual( 10, bsp.GetLeafAmbientSample( 1, 0 ).Cube[0].R );
                Assert.AreEqual( 20, bsp.GetLeafAmbientSample( 1, 1 ).Cube[0].R );
                Assert.AreEqual( 30, bsp.GetLeafAmbientSample( 2, 0 ).Cube[0].R );

                // Indexed samples keep their own position within the leaf.
                Assert.AreEqual( 40, bsp.GetLeafAmbientSample( 1, 1 ).X );
            } );
        }

        [TestMethod]
        public void MissingAmbientLumpsGiveNoSamples()
        {
            var builder = new BspBuilder()
                .Lump( LumpType.LEAFS, Leaves( 3 ), 1 );

            WithBsp( builder, bsp =>
            {
                for ( var leaf = 0; leaf < 3; ++leaf )
                {
                    Assert.AreEqual( 0, bsp.GetLeafAmbientSampleCount( leaf ), $"leaf {leaf}" );
                }
            } );
        }

        [TestMethod]
        public void AmbientLumpWithoutOnePerLeafIsIgnored()
        {
            // An index-less ambient lump that isn't one cube per leaf can't be mapped to leaves.
            var ambient = LegacyAmbient( 2 );

            var builder = new BspBuilder()
                .Lump( LumpType.LEAFS, Leaves( 3 ), 1 )
                .Lump( LumpType.LEAF_AMBIENT_LIGHTING, ambient, ambient.Length );

            WithBsp( builder, bsp =>
            {
                for ( var leaf = 0; leaf < 3; ++leaf )
                {
                    Assert.AreEqual( 0, bsp.GetLeafAmbientSampleCount( leaf ), $"leaf {leaf}" );
                }
            } );
        }
    }
}
