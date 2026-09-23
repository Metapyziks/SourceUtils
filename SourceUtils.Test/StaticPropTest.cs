using System;
using System.IO;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using SourceUtils.ValveBsp;

namespace SourceUtils.Test
{
    using LumpType = ValveBspFile.LumpType;

    [TestClass]
    public class StaticPropTest
    {
        private const int Sprp = 0x73707270;

        /// <summary>
        /// Offset of the game lump's data within a file written by <see cref="BspBuilder"/>,
        /// which puts the first lump straight after the header.
        /// </summary>
        private const int GameLumpOffset = 8 + 64 * 16 + 4;

        /// <summary>
        /// Version 10 props in a version 20 BSP hold a second flags field where later layouts
        /// keep a diffuse colour, so reading one as a colour modulates the prop towards black.
        /// </summary>
        [TestMethod]
        public void V10Bsp20PropsAreNotColourModulated()
        {
            const uint noPerTexelLighting = 0x100;

            WithStaticProp( noPerTexelLighting, bsp =>
            {
                StaticPropFlags flags;
                bool solid;
                uint diffuseModulation;

                bsp.StaticProps.GetPropInfo( 0, out flags, out solid, out diffuseModulation );

                Assert.AreEqual( 0xffffffff, diffuseModulation );
            } );
        }

        /// <summary>
        /// Guards the fields either side of the flags against being shifted along to make the
        /// colour read give the right answer.
        /// </summary>
        [TestMethod]
        public void V10Bsp20PropsKeepTheirTransform()
        {
            WithStaticProp( 0x100, bsp =>
            {
                Vector3 origin;
                Vector3 angles;
                float scale;

                bsp.StaticProps.GetPropTransform( 0, out origin, out angles, out scale );

                Assert.AreEqual( -14592f, origin.X );
                Assert.AreEqual( 7904f, origin.Z );
                Assert.AreEqual( 180f, angles.Y );
            } );
        }

        /// <summary>
        /// Writes a BSP holding a single version 10 static prop, with <paramref name="flagsEx"/>
        /// in the four bytes that follow the CPU and GPU levels.
        /// </summary>
        private static void WithStaticProp( uint flagsEx, Action<ValveBspFile> action )
        {
            const int propSize = 72;

            byte[] sprp;

            using ( var stream = new MemoryStream() )
            using ( var writer = new BinaryWriter( stream ) )
            {
                writer.Write( 1 ); // Model dictionary entries
                var name = new byte[128];
                Buffer.BlockCopy( System.Text.Encoding.ASCII.GetBytes( "models/test/prop.mdl" ), 0, name, 0, 20 );
                writer.Write( name );

                writer.Write( 0 ); // Leaf entries
                writer.Write( 1 ); // Props

                var prop = new byte[propSize];

                Buffer.BlockCopy( BitConverter.GetBytes( -14592f ), 0, prop, 0, 4 ); // Origin
                Buffer.BlockCopy( BitConverter.GetBytes( 7904f ), 0, prop, 8, 4 );
                Buffer.BlockCopy( BitConverter.GetBytes( 180f ), 0, prop, 16, 4 ); // Angles
                prop[30] = 6; // Solid
                Buffer.BlockCopy( BitConverter.GetBytes( 1f ), 0, prop, 56, 4 ); // ForcedFadeScale
                Buffer.BlockCopy( BitConverter.GetBytes( flagsEx ), 0, prop, 64, 4 );

                writer.Write( prop );

                sprp = stream.ToArray();
            }

            byte[] gameLump;

            using ( var stream = new MemoryStream() )
            using ( var writer = new BinaryWriter( stream ) )
            {
                writer.Write( 1 ); // Game lump items
                writer.Write( Sprp );
                writer.Write( (ushort) 0 ); // Flags
                writer.Write( (ushort) 10 ); // Version
                writer.Write( GameLumpOffset + 4 + 16 ); // Offset of the sprp data
                writer.Write( sprp.Length );
                writer.Write( sprp );

                gameLump = stream.ToArray();
            }

            new BspBuilder()
                .Lump( LumpType.GAME_LUMP, gameLump )
                .With( action );
        }
    }
}
