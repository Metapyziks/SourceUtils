using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public class Visibility
    {
        public const int PerPage = 256;

        public static int GetPageCount( int clusters )
        {
            return (clusters + PerPage - 1) / PerPage;
        }

        [JsonProperty("first")]
        public int First { get; set; }

        [JsonProperty("count")]
        public int Count { get; set; }

        [JsonProperty("values")]
        public IEnumerable<IEnumerable<int>> Values { get; set; }
    }

    [Prefix("/maps/{map}/visibility")]
    class VisibilityController : ResourceController
    {
        [Get("/{page}.json")]
        public Visibility Get( [Url] string map, [Url] int page )
        {
            if ( Skip ) return null;

            var bsp = Program.GetMap(map);
            var first = page * Visibility.PerPage;
            var count = Math.Min( first + Visibility.PerPage, bsp.Visibility.NumClusters ) - first;

            if ( count < 0 )
            {
                first = bsp.Visibility.NumClusters;
                count = 0;
            }

            return new Visibility
            {
                First = first,
                Count = count,
                Values = Enumerable.Range( first, count ).Select( x => bsp.Visibility[x] )
            };
        }
    }
}
