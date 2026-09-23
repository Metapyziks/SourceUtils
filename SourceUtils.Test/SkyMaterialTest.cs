using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using SourceUtils.WebExport;

namespace SourceUtils.Test
{
    [TestClass]
    public class SkyMaterialTest
    {
        private const string BaseUrl = "/materials/skybox/sky_bk.vtf/0123456789abcdef.vtf.json";
        private const string HdrUrl = "/materials/skybox/sky_bk_hdr.vtf/fedcba9876543210.vtf.json";

        private static string[] Names( Material mat )
        {
            return Material.GetSkyFaceTextures( mat ).Select( x => x.Name ).ToArray();
        }

        [TestMethod]
        public void BaseTextureIsUsedWhenPresent()
        {
            var mat = new Material();
            mat.SetTextureUrl( "basetexture", BaseUrl );

            CollectionAssert.AreEqual( new[] { "basetexture" }, Names( mat ) );
        }

        /// <summary>
        /// Maps often name an HDR texture without packing it, so the base texture has to stay
        /// available as a fallback rather than being dropped.
        /// </summary>
        [TestMethod]
        public void HdrTextureComesFirstButBaseTextureRemains()
        {
            var mat = new Material();
            mat.SetTextureUrl( "basetexture", BaseUrl );
            mat.SetTextureUrl( "hdrcompressedtexture", HdrUrl );

            CollectionAssert.AreEqual( new[] { "hdrcompressedtexture", "basetexture" }, Names( mat ) );
        }

        /// <summary>
        /// Some maps build their sky from an environment cubemap instead, with a shader like
        /// WindowImposter and no $basetexture at all. That used to throw, failing the whole
        /// map's index.json and leaving the map unexported.
        /// </summary>
        [TestMethod]
        public void MaterialWithoutTexturesGivesNothing()
        {
            var mat = new Material();
            mat.SetBoolean( "translucent", true );

            Assert.AreEqual( 0, Names( mat ).Length );
        }
    }
}
