using System;
using System.IO;
using System.Text;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using SourceUtils.ValveBsp;

namespace SourceUtils.Test
{
    using LumpType = ValveBspFile.LumpType;

    /// <summary>
    /// Named lights are compiled into their own light styles, which VRAD stores as extra
    /// lightmap pages after a face's style 0 page. The engine adds together every style that
    /// is switched on, so these tests check the pages are combined the same way.
    /// </summary>
    [TestClass]
    public class LightStyleTest
    {
        private const int TexInfoSize = 72;
        private const int FaceSize = 56;
        private const int SampleSize = 4;

        private const int FaceWidth = 2;
        private const int FaceHeight = 1;
        private const int SampleCount = FaceWidth * FaceHeight;

        private static byte[] TexInfos( params SurfFlags[] flags )
        {
            var data = new byte[flags.Length * TexInfoSize];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                foreach ( var flag in flags )
                {
                    writer.Write( new byte[64] ); // Texture and lightmap axes
                    writer.Write( (int) flag );
                    writer.Write( 0 );            // TexData
                }
            }

            return data;
        }

        private static byte[] Face( int texInfo, int lightOffset, params byte[] styles )
        {
            var packedStyles = new byte[] { 255, 255, 255, 255 };
            Array.Copy( styles, packedStyles, styles.Length );

            var data = new byte[FaceSize];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                writer.Write( (ushort) 0 );          // PlaneNum
                writer.Write( (byte) 0 );            // Side
                writer.Write( (byte) 0 );            // OnNode
                writer.Write( 0 );                   // FirstEdge
                writer.Write( (short) 0 );           // NumEdges
                writer.Write( (short) texInfo );
                writer.Write( (short) -1 );          // DispInfo
                writer.Write( (short) 0 );           // FogVolumeId
                writer.Write( packedStyles );
                writer.Write( lightOffset );
                writer.Write( 0f );                  // Area
                writer.Write( 0 );                   // LightMapOffsetX
                writer.Write( 0 );                   // LightMapOffsetY
                writer.Write( FaceWidth - 1 );       // LightMapSizeX
                writer.Write( FaceHeight - 1 );      // LightMapSizeY
                writer.Write( 0 );                   // OriginalFace
                writer.Write( (ushort) 0 );          // NumPrimitives
                writer.Write( (ushort) 0 );          // FirstPrimitive
                writer.Write( 0u );                  // SmoothingGroups
            }

            return data;
        }

        /// <summary>One page holds a sample per luxel, all with the same colour here.</summary>
        private static byte[] Page( byte r, byte g, byte b, sbyte exponent )
        {
            var data = new byte[SampleCount * SampleSize];

            for ( var i = 0; i < SampleCount; ++i )
            {
                data[i * SampleSize + 0] = r;
                data[i * SampleSize + 1] = g;
                data[i * SampleSize + 2] = b;
                data[i * SampleSize + 3] = (byte) exponent;
            }

            return data;
        }

        private static byte[] Concat( params byte[][] parts )
        {
            using ( var stream = new MemoryStream() )
            {
                foreach ( var part in parts ) stream.Write( part, 0, part.Length );
                return stream.ToArray();
            }
        }

        private static byte[] Entities( params string[] entities )
        {
            return Encoding.ASCII.GetBytes( string.Concat( entities ) + "\0" );
        }

        private static string Light( int style, int spawnFlags )
        {
            return "{\n\"classname\" \"light\"\n\"targetname\" \"lamp\"\n"
                + $"\"style\" \"{style}\"\n\"spawnflags\" \"{spawnFlags}\"\n}}\n";
        }

        private static ColorRGBExp32[] ReadFace( ValveBspFile bsp )
        {
            var output = new ColorRGBExp32[SampleCount];

            using ( var lighting = bsp.GetLumpStream( LumpType.LIGHTING ) )
            {
                bsp.ReadLightmapSamples( lighting, bsp.Faces[0], output );
            }

            return output;
        }

        private static void AssertLinear( float r, float g, float b, ColorRGBExp32 sample )
        {
            var scale = (float) Math.Pow( 2, sample.Exponent );

            // Re-encoding keeps 8 bits of precision on the brightest channel.
            var tolerance = Math.Max( Math.Max( r, g ), b ) / 128f;

            Assert.AreEqual( r, sample.R * scale, tolerance, "red" );
            Assert.AreEqual( g, sample.G * scale, tolerance, "green" );
            Assert.AreEqual( b, sample.B * scale, tolerance, "blue" );
        }

        private static BspBuilder Map( SurfFlags flags, byte[] face, byte[] lighting, params string[] entities )
        {
            return new BspBuilder()
                .Lump( LumpType.ENTITIES, Entities( entities ) )
                .Lump( LumpType.TEXINFO, TexInfos( flags ) )
                .Lump( LumpType.FACES, face, 1 )
                .Lump( LumpType.LIGHTING, lighting, 1 );
        }

        [TestMethod]
        public void SwitchedOnStyleIsAddedToStyleZero()
        {
            var lighting = Concat( Page( 10, 20, 30, 0 ), Page( 100, 50, 0, 0 ) );

            Map( 0, Face( 0, 0, 0, 32 ), lighting, Light( 32, 0 ) ).With( bsp =>
            {
                foreach ( var sample in ReadFace( bsp ) ) AssertLinear( 110, 70, 30, sample );
            } );
        }

        [TestMethod]
        public void StylesWithDifferentExponentsAreAddedInLinearSpace()
        {
            // 64 * 2^-6 = 1 and 16 * 2^2 = 64.
            var lighting = Concat( Page( 64, 64, 64, -6 ), Page( 16, 0, 0, 2 ) );

            Map( 0, Face( 0, 0, 0, 32 ), lighting, Light( 32, 0 ) ).With( bsp =>
            {
                foreach ( var sample in ReadFace( bsp ) ) AssertLinear( 65, 1, 1, sample );
            } );
        }

        [TestMethod]
        public void InitiallyDarkStyleIsLeftOut()
        {
            var lighting = Concat( Page( 10, 20, 30, 0 ), Page( 100, 50, 0, 0 ) );

            Map( 0, Face( 0, 0, 0, 32 ), lighting, Light( 32, 1 ) ).With( bsp =>
            {
                foreach ( var sample in ReadFace( bsp ) )
                {
                    Assert.AreEqual( 10, sample.R );
                    Assert.AreEqual( 20, sample.G );
                    Assert.AreEqual( 30, sample.B );
                    Assert.AreEqual( 0, sample.Exponent );
                }
            } );
        }

        [TestMethod]
        public void BumpedFacesStoreFourPagesPerStyle()
        {
            // Pages 1 to 3 of each style hold the bump directions, which must be skipped.
            var bump = Page( 200, 200, 200, 3 );
            var lighting = Concat(
                Page( 10, 20, 30, 0 ), bump, bump, bump,
                Page( 100, 50, 0, 0 ), bump, bump, bump );

            Map( SurfFlags.BUMPLIGHT, Face( 0, 0, 0, 32 ), lighting, Light( 32, 0 ) ).With( bsp =>
            {
                foreach ( var sample in ReadFace( bsp ) ) AssertLinear( 110, 70, 30, sample );
            } );
        }

        [TestMethod]
        public void SingleStyleIsCopiedUnchanged()
        {
            // Exponents outside what re-encoding would produce must survive untouched.
            var lighting = Page( 3, 5, 7, -20 );

            Map( 0, Face( 0, 0, 0 ), lighting ).With( bsp =>
            {
                foreach ( var sample in ReadFace( bsp ) )
                {
                    Assert.AreEqual( 3, sample.R );
                    Assert.AreEqual( 5, sample.G );
                    Assert.AreEqual( 7, sample.B );
                    Assert.AreEqual( -20, sample.Exponent );
                }
            } );
        }

        [TestMethod]
        public void MapWithoutLightingIsFullbright()
        {
            // Maps compiled without VRAD have no lighting at all but still list style 0 in
            // every slot. The engine draws them fully lit.
            Map( 0, Face( 0, 0, 0, 0, 0, 0 ), new byte[0] ).With( bsp =>
            {
                foreach ( var sample in ReadFace( bsp ) )
                {
                    Assert.AreEqual( 255, sample.R );
                    Assert.AreEqual( 255, sample.G );
                    Assert.AreEqual( 255, sample.B );
                    Assert.AreEqual( 0, sample.Exponent );
                }
            } );
        }

        [TestMethod]
        public void StylesWithoutDataAreIgnored()
        {
            // Only the pages that fit inside the lump are added together.
            var lighting = Concat( Page( 10, 20, 30, 0 ), Page( 100, 50, 0, 0 ) );

            Map( 0, Face( 0, 0, 0, 32, 33 ), lighting, Light( 32, 0 ), Light( 33, 0 ) ).With( bsp =>
            {
                foreach ( var sample in ReadFace( bsp ) ) AssertLinear( 110, 70, 30, sample );
            } );
        }

        [TestMethod]
        public void LightStylesDefaultToOn()
        {
            Map( 0, Face( 0, 0, 0 ), Page( 0, 0, 0, 0 ), Light( 32, 0 ), Light( 33, 1 ) ).With( bsp =>
            {
                Assert.IsTrue( bsp.IsLightStyleOnByDefault( 0 ), "style 0" );
                Assert.IsTrue( bsp.IsLightStyleOnByDefault( 5 ), "built-in animated style" );
                Assert.IsTrue( bsp.IsLightStyleOnByDefault( 32 ), "named light that starts on" );
                Assert.IsFalse( bsp.IsLightStyleOnByDefault( 33 ), "named light that starts dark" );
                Assert.IsTrue( bsp.IsLightStyleOnByDefault( 34 ), "style with no light entity" );
                Assert.IsFalse( bsp.IsLightStyleOnByDefault( 255 ), "unused style slot" );
            } );
        }
    }
}
