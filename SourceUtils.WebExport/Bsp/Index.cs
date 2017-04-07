using System;
using System.Collections.Generic;
using System.IO;
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

    public class Entity
    {
        [JsonProperty("classname")]
        public string ClassName { get; set; }

        [JsonProperty("origin")]
        public Vector3? Origin { get; set; }

        [JsonProperty("angles")]
        public Vector3? Angles { get; set; }
    }

    public class PvsEntity : Entity
    {
        [JsonProperty("clusters")]
        public IEnumerable<int> Clusters { get; set; }
    }

    public class BrushEntity : PvsEntity
    {
        [JsonProperty("modelUrl")]
        public Url ModelUrl { get; set; }
    }

    public class Worldspawn : BrushEntity
    {
        [JsonProperty("skyMaterial")]
        public Material SkyMaterial { get; set; }
    }

    public class SkyCamera : Entity
    {
        [JsonProperty("scale")]
        public int Scale { get; set; }
    }

    public class Displacement : PvsEntity
    {
        [JsonProperty( "index" )]
        public int Index { get; set; }
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

        [JsonProperty("dispPages")]
        public IEnumerable<PageInfo> DispPages { get; set; }

        [JsonProperty("materialPages")]
        public IEnumerable<PageInfo> MaterialPages { get; set; }

        [JsonProperty("entities")]
        public IEnumerable<Entity> Entities { get; set; }
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

            var template = Resources.index_template;

            if ( Program.BaseOptions.ResourcesDir != null )
            {
                var templatePath = Path.Combine( Program.BaseOptions.ResourcesDir, "index.template.html" );
                if ( File.Exists( templatePath ) )
                {
                    template = File.ReadAllText( templatePath );
                }
            }

            return ReplaceTokens( template,
                mapName => map,
                mapIndexJson => (Url) $"/maps/{map}/index.json",
                facepunchWebGame => (Url) "/js/facepunch.webgame.js",
                sourceUtils => (Url) "/js/sourceutils.js",
                styles => (Url) "/styles.css" );
        }

        private IEnumerable<PageInfo> GetPageLayout( ValveBspFile bsp, int count, int perPage, string filePrefix )
        {
            var pageCount = (count + perPage - 1) / perPage;

            return Enumerable.Range( 0, pageCount )
                .Select( x => new PageInfo
                {
                    First = x * perPage,
                    Count = Math.Min( (x + 1) * perPage, count ) - x * perPage,
                    Url = $"/maps/{bsp.Name}{filePrefix}{x}.json"
                } );
        }

        private static void AddToBounds(ref SourceUtils.Vector3 min, ref SourceUtils.Vector3 max, SourceUtils.Vector3 pos)
        {
            if (pos.X < min.X) min.X = pos.X;
            if (pos.Y < min.Y) min.Y = pos.Y;
            if (pos.Z < min.Z) min.Z = pos.Z;

            if (pos.X > max.X) max.X = pos.X;
            if (pos.Y > max.Y) max.Y = pos.Y;
            if (pos.Z > max.Z) max.Z = pos.Z;
        }

        private static void GetDisplacementBounds(ValveBspFile bsp, int index,
            out SourceUtils.Vector3 min, out SourceUtils.Vector3 max, float bias = 0f)
        {
            min = new SourceUtils.Vector3(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity);
            max = new SourceUtils.Vector3(float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity);

            var disp = bsp.DisplacementManager[index];
            var biasVec = disp.Normal * bias;

            for (var y = 0; y < disp.Size; ++y)
            for (var x = 0; x < disp.Size; ++x)
            {
                var pos = disp.GetPosition(x, y);

                AddToBounds(ref min, ref max, pos - biasVec);
                AddToBounds(ref min, ref max, pos + biasVec);
            }
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
            var ents = new List<Entity>();

            foreach ( var ent in bsp.Entities )
            {
                if ( ent is FuncBrush )
                {
                    var brush = ent as FuncBrush;

                    if ( brush.RenderMode == 10 || brush.Model == null ) continue;
                    if ( brush.TargetName != null && areaPortalNames.Contains( brush.TargetName ) ) continue;
                    
                    var modelIndex = int.Parse(brush.Model.Substring(1));

                    if ( ent is ValveBsp.Entities.Worldspawn )
                    {
                        var skyName = ((ValveBsp.Entities.Worldspawn) ent).SkyName;

                        ents.Add(new Worldspawn
                        {
                            ClassName = brush.ClassName,
                            ModelUrl = $"/maps/{bsp.Name}/geom/model{modelIndex}.json",
                            SkyMaterial = Material.CreateSkyMaterial( bsp, skyName )
                        });
                    }
                    else
                    {
                        var model = bsp.Models[modelIndex];

                        var min = model.Min + brush.Origin;
                        var max = model.Max + brush.Origin;

                        ents.Add(new BrushEntity
                        {
                            ClassName = brush.ClassName,
                            Origin = brush.Origin,
                            Angles = brush.Angles,
                            ModelUrl = $"/maps/{bsp.Name}/geom/model{modelIndex}.json",
                            Clusters = GetIntersectingClusters(tree, min, max)
                        });
                    }

                    continue;
                }

                if ( ent is ValveBsp.Entities.SkyCamera )
                {
                    ents.Add( new SkyCamera
                    {
                        ClassName = ent.ClassName,
                        Origin = ent.Origin,
                        Scale = (ent as ValveBsp.Entities.SkyCamera).Scale
                    } );

                    continue;
                }
            }

            for ( var dispIndex = 0; dispIndex < bsp.DisplacementInfos.Length; ++dispIndex )
            {
                SourceUtils.Vector3 min, max;
                GetDisplacementBounds(bsp, dispIndex, out min, out max, 1f);

                ents.Add( new Displacement
                {
                    ClassName = "displacement",
                    Index = dispIndex,
                    Clusters = GetIntersectingClusters(tree, min, max)
                } );
            }

            return new Map
            {
                Name = bsp.Name,
                LightmapUrl = $"/maps/{bsp.Name}/lightmap.json",
                VisPages = GetPageLayout( bsp, bsp.Visibility.NumClusters, VisPage.ClustersPerPage, "/geom/vispage" ),
                LeafPages = GetPageLayout( bsp, bsp.Leaves.Length, LeafGeometryPage.LeavesPerPage, "/geom/leafpage" ),
                DispPages = GetPageLayout( bsp, bsp.DisplacementInfos.Length, DispGeometryPage.DisplacementsPerPage, "/geom/disppage" ),
                MaterialPages = GetPageLayout( bsp, bsp.TextureStringTable.Length, MaterialPage.MaterialsPerPage, "/materials/matpage" ),
                Entities = ents
            };
        }
    }
}
