using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils.ValveBsp;
using SourceUtils.ValveBsp.Entities;
using SourceUtils.WebExport.Properties;
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

    public class BrushEntity
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

    public class Map
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("lightmapUrl")]
        public Url LightmapUrl { get; set; }

        [JsonProperty("visPages")]
        public IEnumerable<PageInfo> VisPages { get; set; }

        [JsonProperty("leafPages")]
        public IEnumerable<PageInfo> LeafPages { get; set; }

        [JsonProperty("brushEntities")]
        public IEnumerable<BrushEntity> BrushEntities { get; set; }
    }

    [Prefix("/maps/{map}")]
    class IndexController : ResourceController
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

        private static string ReplaceTokens( string str, params Expression<Func<object, object>>[] replacements )
        {
            foreach ( var replacement in replacements )
            {
                var name = replacement.Parameters[0].Name;
                var value = JsonConvert.SerializeObject( replacement.Compile()( name ) );

                if ( value.StartsWith( "\"" ) && value.EndsWith( "\"" ) )
                {
                    value = value.Substring( 1, value.Length - 2 );
                }

                var token = $"${{{name}}}";

                str = str.Replace( token, value );
            }

            return str;
        }

        [Get("/index.html")]
        public string GetIndexPage( [Url] string map )
        {
            Response.ContentType = MimeTypes.MimeTypeMap.GetMimeType( ".html" );
            return ReplaceTokens( Resources.index_template,
                mapName => map,
                mapIndexJson => (Url) $"/maps/{map}/index.json",
                facepunchWebGame => (Url) "/js/facepunch.webgame.js",
                sourceUtils => (Url) "/js/sourceutils.js" );
        }

        [Get("/index.json")]
        public Map GetIndexJson( [Url] string map )
        {
            var bsp = Program.GetMap( map );

            var areaPortalNames =
                new HashSet<string>( bsp.Entities.OfType<FuncAreaPortal>()
                    .Select( x => x.Target )
                    .Where( x => x != null ) );

            var tree = new BspTree( bsp, 0 );

            return new Map
            {
                Name = bsp.Name,
                LightmapUrl = $"/maps/{bsp.Name}/lightmap.json",
                VisPages = Enumerable.Range( 0, VisPage.GetPageCount( bsp.Visibility.NumClusters ) )
                    .Select( x => new PageInfo
                    {
                        First = x * VisPage.ClustersPerPage,
                        Count = Math.Min( (x + 1) * VisPage.ClustersPerPage, bsp.Visibility.NumClusters ) - x * VisPage.ClustersPerPage,
                        Url = $"/maps/{bsp.Name}/geom/vispage{x}.json"
                    } ),
                LeafPages = Enumerable.Range( 0, LeafGeometryPage.GetPageCount( bsp.Leaves.Length ) )
                .Select( x => new PageInfo
                    {
                        First = x * LeafGeometryPage.LeavesPerPage,
                        Count = Math.Min( (x + 1) * LeafGeometryPage.LeavesPerPage, bsp.Leaves.Length ) - x * LeafGeometryPage.LeavesPerPage,
                        Url = $"/maps/{bsp.Name}/geom/leafpage{x}.json"
                    } ),
                BrushEntities = bsp.Entities.OfType<FuncBrush>()
                    .Where(x => x.RenderMode != 10 && x.Model != null && (x.TargetName == null || !areaPortalNames.Contains( x.TargetName )) )
                    .Select( x =>
                    {
                        var modelIndex = int.Parse( x.Model.Substring( 1 ) );
                        var model = bsp.Models[modelIndex];

                        var min = model.Min + x.Origin;
                        var max = model.Max + x.Origin;

                        return new BrushEntity
                        {
                            ClassName = x.ClassName,
                            Origin = x.Origin,
                            Angles = x.Angles,
                            ModelUrl = $"/maps/{bsp.Name}/geom/model{modelIndex}.json",
                            Clusters = modelIndex == 0 ? null : GetIntersectingClusters( tree, min, max )
                        };
                    } )
            };
        }
    }
}
