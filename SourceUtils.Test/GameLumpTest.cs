using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace SourceUtils.Test
{
    [TestClass]
    public class GameLumpTest
    {
        private const int Sprp = 0x73707270;
        private const int Dprp = 0x64707270;

        [TestMethod]
        public void CompressedGameLumpIgnoresFinalSentinelWhenReadingItemVersion()
        {
            WithGameLump( new[] { Sprp, Dprp, 0 }, bsp =>
            {
                Assert.AreEqual( (ushort) 10, bsp.GameData.GetItemVersion( "sprp" ) );
                Assert.AreEqual( (ushort) 10, bsp.GameData.GetItemVersion( "dprp" ) );
            } );
        }

        [TestMethod]
        public void CompressedGameLumpStopsAtFirstZeroIdEntry()
        {
            WithGameLump( new[] { Sprp, Dprp, 0, 0, 0 }, bsp =>
            {
                Assert.AreEqual( (ushort) 10, bsp.GameData.GetItemVersion( "sprp" ) );
                Assert.AreEqual( (ushort) 10, bsp.GameData.GetItemVersion( "dprp" ) );
                Assert.ThrowsExactly<KeyNotFoundException>( () => bsp.GameData.GetItemVersion( "" ) );
            } );
        }

        private static void WithGameLump( int[] itemIds, Action<ValveBspFile> action )
        {
            var path = Path.Combine( Path.GetTempPath(), $"sourceutils-gamelump-{Guid.NewGuid():N}.bsp" );

            try
            {
                const int gameLumpOffset = 8 + 64 * 16 + 4;
                const int gameLumpIndex = 35;
                const int itemSize = 16;

                var gameLumpLength = 4 + itemIds.Length * itemSize;
                var data = new byte[gameLumpOffset + gameLumpLength];

                Buffer.BlockCopy( BitConverter.GetBytes( gameLumpOffset ), 0, data, 8 + gameLumpIndex * 16, 4 );
                Buffer.BlockCopy( BitConverter.GetBytes( gameLumpLength ), 0, data, 8 + gameLumpIndex * 16 + 4, 4 );
                Buffer.BlockCopy( BitConverter.GetBytes( itemIds.Length ), 0, data, gameLumpOffset, 4 );

                for ( var i = 0; i < itemIds.Length; i++ )
                {
                    var itemOffset = gameLumpOffset + 4 + i * itemSize;
                    Buffer.BlockCopy( BitConverter.GetBytes( itemIds[i] ), 0, data, itemOffset, 4 );
                    Buffer.BlockCopy( BitConverter.GetBytes( (ushort) 10 ), 0, data, itemOffset + 6, 2 ); // version
                }

                File.WriteAllBytes( path, data );

                using ( var bsp = new ValveBspFile( path ) )
                {
                    action( bsp );
                }
            }
            finally
            {
                if ( File.Exists( path ) ) File.Delete( path );
            }
        }
    }
}
