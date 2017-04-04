using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils.ValveBsp;
using SourceUtils.ValveBsp.Entities;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public class PageInfo
    {
        [JsonProperty( "first" )]
        public int First { get; set; }

        [JsonProperty( "count" )]
        public int Count { get; set; }

        [JsonProperty( "url" )]
        public Url Url { get; set; }
    }

    public class BrushEnt
    {
        [JsonProperty("classname")]
        public string ClassName { get; set; }

        [JsonProperty("origin")]
        public Vector3 Origin { get; set; }

        [JsonProperty("angles")]
        public Vector3 Angles { get; set; }

        [JsonProperty("modelUrl")]
        public Url ModelUrl { get; set; }

        [JsonProperty("clusters")]
        public IEnumerable<int> Clusters { get; set; }
    }

    public class Info
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("clusterCount")]
        public int ClusterCount { get; set; }

        [JsonProperty("lightmapUrl")]
        public Url LightmapUrl { get; set; }

        [JsonProperty("visibilityPages")]
        public IEnumerable<PageInfo> VisibilityPages { get; set; }

        [JsonProperty("geometryPages")]
        public IEnumerable<PageInfo> GeometryPages { get; set; }

        [JsonProperty("brushEntities")]
        public IEnumerable<BrushEnt> BrushEntities { get; set; }
    }

    [Prefix("/maps/{map}.json")]
    class InfoController : ResourceController
    {
        [ThreadStatic]
        private static List<BspTree.Leaf> _sLeafBuffer;

        private static List<int> GetIntersectingClusters(BspTree tree, SourceUtils.Vector3 min, SourceUtils.Vector3 max)
        {
            if (_sLeafBuffer == null) _sLeafBuffer = new List<BspTree.Leaf>();
            else _sLeafBuffer.Clear();

            tree.GetIntersectingLeaves(min, max, _sLeafBuffer);

            var clusters = new List<int>();

            foreach (var cluster in _sLeafBuffer.Select(x => x.Info.Cluster).Distinct())
            {
                clusters.Add(cluster);
            }

            return clusters;
        }

        [Get]
        public Info Get( [Url] string map )
        {
            var bsp = Program.GetMap( map );

            var areaPortalNames =
                new HashSet<string>( bsp.Entities.OfType<FuncAreaPortal>()
                    .Select( x => x.Target )
                    .Where( x => x != null ) );

            var tree = new BspTree( bsp, 0 );

            return new Info
            {
                Name = bsp.Name,
                ClusterCount = bsp.Visibility.NumClusters,
                LightmapUrl = $"/maps/{bsp.Name}/lightmap.json",
                VisibilityPages = Enumerable.Range( 0, VisibilityPage.GetPageCount( bsp.Visibility.NumClusters ) )
                    .Select( x => new PageInfo
                    {
                        First = x * VisibilityPage.ClustersPerPage,
                        Count = Math.Min( (x + 1) * VisibilityPage.ClustersPerPage, bsp.Visibility.NumClusters ) - x * VisibilityPage.ClustersPerPage,
                        Url = $"/maps/{bsp.Name}/vis/page{x}.json"
                    } ),
                GeometryPages = Enumerable.Range( 0, GeometryPage.GetPageCount( bsp.Leaves.Length ) )
                .Select( x => new PageInfo
                    {
                        First = x * GeometryPage.LeavesPerPage,
                        Count = Math.Min( (x + 1) * GeometryPage.LeavesPerPage, bsp.Leaves.Length ) - x * GeometryPage.LeavesPerPage,
                        Url = $"/maps/{bsp.Name}/geom/page{x}.json"
                    } ),
                BrushEntities = bsp.Entities.OfType<FuncBrush>()
                    .Where(x => x.RenderMode != 10 && x.Model != null && (x.TargetName == null || !areaPortalNames.Contains( x.TargetName )) )
                    .Select( x =>
                    {
                        var modelIndex = int.Parse( x.Model.Substring( 1 ) );
                        var model = bsp.Models[modelIndex];

                        var min = model.Min + x.Origin;
                        var max = model.Max + x.Origin;

                        return new BrushEnt
                        {
                            ClassName = x.ClassName,
                            Origin = x.Origin,
                            Angles = x.Angles,
                            ModelUrl = $"/maps/{bsp.Name}/brushmodels/model{modelIndex}.json",
                            Clusters = modelIndex == 0 ? null : GetIntersectingClusters( tree, min, max )
                        };
                    } )
            };
        }
    }
}
