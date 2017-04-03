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

        [JsonProperty("visibilityUrls")]
        public IEnumerable<VisibilityPageInfo> VisibilityUrls { get; set; }
    }

    [Prefix("/{map}/info.json")]
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
                LightmapUrl = $"/{bsp.Name}/lightmap.png",
                VisibilityUrls = Enumerable.Range( 0, Visibility.GetPageCount( bsp.Visibility.NumClusters ) )
                    .Select( x => new VisibilityPageInfo
                    {
                        First = x * Visibility.PerPage,
                        Count = Math.Min( (x + 1) * Visibility.PerPage, bsp.Visibility.NumClusters ) - x * Visibility.PerPage,
                        Url = $"/{bsp.Name}/visibility/{x}.json"
                    } )
            };
        }
    }
}
