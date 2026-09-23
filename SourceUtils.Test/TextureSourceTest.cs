using System.IO;
using System.Text;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using SourceUtils.WebExport;

namespace SourceUtils.Test
{
    [TestClass]
    public class TextureSourceTest
    {
        private const string Hash = "0123456789abcdef";

        [TestMethod]
        public void NormalizePathAddsPrefixAndExtension()
        {
            Assert.AreEqual( "materials/concrete/wall.vtf", TextureSource.NormalizePath( "concrete/wall" ) );
        }

        [TestMethod]
        public void NormalizePathFixesSlashesAndCase()
        {
            Assert.AreEqual( "materials/concrete/wall.vtf", TextureSource.NormalizePath( "/Materials\\Concrete//Wall.VTF" ) );
        }

        [TestMethod]
        public void NormalizePathIsIdempotent()
        {
            const string path = "materials/skybox/sky_bk.vtf";
            Assert.AreEqual( path, TextureSource.NormalizePath( path ) );
        }

        [TestMethod]
        public void ComputeHashIsSixteenLowerHexChars()
        {
            using ( var stream = new MemoryStream( Encoding.ASCII.GetBytes( "VTF\0hello" ) ) )
            {
                var hash = TextureSource.ComputeHash( stream );
                Assert.AreEqual( 16, hash.Length );
                StringAssert.Matches( hash, new System.Text.RegularExpressions.Regex( "^[0-9a-f]{16}$" ) );
            }
        }

        [TestMethod]
        public void ComputeHashIsStableAndContentSensitive()
        {
            string HashOf( string content )
            {
                using ( var stream = new MemoryStream( Encoding.ASCII.GetBytes( content ) ) )
                {
                    return TextureSource.ComputeHash( stream );
                }
            }

            Assert.AreEqual( HashOf( "abc" ), HashOf( "abc" ) );
            Assert.AreNotEqual( HashOf( "abc" ), HashOf( "abd" ) );
        }

        [TestMethod]
        public void BuildUrlImage()
        {
            Assert.AreEqual( "/materials/concrete/wall.vtf/0123456789abcdef/mip0.png", TextureSource.BuildUrl( "materials/concrete/wall.vtf", Hash, "mip0.png" ) );
        }

        [TestMethod]
        public void BuildUrlInfo()
        {
            Assert.AreEqual( "/materials/skybox/sky_bk.vtf/0123456789abcdef.vtf.json", TextureSource.BuildUrl( "materials/skybox/sky_bk.vtf", Hash, null ) );
        }

        [TestMethod]
        public void BuildUrlMissing()
        {
            Assert.AreEqual( "/materials/concrete/wall.vtf.json", TextureSource.BuildUrl( "materials/concrete/wall.vtf", null, null ) );
        }

        private static void AssertRoundTrip( string path, string hash, string file )
        {
            var url = TextureSource.BuildUrl( path, hash, file );
            Assert.IsTrue( TextureSource.TryParseUrl( url, out var parsedPath, out var parsedHash, out var parsedFile ), url );
            Assert.AreEqual( path, parsedPath, url );
            Assert.AreEqual( hash, parsedHash, url );
            Assert.AreEqual( file, parsedFile, url );
        }

        [TestMethod]
        public void RoundTripImage()
        {
            AssertRoundTrip( "materials/concrete/wall.vtf", Hash, "mip0.png" );
        }

        [TestMethod]
        public void RoundTripFrameFaceImage()
        {
            AssertRoundTrip( "materials/water/anim.vtf", Hash, "mip2.frame3.face1.png" );
        }

        [TestMethod]
        public void RoundTripInfo()
        {
            AssertRoundTrip( "materials/skybox/sky_bk.vtf", Hash, null );
        }

        [TestMethod]
        public void RoundTripMissing()
        {
            AssertRoundTrip( "materials/concrete/wall.vtf", null, null );
        }

        [TestMethod]
        public void ParseUnescapesEncodedPath()
        {
            Assert.IsTrue( TextureSource.TryParseUrl( "/materials/my%20dir/wall.vtf/0123456789abcdef/mip0.png", out var path, out var hash, out var file ) );
            Assert.AreEqual( "materials/my dir/wall.vtf", path );
            Assert.AreEqual( Hash, hash );
            Assert.AreEqual( "mip0.png", file );
        }

        [TestMethod]
        public void ParseUsesRightmostVtfSegment()
        {
            Assert.IsTrue( TextureSource.TryParseUrl( "/materials/dir.vtf/inner/wall.vtf/0123456789abcdef/mip0.png",
                out var path, out var hash, out var file ) );
            Assert.AreEqual( "materials/dir.vtf/inner/wall.vtf", path );
            Assert.AreEqual( Hash, hash );
            Assert.AreEqual( "mip0.png", file );
        }

        [TestMethod]
        public void ParseRejectsDecodedTraversal()
        {
            Assert.IsFalse( TextureSource.TryParseUrl( "/materials/concrete%2f..%2fsecret.vtf/0123456789abcdef/mip0.png",
                out _, out _, out _ ) );
            Assert.IsNull( TextureSource.NormalizePath( "materials\\concrete\\..\\secret" ) );
        }

        [TestMethod]
        public void ParseRejectsOutsideMaterials()
        {
            Assert.IsFalse( TextureSource.TryParseUrl( "/maps/surf_x/materials/wall.vtf/0123456789abcdef/mip0.png", out _, out _, out _ ) );
        }

        [TestMethod]
        public void ParseRejectsNoVtfSegment()
        {
            Assert.IsFalse( TextureSource.TryParseUrl( "/materials/concrete/wall.vmt.json", out _, out _, out _ ) );
        }

        [TestMethod]
        public void ParseRejectsBadHash()
        {
            Assert.IsFalse( TextureSource.TryParseUrl( "/materials/concrete/wall.vtf/NOTAHASH/mip0.png", out _, out _, out _ ) );
        }

        [TestMethod]
        public void ParseRejectsNestedFile()
        {
            Assert.IsFalse( TextureSource.TryParseUrl( "/materials/concrete/wall.vtf/0123456789abcdef/a/mip0.png", out _, out _, out _ ) );
        }

        [TestMethod]
        public void MaterialUrlCoversEveryFormUnderTheMaterialsFolder()
        {
            Assert.IsTrue( TextureSource.IsMaterialUrl( TextureSource.BuildUrl( "materials/water/anim.vtf", Hash, null ) ) );
            Assert.IsTrue( TextureSource.IsMaterialUrl( TextureSource.BuildUrl( "materials/water/anim.vtf", Hash, "mip0.png" ) ) );
            Assert.IsTrue( TextureSource.IsMaterialUrl( TextureSource.BuildUrl( "materials/water/anim.vtf", null, null ) ) );
        }

        [TestMethod]
        public void MaterialUrlExcludesMapsAndStaticFiles()
        {
            Assert.IsFalse( TextureSource.IsMaterialUrl( "/maps/surf_x/materials/matpage0.json" ) );
            Assert.IsFalse( TextureSource.IsMaterialUrl( "/maps/surf_x/index.html" ) );
            Assert.IsFalse( TextureSource.IsMaterialUrl( "/js/sourceutils.js" ) );
            Assert.IsFalse( TextureSource.IsMaterialUrl( null ) );
        }

        [TestMethod]
        public void ContentAddressedForHashedInfoAndImageUrls()
        {
            Assert.IsTrue( TextureSource.IsContentAddressed( TextureSource.BuildUrl( "materials/water/anim.vtf", Hash, null ) ) );
            Assert.IsTrue( TextureSource.IsContentAddressed( TextureSource.BuildUrl( "materials/water/anim.vtf", Hash, "mip0.frame7.png" ) ) );
        }

        [TestMethod]
        public void NotContentAddressedWithoutHash()
        {
            Assert.IsFalse( TextureSource.IsContentAddressed( TextureSource.BuildUrl( "materials/water/anim.vtf", null, null ) ) );
        }

        [TestMethod]
        public void NotContentAddressedForOtherResources()
        {
            Assert.IsFalse( TextureSource.IsContentAddressed( "/maps/surf_x/geom/vispage0.json" ) );
            Assert.IsFalse( TextureSource.IsContentAddressed( "/maps/surf_x/materials/matpage0.json" ) );
            Assert.IsFalse( TextureSource.IsContentAddressed( "/maps/surf_x/lightmap.png" ) );
        }

        [TestMethod]
        public void ParseImageFileNameRejectsMalformedAndOverflowingIndices()
        {
            Assert.IsFalse( TextureSource.TryParseImageFileName( "mip.png", 2, 2, 2, out _, out _, out _ ) );
            Assert.IsFalse( TextureSource.TryParseImageFileName( "mip999999999999999999999.png", 2, 2, 2, out _, out _, out _ ) );
        }

        [TestMethod]
        public void ParseImageFileNameRejectsOutOfRangeIndices()
        {
            Assert.IsFalse( TextureSource.TryParseImageFileName( "mip2.png", 2, 1, 1, out _, out _, out _ ) );
            Assert.IsFalse( TextureSource.TryParseImageFileName( "frame1.png", 1, 1, 1, out _, out _, out _ ) );
            Assert.IsFalse( TextureSource.TryParseImageFileName( "face1.png", 1, 1, 1, out _, out _, out _ ) );
        }

        [TestMethod]
        public void ParseImageFileNameReturnsIndicesInsideTextureBounds()
        {
            Assert.IsTrue( TextureSource.TryParseImageFileName( "mip1.frame2.face5.png", 2, 3, 6,
                out var mip, out var frame, out var face ) );
            Assert.AreEqual( 1, mip );
            Assert.AreEqual( 2, frame );
            Assert.AreEqual( 5, face );
        }
    }
}
