using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public class VisPage
    {
        public const int ClustersPerPage = 8192;

        [JsonProperty("values")]
        public IEnumerable<CompressedList<int>> Values { get; set; }
    }

    [Prefix("/maps/{map}/geom")]
    class VisController : ResourceController
    {
        [Get("/vispage{page}.json")]
        public VisPage Get( [Url] string map, [Url] int page )
        {
            // A skipped page still has to be a valid response. Returning null writes nothing at
            // all, which drops the connection and has the exporter count the file as failed.
            if ( Skip ) return new VisPage { Values = Enumerable.Empty<CompressedList<int>>() };

            var bsp = Program.GetMap(map);
            var first = page * VisPage.ClustersPerPage;
            var count = Math.Min( first + VisPage.ClustersPerPage, bsp.Visibility.NumClusters ) - first;

            if ( count < 0 )
            {
                first = bsp.Visibility.NumClusters;
                count = 0;
            }

            return new VisPage
            {
                Values = Enumerable.Range( first, count ).Select( x => new CompressedList<int>( bsp.Visibility[x] ) )
            };
        }
    }
}
