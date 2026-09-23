using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public class AmbientCube
    {
        [JsonProperty("position")]
        public Vector3 Position { get; set; }

        [JsonProperty("samples")]
        public int[] Samples { get; set; }
    }
    
    public class AmbientPage
    {
        public const int LeavesPerPage = 4096;
        
        [JsonProperty("values")]
        public IEnumerable<List<AmbientCube>> Values { get; set; }
    }
    
    [Prefix("/maps/{map}/geom")]
    class AmbientController : ResourceController
    {
        [Get("/ambientpage{page}.json")]
        public AmbientPage Get( [Url] string map, [Url] int page )
        {
            // A skipped page still has to be a valid response. Returning null writes nothing at
            // all, which drops the connection and has the exporter count the file as failed.
            if ( Skip ) return new AmbientPage { Values = Enumerable.Empty<List<AmbientCube>>() };

            var bsp = Program.GetMap(map);
            var first = page * AmbientPage.LeavesPerPage;
            var count = Math.Min( first + AmbientPage.LeavesPerPage, bsp.Leaves.Length ) - first;

            if ( count < 0 )
            {
                first = bsp.Leaves.Length;
                count = 0;
            }

            return new AmbientPage
            {
                Values = Enumerable.Range( first, count ).Select( x =>
                {
                    var leaf = bsp.Leaves[x];
                    var sampleCount = bsp.GetLeafAmbientSampleCount( x );
                    var list = new List<AmbientCube>(sampleCount);

                    var min = new SourceUtils.Vector3(leaf.Min.X, leaf.Min.Y, leaf.Min.Z);
                    var max = new SourceUtils.Vector3(leaf.Max.X, leaf.Max.Y, leaf.Max.Z);

                    for (var i = 0; i < sampleCount; ++i)
                    {
                        var ambient = bsp.GetLeafAmbientSample( x, i );
                        var samples = new int[6];
                        var relPos = new SourceUtils.Vector3(ambient.X, ambient.Y, ambient.Z) * (1f / 255f);

                        for (var j = 0; j < 6; ++j)
                        {
                            samples[j] = ambient.Cube[j];
                        }

                        list.Add(new AmbientCube
                        {
                            Position = (min + relPos * (max - min)).Rounded,
                            Samples = samples
                        });
                    }

                    return list;
                } )
            };
        }
    }
}
