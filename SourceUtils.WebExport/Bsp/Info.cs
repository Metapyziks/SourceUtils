using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public class VisibilityPageInfo
    {
        [JsonProperty("first")]
        public int First { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("url")]
        public Url Url { get; set; }
    }

    public class Info
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("clusterCount")]
        public int ClusterCount { get; set; }

        [JsonProperty("lightmapUrl")]
        public Url LightmapUrl { get; set; }
        
        public IEnumerable<Url> MaterialUrls { get; set; }

        [JsonProperty("visibilityUrls")]
        public IEnumerable<VisibilityPageInfo> VisibilityPages { get; set; }
    }

    [Prefix("/maps/{map}.json")]
    class InfoController : ResourceController
    {
        [Get]
        public Info Get( [Url] string map )
        {
            var bsp = Program.GetMap( map );

            return new Info
            {
                Name = bsp.Name,
                ClusterCount = bsp.Visibility.NumClusters,
                LightmapUrl = $"/maps/{bsp.Name}/lightmap.png",
                VisibilityPages = Enumerable.Range( 0, Visibility.GetPageCount( bsp.Visibility.NumClusters ) )
                    .Select( x => new VisibilityPageInfo
                    {
                        First = x * Visibility.PerPage,
                        Count = Math.Min( (x + 1) * Visibility.PerPage, bsp.Visibility.NumClusters ) - x * Visibility.PerPage,
                        Url = $"/maps/{bsp.Name}/visibility/{x}.json"
                    } ),
                MaterialUrls = Enumerable.Range( 0, bsp.TextureStringTable.Length )
                    .Select( i => bsp.GetTextureString( i ) )
                    .Select( tex =>
                    {
                        var path = $"materials/{tex.ToLower()}.vmt".Replace( '\\', '/' );
                        if ( bsp.PakFile.ContainsFile( path ) )
                        {
                            return (Url) $"/maps/{bsp.Name}/{path}.json";
                        }

                        return (Url) $"/{path}.json";
                    } )
            };
        }
    }
}
