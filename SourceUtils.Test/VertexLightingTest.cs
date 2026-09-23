using System.IO;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace SourceUtils.Test
{
    [TestClass]
    public class VertexLightingTest
    {
        private const int HeaderSize = 40;
        private const int MeshCountOffset = 20;

        /// <summary>
        /// VRAD writes padded placeholder .vhv files holding no meshes at all for props it
        /// didn't light per vertex.
        /// </summary>
        private static Stream EmptyVhv( int length = 512 )
        {
            var data = new byte[length];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                writer.Write( 2 ); // Version
            }

            return new MemoryStream( data );
        }

        private const int MeshHeaderSize = 28;

        private static Stream VhvWithMeshes( int meshCount )
        {
            var vertOffset = HeaderSize + meshCount * MeshHeaderSize;
            var data = new byte[vertOffset];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                writer.Write( 2 );
                writer.Seek( MeshCountOffset, SeekOrigin.Begin );
                writer.Write( meshCount );
                writer.Seek( HeaderSize, SeekOrigin.Begin );

                for ( var i = 0; i < meshCount; ++i )
                {
                    writer.Write( 0 );           // Lod
                    writer.Write( 0 );           // VertCount
                    writer.Write( vertOffset );  // VertOffset
                    writer.Write( 0 );           // Unused0
                    writer.Write( 0 );           // Unused1
                    writer.Write( 0 );           // Unused2
                    writer.Write( 0 );           // Unused3
                }
            }

            return new MemoryStream( data );
        }

        [TestMethod]
        public void EmptyFileParsesWithNoMeshes()
        {
            using ( var stream = EmptyVhv() )
            {
                var vhv = ValveVertexLightingFile.FromStream( stream );

                Assert.IsNotNull( vhv );
                Assert.AreEqual( 0, vhv.GetMeshCount( 0 ) );
                Assert.AreEqual( 0, vhv.GetMeshCount( 3 ) );
            }
        }

        private static void AssertRejected( byte[] data )
        {
            try
            {
                ValveVertexLightingFile.FromStream( new MemoryStream( data ) );
            }
            catch ( System.NotSupportedException )
            {
                return;
            }

            Assert.Fail( "Expected the file to be rejected as unsupported." );
        }

        /// <summary>
        /// Some maps pack unrelated files under .vhv names. Their headers claim absurd counts,
        /// which used to read past the end of the file or exhaust memory.
        /// </summary>
        [TestMethod]
        public void HeaderClaimingMoreMeshesThanTheFileHoldsIsRejected()
        {
            var data = new byte[512];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                writer.Write( 2 );
                writer.Seek( MeshCountOffset, SeekOrigin.Begin );
                writer.Write( 1634533376 );
            }

            AssertRejected( data );
        }

        [TestMethod]
        public void MeshPointingOutsideTheFileIsRejected()
        {
            var vertOffset = HeaderSize + MeshHeaderSize;
            var data = new byte[vertOffset + 16];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                writer.Write( 2 );
                writer.Seek( MeshCountOffset, SeekOrigin.Begin );
                writer.Write( 1 );
                writer.Seek( HeaderSize, SeekOrigin.Begin );
                writer.Write( 0 );          // Lod
                writer.Write( 1000000 );    // VertCount, way past the end
                writer.Write( vertOffset ); // VertOffset
            }

            AssertRejected( data );
        }

        [TestMethod]
        public void AbsurdLodIsRejected()
        {
            var vertOffset = HeaderSize + MeshHeaderSize;
            var data = new byte[vertOffset];

            using ( var writer = new BinaryWriter( new MemoryStream( data ) ) )
            {
                writer.Write( 2 );
                writer.Seek( MeshCountOffset, SeekOrigin.Begin );
                writer.Write( 1 );
                writer.Seek( HeaderSize, SeekOrigin.Begin );
                writer.Write( 1634533376 ); // Lod
                writer.Write( 0 );          // VertCount
                writer.Write( vertOffset ); // VertOffset
            }

            AssertRejected( data );
        }

        [TestMethod]
        public void FileWithMeshesReportsThem()
        {
            using ( var stream = VhvWithMeshes( 2 ) )
            {
                var vhv = ValveVertexLightingFile.FromStream( stream );

                Assert.AreEqual( 2, vhv.GetMeshCount( 0 ) );
                Assert.AreEqual( 0, vhv.GetMeshCount( 1 ) );
            }
        }
    }
}
