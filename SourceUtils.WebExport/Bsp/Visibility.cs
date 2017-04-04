using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public class VisibilityPage
    {
        public const int ClustersPerPage = 256;

        public static int GetPageCount( int clusters )
        {
            return (clusters + ClustersPerPage - 1) / ClustersPerPage;
        }

        [JsonProperty("firstCluster")]
        public int FirstCluster { get; set; }

        [JsonProperty("clusterCount")]
        public int ClusterCount { get; set; }

        [JsonProperty("values")]
        public IEnumerable<IEnumerable<int>> Values { get; set; }
    }

    [Prefix("/maps/{map}/vis")]
    class VisibilityController : ResourceController
    {
        [Get("/page{page}.json")]
        public VisibilityPage Get( [Url] string map, [Url] int page )
        {
            if ( Skip ) return null;

            var bsp = Program.GetMap(map);
            var first = page * VisibilityPage.ClustersPerPage;
            var count = Math.Min( first + VisibilityPage.ClustersPerPage, bsp.Visibility.NumClusters ) - first;

            if ( count < 0 )
            {
                first = bsp.Visibility.NumClusters;
                count = 0;
            }

            return new VisibilityPage
            {
                FirstCluster = first,
                ClusterCount = count,
                Values = Enumerable.Range( first, count ).Select( x => bsp.Visibility[x] )
            };
        }
    }
}
