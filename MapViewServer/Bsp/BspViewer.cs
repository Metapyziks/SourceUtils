using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using SourceUtils.ValveBsp.Entities;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    partial class BspController
    {
        [Get( "/{mapName}/view" )]
        public HtmlElement GetViewer( [Url] string mapName )
        {
            const string elemId = "map-view";

            return new div
            {
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/three.js/84/three.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js" ),
                new script( src => "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/base64-string.min.js" ),
                new script( src => GetScriptUrl( "main.js" ) ),
                new link( rel => "stylesheet", type => "text/css", href => GetResourceUrl( "mapviewer.css" ) ),
                new script
                {
                    $@"
                    var main = new SourceUtils.MapViewer();
                    window.onload = function () {{
                        main.debugPanel = $(""#debug-panel"");
                        main.init($(""#{elemId}""));
                        main.loadMap(""{GetActionUrl( nameof( GetIndex ), Replace( "mapName", mapName ) )}"");
                        main.animate();
                    }}
                    "
                },
                new div( id => elemId )
                {
                    new div( id => "debug-panel" )
                },
                new code( style => "display: block; white-space: pre-wrap" )
                {
                    GetIndex( mapName ).ToString()
                }
            };
        }

        private JToken SerializeFuncBrush( ValveBspFile bsp, BspTree tree, FuncBrush ent )
        {
            var modelIndex = int.Parse( ent.Model.Substring( 1 ) );
            var model = bsp.Models[modelIndex];

            var min = model.Min + ent.Origin;
            var max = model.Max + ent.Origin;

            return new JObject
            {
                {"classname", ent.ClassName},
                {"origin", ent.Origin.ToJson()},
                {"angles", ent.Angles.ToJson()},
                {"model", modelIndex},
                {"clusters", modelIndex == 0 ? new JArray() : GetIntersectingClusters(tree, min, max) }
            };
        }

        private static void AddFogInfo( JObject target, EnvFogController fog, float distScale )
        {
            target.Add( "fogEnabled", fog != null && fog.FogEnable );

            if ( fog == null || !fog.FogEnable ) return;

            target.Add( "fogStart", fog.FogStart / distScale );
            target.Add( "fogEnd", fog.FogEnd / distScale );
            target.Add( "fogMaxDensity", fog.FogMaxDensity );
            target.Add( "farZ", fog.FarZ );
            target.Add( "fogColor", fog.FogColor.ToJson() );
        }

        [Get( "/{mapName}" )]
        public JToken GetIndex( [Url] string mapName )
        {
            var bsp = GetBspFile( Request, mapName );
            var skyName = bsp.Entities.GetFirst<WorldSpawn>().SkyName;
            var fogInfo = bsp.Entities.GetFirst<EnvFogController>( false );
            var skyInfo = bsp.Entities.GetFirst<SkyCamera>();

            var fogData = new JObject();
            AddFogInfo( fogData, fogInfo, 1f );

            var skyData = new JObject
            {
                {"enabled", skyInfo != null }
            };

            if ( skyInfo != null )
            {
                skyData.Add( "origin", skyInfo.Origin.ToJson() );
                skyData.Add( "scale", skyInfo.Scale );
                AddFogInfo( skyData, skyInfo, skyInfo.Scale );
            }

            var tree = new BspTree( bsp, 0 );
            var areaPortalNames = new HashSet<string>( bsp.Entities.OfType<FuncAreaPortal>().Select( x => x.Target ).Where( x => x != null ) );

            return new JObject
            {
                {"name", mapName},
                {"skyMaterial", GetSkyMaterial( bsp, skyName )},
                {"fog", fogData},
                {"skyCamera", skyData},
                {"playerStarts", new JArray( bsp.Entities.OfType<InfoPlayerStart>().Select( x => x.Origin.ToJson() ) )},
                {"numClusters", bsp.Visibility.NumClusters},
                {"numModels", bsp.Models.Length},
                {"brushEnts", new JArray( bsp.Entities.OfType<FuncBrush>()
                    .Where(x => x.Model != null && x.RenderMode != 10 && (x.TargetName == null || !areaPortalNames.Contains( x.TargetName )))
                    .Select( x => SerializeFuncBrush( bsp, tree, x ) )) },
                {"modelUrl", GetActionUrl( nameof( GetModels ), Replace( "mapName", mapName ) )},
                {"displacementsUrl", GetActionUrl( nameof( GetDisplacements ), Replace( "mapName", mapName ) )},
                {"facesUrl", GetActionUrl( nameof( GetFaces ), Replace( "mapName", mapName ) )},
                {"visibilityUrl", GetActionUrl( nameof( GetVisibility ), Replace( "mapName", mapName ) )},
                {"lightmapUrl", GetActionUrl( nameof( GetLightmap ), Replace( "mapName", mapName ) )},
                {"materialsUrl", GetActionUrl( nameof( GetMaterials ), Replace( "mapName", mapName ) )}
            };
        }
    }
}
