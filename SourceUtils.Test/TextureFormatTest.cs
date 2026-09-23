using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace SourceUtils.Test
{
    [TestClass]
    public class TextureFormatTest
    {
        private const int Width = 64;
        private const int Height = 32;

        private static int SizeOf( TextureFormat format )
        {
            return ValveTextureFile.GetImageDataSize( Width, Height, 1, 1, format );
        }

        [TestMethod]
        public void SingleChannelFormatsAreOneBytePerPixel()
        {
            Assert.AreEqual( Width * Height, SizeOf( TextureFormat.A8 ) );
            Assert.AreEqual( Width * Height, SizeOf( TextureFormat.I8 ) );
        }

        [TestMethod]
        public void PackedSixteenBitFormatsAreTwoBytesPerPixel()
        {
            Assert.AreEqual( Width * Height * 2, SizeOf( TextureFormat.BGRA4444 ) );
            Assert.AreEqual( Width * Height * 2, SizeOf( TextureFormat.BGR565 ) );
            Assert.AreEqual( Width * Height * 2, SizeOf( TextureFormat.IA88 ) );
        }

        [TestMethod]
        public void FullColourFormatsKeepTheirWidths()
        {
            Assert.AreEqual( Width * Height * 3, SizeOf( TextureFormat.BGR888 ) );
            Assert.AreEqual( Width * Height * 4, SizeOf( TextureFormat.BGRA8888 ) );
            Assert.AreEqual( Width * Height * 8, SizeOf( TextureFormat.RGBA16161616F ) );
        }
    }
}
