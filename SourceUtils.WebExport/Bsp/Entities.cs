using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Newtonsoft.Json;
using SourceUtils.ValveBsp;
using SourceUtils.ValveBsp.Entities;

namespace SourceUtils.WebExport.Bsp
{
    partial class IndexController
    {
        [AttributeUsage( AttributeTargets.Method, AllowMultiple = true )]
        private class ClassnameAttribute : Attribute
        {
            public bool Default { get; set; }
            public string[] Names { get; set; }

            public ClassnameAttribute( params string[] names )
            {
                Names = names;
            }
        }

        [ThreadStatic] private static List<BspTree.Leaf> _sLeafBuffer;

        private static List<int> GetIntersectingClusters( BspTree tree, SourceUtils.Vector3 min, SourceUtils.Vector3 max )
        {
            if ( _sLeafBuffer == null ) _sLeafBuffer = new List<BspTree.Leaf>();
            else _sLeafBuffer.Clear();

            tree.GetIntersectingLeaves( min, max, _sLeafBuffer );

            var clusters = new List<int>();

            foreach ( var cluster in _sLeafBuffer.Select( x => x.Info.Cluster ).Distinct() )
            {
                clusters.Add( cluster );
            }

            return clusters;
        }

        private static void AddToBounds( ref SourceUtils.Vector3 min, ref SourceUtils.Vector3 max,
            SourceUtils.Vector3 pos )
        {
            if ( pos.X < min.X ) min.X = pos.X;
            if ( pos.Y < min.Y ) min.Y = pos.Y;
            if ( pos.Z < min.Z ) min.Z = pos.Z;

            if ( pos.X > max.X ) max.X = pos.X;
            if ( pos.Y > max.Y ) max.Y = pos.Y;
            if ( pos.Z > max.Z ) max.Z = pos.Z;
        }

        private static void GetDisplacementBounds( ValveBspFile bsp, int index,
            out SourceUtils.Vector3 min, out SourceUtils.Vector3 max, float bias = 0f )
        {
            min = new SourceUtils.Vector3( float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity );
            max = new SourceUtils.Vector3( float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity );

            var disp = bsp.DisplacementManager[index];
            var biasVec = disp.Normal * bias;

            for ( var y = 0; y < disp.Size; ++y )
            {
                for ( var x = 0; x < disp.Size; ++x )
                {
                    var pos = disp.GetPosition( x, y );

                    AddToBounds( ref min, ref max, pos - biasVec );
                    AddToBounds( ref min, ref max, pos + biasVec );
                }
            }
        }

        public class Entity
        {
            [JsonProperty( "targetname" )]
            public string TargetName { get; set; }

            [JsonProperty( "classname" )]
            public string ClassName { get; set; }

            [JsonProperty( "origin" )]
            public Vector3? Origin { get; set; }

            [JsonProperty( "angles" )]
            public Vector3? Angles { get; set; }

            [JsonProperty("scale")]
            public float? Scale { get; set; }
        }

        [Classname( Default = true )]
        private static Entity InitEntity( Entity ent, ValveBsp.Entities.Entity value )
        {
            if ( value["rendermode"] == 10 ) return null;

            ent.ClassName = value["classname"];
            if ( (string) value["origin"] != null ) ent.Origin = (SourceUtils.Vector3) value["origin"];
            if ( (string) value["angles"] != null ) ent.Angles = (SourceUtils.Vector3) value["angles"];
            if ( (string) value["targetname"] != null ) ent.TargetName = value["targetname"];

            return ent;
        }

        public class PvsEntity : Entity
        {
            [JsonProperty( "clusters" )]
            public IEnumerable<int> Clusters { get; set; }
        }

        private static PvsEntity InitPvsEntity( PvsEntity ent, ValveBsp.Entities.Entity value, IEnumerable<int> clusters )
        {
            if ( InitEntity( ent, value ) == null ) return null;

            ent.Clusters = clusters;

            return ent;
        }

        public class BrushEntity : PvsEntity
        {
            [JsonProperty( "model" )]
            public int Model { get; set; }
        }

        [Classname( "func_brush", "func_lod", "func_button", "func_door", "func_breakable", "func_wall", "func_tracktrain", "func_illusionary" )]
        private static BrushEntity InitBrushEntity( BrushEntity ent, ValveBsp.Entities.Entity value, MapParams mapParams )
        {
            if ( value.TargetName != null && mapParams.AreaPortalNames.Contains( value.TargetName ) ) return null;

            var modelName = ent is Worldspawn ? "*0" : value["model"];
            if ( modelName == null ) return null;

            var modelIndex = int.Parse( modelName.Substring( 1 ) );
            var model = mapParams.Bsp.Models[modelIndex];

            var min = model.Min + value.Origin;
            var max = model.Max + value.Origin;

            var clusters = modelIndex == 0 ? null : GetIntersectingClusters( mapParams.Tree, min, max );

            if ( InitPvsEntity( ent, value, clusters ) == null ) return null;

            ent.Model = modelIndex;

            if ( ent.GetType() == typeof(BrushEntity) )
            {
                ent.ClassName = "func_brush";
            }

            return ent;
        }

        public class Worldspawn : BrushEntity
        {
            [JsonProperty( "skyMaterial" )]
            public Material SkyMaterial { get; set; }
        }

        [Classname( "worldspawn" )]
        private static Worldspawn InitWorldspawn( Worldspawn ent, ValveBsp.Entities.Entity value, MapParams mapParams )
        {
            if ( InitBrushEntity( ent, value, mapParams ) == null ) return null;

            ent.SkyMaterial = Material.CreateSkyMaterial( mapParams.Bsp, value["skyname"] );

            return ent;
        }

        public class EnvFogController : Entity
        {
            [JsonProperty( "fogEnabled" )]
            public bool FogEnabled { get; set; }

            [JsonProperty( "fogStart" )]
            public float FogStart { get; set; }

            [JsonProperty( "fogEnd" )]
            public float FogEnd { get; set; }

            [JsonProperty( "fogMaxDensity" )]
            public float FogMaxDensity { get; set; }

            [JsonProperty( "farZ" )]
            public float FarZ { get; set; }

            [JsonProperty( "fogColor" )]
            public MaterialColor FogColor { get; set; }
        }

        [Classname( "env_fog_controller" )]
        private static EnvFogController InitEnvFogController( EnvFogController ent, ValveBsp.Entities.Entity value )
        {
            if ( InitEntity( ent, value ) == null ) return null;

            ent.FogEnabled = value["fogenable"];
            ent.FogStart = value["fogstart"];
            ent.FogEnd = value["fogend"];
            ent.FogMaxDensity = value["fogmaxdensity"];
            ent.FarZ = value["farz"];
            ent.FogColor = new MaterialColor( value["fogcolor"] );

            return ent;
        }

        public class SkyCamera : EnvFogController
        {
            [JsonProperty( "scale" )]
            public int Scale { get; set; }
        }

        [Classname( "sky_camera" )]
        private static SkyCamera InitSkyCamera( SkyCamera ent, ValveBsp.Entities.Entity value )
        {
            if ( InitEnvFogController( ent, value ) == null ) return null;

            ent.Scale = value["scale"];

            return ent;
        }

        public class LightEnvironment : Entity
        {
            public Color32? Brightness { get; set; }
            public Color32? Ambient { get; set; }

            public Color32? BrightnessHdr { get; set; }
            public Color32? AmbientHdr { get; set; }

            public float BrightnessScaleHdr { get; set; }
            public float AmbientScaleHdr { get; set; }

            public float Pitch { get; set; }
        }

        [Classname( "light_environment" )]
        private static LightEnvironment InitLightEnvironment( LightEnvironment ent, ValveBsp.Entities.Entity value )
        {
            if ( InitEntity( ent, value ) == null ) return null;

            ent.Brightness = value["_light"];
            ent.BrightnessHdr = value["_lightHDR"];
            ent.BrightnessScaleHdr = value["_lightscaleHDR"];
            ent.Ambient = value["_ambient"];
            ent.AmbientHdr = value["_ambientHDR"];
            ent.AmbientScaleHdr = value["_AmbientScaleHDR"];
            ent.Pitch = value["pitch"];

            return ent;
        }

        public class KeyframeRope : PvsEntity
        {
            [JsonProperty("width")]
            public float Width { get; set; }

            [JsonProperty("textureScale")]
            public float TextureScale { get; set; }
            
            [JsonProperty("subDivisions")]
            public int SubDivisions { get; set; }

            [JsonProperty("slack")]
            public float Slack { get; set; }

            [JsonProperty("ropeMaterial")]
            public int RopeMaterial { get; set; }
            
            [JsonProperty("nextKey")]
            public string NextKey { get; set; }
            
            [JsonProperty("moveSpeed")]
            public float MoveSpeed { get; set; }
        }
        
        [Classname( "keyframe_rope" )]
        private static KeyframeRope InitKeyframeRope( KeyframeRope ent, ValveBsp.Entities.Entity value, MapParams mapParams )
        {
            var min = (SourceUtils.Vector3) value["origin"];
            var max = min;
            
            ent.NextKey = value["NextKey"];

            if ( !string.IsNullOrEmpty( ent.NextKey ) )
            {
                var next = mapParams.Bsp.Entities.FirstOrDefault( x => ent.NextKey.Equals( x["targetname"] ) );
                if ( next != null )
                {
                    var nextOrigin = (SourceUtils.Vector3) next["origin"];
                    min = SourceUtils.Vector3.Min( min, nextOrigin );
                    max = SourceUtils.Vector3.Max( max, nextOrigin );
                }
            }

            var clusters = GetIntersectingClusters( mapParams.Tree, min, max );

            if ( InitPvsEntity( ent, value, clusters ) == null ) return null;

            ent.Width = value["Width"];
            ent.TextureScale = value["TextureScale"];
            ent.SubDivisions = value["Subdiv"];
            ent.Slack = value["Slack"];
            ent.RopeMaterial = MaterialDictionary.GetResourceIndex( mapParams.Bsp, value["RopeMaterial"] );
            ent.MoveSpeed = value["MoveSpeed"];

            return ent;
        }
        
        public class MoveRope : KeyframeRope
        {
            [JsonProperty("positionInterp")]
            public int PositionInterpolator { get; set; } = 2;
        }
        
        [Classname( "move_rope" )]
        private static MoveRope InitMoveRope( MoveRope ent, ValveBsp.Entities.Entity value, MapParams mapParams )
        {
            if ( InitKeyframeRope( ent, value, mapParams ) == null ) return null;

            ent.PositionInterpolator = value["PositionInterpolator"];

            return ent;
        }

        public class Displacement : PvsEntity
        {
            [JsonProperty( "index" )]
            public int Index { get; set; }
        }

        public class StaticProp : PvsEntity
        {
            [JsonProperty("model")]
            public int Model { get; set; }

            [JsonProperty("vertLighting")]
            public int? VertLighting { get; set; }

            [JsonProperty("albedoModulation")]
            public uint? AlbedoModulation { get; set; }

            [JsonProperty("flags")]
            public StaticPropFlags Flags { get; set; }

            [JsonProperty("lightingOrigin")]
            public Vector3? LightingOrigin { get; set; }
        }

        private class MapParams
        {
            public ValveBspFile Bsp { get; }
            public BspTree Tree { get; }
            public HashSet<string> AreaPortalNames { get; }

            public MapParams( ValveBspFile bsp )
            {
                Bsp = bsp;
                Tree = new BspTree( bsp, 0 );

                AreaPortalNames =
                    new HashSet<string>( bsp.Entities
                        .Where( x => x["classname"] == "func_areaportal" )
                        .Select( x => (string) x["target"] )
                        .Where( x => x != null ) );
            }
        }

        private delegate Entity EntityCtor( ValveBsp.Entities.Entity value, MapParams mapParams );

        private static readonly Dictionary<string, EntityCtor> _sEntityCtors =
            new Dictionary<string, EntityCtor>();

        private Entity InitEntity( ValveBsp.Entities.Entity value, MapParams mapParams )
        {
            var classname = (string) value["classname"];

            EntityCtor ctor;
            if ( _sEntityCtors.TryGetValue( classname, out ctor ) )
                return ctor == null ? null : ctor( value, mapParams );

            MethodInfo matchingMethod = null;
            foreach ( var method in typeof(IndexController).GetMethods( BindingFlags.Static | BindingFlags.NonPublic ) )
            {
                var attrib = method.GetCustomAttribute<ClassnameAttribute>();
                if ( attrib == null ) continue;

                if ( attrib.Default && matchingMethod == null || attrib.Names.Contains( classname ) )
                {
                    matchingMethod = method;
                    if ( !attrib.Default ) break;
                }
            }

            if ( matchingMethod == null )
            {
                _sEntityCtors.Add( classname, null );
                return null;
            }

            var parameters = matchingMethod.GetParameters();
            var entType = parameters[0].ParameterType;
            var hasParams = parameters.Length == 3;

            var valueParam = Expression.Parameter( typeof(ValveBsp.Entities.Entity), "value" );
            var mapParamsParam = Expression.Parameter( typeof(MapParams), "mapParams" );

            var ctorCall = Expression.New( entType.GetConstructor( Type.EmptyTypes ) );
            var methodCall = hasParams
                ? Expression.Call( matchingMethod, ctorCall, valueParam, mapParamsParam )
                : Expression.Call( matchingMethod, ctorCall, valueParam );

            var deleg = Expression.Lambda<EntityCtor>( methodCall, valueParam, mapParamsParam ).Compile();

            _sEntityCtors.Add( classname, deleg );

            return deleg( value, mapParams );
        }
    }
}
