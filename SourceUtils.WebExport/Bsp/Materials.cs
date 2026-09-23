using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using SourceUtils.ValveBsp.Entities;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public class MaterialPage
    {
        public const int MaterialsPerPage = 8192;
        
        [JsonProperty("textures")]
        public List<Texture> Textures { get; } = new List<Texture>();

        [JsonProperty("materials")]
        public List<Material> Materials { get; } = new List<Material>();
    }

    [Prefix("/maps/{map}/materials")]
    class MaterialController : ResourceController
    {
        [Get("/matpage{index}.json")]
        public MaterialPage GetPage( [Url] string map, [Url] int index )
        {
            var bsp = Program.GetMap(map);
            var first = index * MaterialPage.MaterialsPerPage;
            var count = Math.Min(first + MaterialPage.MaterialsPerPage, MaterialDictionary.GetResourceCount( bsp )) - first;

            if (count < 0)
            {
                first = MaterialDictionary.GetResourceCount( bsp);
                count = 0;
            }

            var page = new MaterialPage();

            for ( var i = 0; i < count; ++i )
            {
                var path = MaterialDictionary.GetResourcePath( bsp, first + i );
                var mat = Material.Get(bsp, path);
                page.Materials.Add(mat);

                if ( mat == null )
                {
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine($"Missing material '{path}'!");
                    Console.ResetColor();
                    continue;
                }

                foreach ( var prop in mat.Properties )
                {
                    if ( prop.Type != MaterialPropertyType.TextureUrl ) continue;

                    // Textures are left as urls into the global, hash addressed materials folder so
                    // that each one is fetched (and exported) once as a whole, rather than having
                    // every frame and mip level inlined into each map that happens to use it.
                    var texUrl = (Url) prop.Value;

                    if ( TextureSource.TryParseUrl( texUrl, out var texPath, out var texHash, out _ )
                        && texHash != null ) continue;

                    // Unresolved textures have no hash to address them by, so there is nothing to
                    // link to. Null it out rather than emitting a url that can only ever 404.
                    prop.Type = MaterialPropertyType.TextureInfo;
                    prop.Value = null;

                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine($"Missing texture '{texPath ?? (string) texUrl}'!");
                    Console.ResetColor();
                }
            }

            return page;
        }
    }
}
