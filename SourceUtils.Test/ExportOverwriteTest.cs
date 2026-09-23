using Microsoft.VisualStudio.TestTools.UnitTesting;
using SourceUtils.WebExport;

namespace SourceUtils.Test
{
    [TestClass]
    public class ExportOverwriteTest
    {
        private const string MaterialInfo = "/materials/concrete/wall.vtf/0123456789abcdef.vtf.json";
        private const string MaterialImage = "/materials/concrete/wall.vtf/0123456789abcdef/mip0.frame7.png";
        private const string MissingMaterial = "/materials/concrete/wall.vtf.json";
        private const string MapPage = "/maps/surf_x/materials/matpage0.json";
        private const string MapIndex = "/maps/surf_x/index.html";
        private const string StaticScript = "/js/sourceutils.js";
        private const string StaticStyle = "/styles/main.css";

        private static ExportOptions Options( bool all = false, bool maps = false, bool materials = false )
        {
            return new ExportOptions
            {
                Overwrite = all,
                OverwriteMaps = maps,
                OverwriteMaterials = materials
            };
        }

        [TestMethod]
        public void StaticFilesAreAlwaysOverwritten()
        {
            var none = Options();
            Assert.IsTrue( none.ShouldOverwrite( StaticScript ) );
            Assert.IsTrue( none.ShouldOverwrite( StaticStyle ) );
        }

        [TestMethod]
        public void NoFlagsLeavesMapsAndMaterialsAlone()
        {
            var none = Options();
            Assert.IsFalse( none.ShouldOverwrite( MaterialInfo ) );
            Assert.IsFalse( none.ShouldOverwrite( MaterialImage ) );
            Assert.IsFalse( none.ShouldOverwrite( MapPage ) );
            Assert.IsFalse( none.ShouldOverwrite( MapIndex ) );
        }

        [TestMethod]
        public void LegacyOverwriteCoversMapsAndMaterials()
        {
            var all = Options( all: true );
            Assert.IsTrue( all.ShouldOverwrite( MaterialInfo ) );
            Assert.IsTrue( all.ShouldOverwrite( MaterialImage ) );
            Assert.IsTrue( all.ShouldOverwrite( MapPage ) );
            Assert.IsTrue( all.ShouldOverwrite( MapIndex ) );
        }

        [TestMethod]
        public void OverwriteMaterialsLeavesMapsAlone()
        {
            var materials = Options( materials: true );
            Assert.IsTrue( materials.ShouldOverwrite( MaterialInfo ) );
            Assert.IsTrue( materials.ShouldOverwrite( MaterialImage ) );
            Assert.IsTrue( materials.ShouldOverwrite( MissingMaterial ) );
            Assert.IsFalse( materials.ShouldOverwrite( MapPage ) );
            Assert.IsFalse( materials.ShouldOverwrite( MapIndex ) );
        }

        [TestMethod]
        public void OverwriteMapsLeavesMaterialsAlone()
        {
            var maps = Options( maps: true );
            Assert.IsTrue( maps.ShouldOverwrite( MapPage ) );
            Assert.IsTrue( maps.ShouldOverwrite( MapIndex ) );
            Assert.IsFalse( maps.ShouldOverwrite( MaterialInfo ) );
            Assert.IsFalse( maps.ShouldOverwrite( MaterialImage ) );
        }

        /// <remarks>
        /// A map's own material page lives under /maps, so it must follow the maps flag rather
        /// than being caught by the word "materials" appearing in its url.
        /// </remarks>
        [TestMethod]
        public void MapMaterialPageCountsAsAMapFile()
        {
            Assert.IsTrue( Options( maps: true ).ShouldOverwrite( MapPage ) );
            Assert.IsFalse( Options( materials: true ).ShouldOverwrite( MapPage ) );
        }

        [TestMethod]
        public void BothNewFlagsMatchLegacyOverwrite()
        {
            var split = Options( maps: true, materials: true );
            var legacy = Options( all: true );

            foreach ( var url in new[] { MaterialInfo, MaterialImage, MapPage, MapIndex, StaticScript } )
            {
                Assert.AreEqual( legacy.ShouldOverwrite( url ), split.ShouldOverwrite( url ), url );
            }
        }
    }
}
