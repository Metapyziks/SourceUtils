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

    [Prefix("/maps/{map}")]
    partial class IndexController : ResourceController
    {
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

        [Get("/index.json")]
        public Map GetIndexJson( [Url] string map )
        {
            var bsp = Program.GetMap( map );

            var ents = new List<Entity>();
            var mapParams = new MapParams( bsp );

            foreach ( var ent in bsp.Entities )
            {
                var inst = InitEntity( ent, mapParams );
                if ( inst != null ) ents.Add( inst );
            }

            for ( var dispIndex = 0; dispIndex < bsp.DisplacementInfos.Length; ++dispIndex )
            {
                SourceUtils.Vector3 min, max;
                GetDisplacementBounds(bsp, dispIndex, out min, out max, 1f);

                ents.Add( new Displacement
                {
                    ClassName = "displacement",
                    Index = dispIndex,
                    Clusters = GetIntersectingClusters(mapParams.Tree, min, max)
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
