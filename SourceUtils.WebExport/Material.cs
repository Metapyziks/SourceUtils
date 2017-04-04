using System.CodeDom;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Ziks.WebServer;

namespace SourceUtils.WebExport
{
    public enum MaterialPropertyType
    {
        Boolean = 1,
        Number = 2,
        TextureUrl = 3,
        Color = 4
    }

    public class MaterialProperty
    {
        [JsonProperty( "name" )]
        public string Name { get; set; }

        [JsonProperty( "type" )]
        public MaterialPropertyType Type { get; set; }

        [JsonProperty( "value" )]
        public object Value { get; set; }
    }

    public struct MaterialColor
    {
        public MaterialColor( byte r, byte g, byte b, byte a = 255 )
        {
            R = r / 255f;
            G = g / 255f;
            B = b / 255f;
            A = a / 255f;
        }

        public MaterialColor( Color32 color )
        {
            R = color.R / 255f;
            G = color.G / 255f;
            B = color.B / 255f;
            A = color.A / 255f;
        }

        [JsonProperty("r")]
        public float R { get; set; }
        [JsonProperty("g")]
        public float G { get; set; }
        [JsonProperty("b")]
        public float B { get; set; }
        [JsonProperty("a")]
        public float A { get; set; }
    }

    public class Material
    {
        [JsonProperty("shader")]
        public string Shader { get; set; }

        [JsonProperty("properties")]
        public List<MaterialProperty> Properties { get; } = new List<MaterialProperty>();

        private MaterialProperty GetOrAddProperty( string name, MaterialPropertyType type )
        {
            var prop = Properties.FirstOrDefault(x => x.Name == name);
            if ( prop == null ) Properties.Add( prop = new MaterialProperty {Name = name} );
            prop.Type = type;

            return prop;
        }

        public void Set( string name, bool value )
        {
            GetOrAddProperty( name, MaterialPropertyType.Boolean ).Value = value;
        }

        public void Set( string name, float value )
        {
            GetOrAddProperty( name, MaterialPropertyType.Number ).Value = value;
        }

        public void Set( string name, Url textureUrl )
        {
            GetOrAddProperty( name, MaterialPropertyType.TextureUrl ).Value = textureUrl;
        }

        public void Set( string name, MaterialColor value )
        {
            GetOrAddProperty( name, MaterialPropertyType.Color ).Value = value;
        }
    }

    [Prefix("/materials", Extension = ".vmt.json")]
    [Prefix("/maps/{map}/materials", Extension = ".vmt.json")]
    class MaterialController : ResourceController
    {
        private Url GetTextureUrl( string path, string vmtPath, ValveBspFile bsp )
        {
            path = path.ToLower().Replace( '\\', '/' );
            if ( !path.EndsWith( ".vtf" ) ) path = $"{path}.vtf";

            path = !path.Contains( '/' ) ? $"{Path.GetDirectoryName( vmtPath )}/{path}" : $"materials/{path}";

            if ( bsp != null && bsp.PakFile.ContainsFile( path ) )
            {
                return $"/maps/{bsp.Name}/{path}.json";
            }

            return $"/{path}.json";
        }

        private void AddMaterialProperties( Material mat, ValveMaterialFile vmt, string vmtPath, ValveBspFile bsp )
        {
            var shader = vmt.Shaders.First();
            var props = vmt[shader];

            switch ( shader.ToLower() )
            {
                case "patch":
                {
                    var includePath = props.GetString( "include" ).Replace( '\\', '/' );
                    var res = bsp.PakFile.ContainsFile( includePath ) ? bsp.PakFile : Program.Resources;

                    ValveMaterialFile include;
                    using ( var stream = res.OpenFile( includePath ) )
                    {
                        include = new ValveMaterialFile( stream );
                    }

                    // TODO insert

                    AddMaterialProperties( mat, include, includePath, bsp );
                    break;
                }
                case "lightmappedgeneric":
                {
                    mat.Shader = "SourceUtils.Shaders.LightmappedGeneic";
                    break;
                }
                case "worldvertextransition":
                {
                    mat.Shader = "SourceUtils.Shaders.Lightmapped2WayBlend";
                    break;
                }
                case "vertexlitgeneric":
                {
                    mat.Shader = "SourceUtils.Shaders.VertexLitGeneric";
                    break;
                }
                case "unlittwotexture":
                case "unlitgeneric":
                {
                    mat.Shader = "SourceUtils.Shaders.UnlitGeneric";
                    break;
                }
                case "water":
                {
                    mat.Shader = "SourceUtils.Shaders.Water";
                    break;
                }
            }

            foreach ( var name in props.PropertyNames )
            {
                switch ( name.ToLower() )
                {
                    case "$basetexture":
                        mat.Set( "basetexture", GetTextureUrl( props[name], vmtPath, bsp ) );
                        break;
                    case "$texture2":
                    case "$basetexture2":
                        mat.Set( "basetexture2", GetTextureUrl( props[name], vmtPath, bsp ) );
                        break;
                    case "$blendmodulatetexture":
                        mat.Set( "blendModulateTexture", GetTextureUrl( props[name], vmtPath, bsp ) );
                        break;
                    case "$normalmap":
                        mat.Set( "normalMap", GetTextureUrl( props[name], vmtPath, bsp ) );
                        break;
                    case "$simpleoverlay":
                        mat.Set( "simpleOverlay", GetTextureUrl( props[name], vmtPath, bsp ) );
                        break;
                    case "$nofog":
                        mat.Set( "fog", !props.GetBoolean( name ) );
                        break;
                    case "$alphatest":
                        mat.Set( "alphaTest", props.GetBoolean( name ) );
                        break;
                    case "$translucent":
                        mat.Set( "translucent", props.GetBoolean( name ) );
                        break;
                    case "$refract":
                        mat.Set( "refract", props.GetBoolean( name ) );
                        break;
                    case "$alpha":
                        mat.Set( "alpha", props.GetSingle( name ) );
                        break;
                    case "$nocull":
                        mat.Set( "cullFace", !props.GetBoolean( name ) );
                        break;
                    case "$notint":
                        mat.Set( "tint", !props.GetBoolean( name ) );
                        break;
                    case "$blendtintbybasealpha":
                        mat.Set( "baseAlphaTint", props.GetBoolean( name ) );
                        break;
                    case "$fogstart":
                        mat.Set( "fogStart", props.GetSingle( name ) );
                        break;
                    case "$fogend":
                        mat.Set( "fogEnd", props.GetSingle( name ) );
                        break;
                    case "$fogcolor":
                        mat.Set( "fogColor", new MaterialColor( props.GetColor( name ) ) );
                        break;
                    case "$reflecttint":
                        mat.Set( "reflectTint", new MaterialColor( props.GetColor( name ) ) );
                        break;
                    case "$refractamount":
                        mat.Set( "refractAmount", props.GetSingle( name ) );
                        break;
                }
            }
        }

        [Get(MatchAllUrl = false)]
        public Material Get( [Url] string map )
        {
            var path = Request.Url.AbsolutePath.Substring( Request.Url.AbsolutePath.IndexOf( "/materials" ) + 1 );

            path = path.Substring( 0, path.Length - ".json".Length );

            var bsp = map == null ? null : Program.GetMap( map );
            var res = bsp == null ? Program.Resources : bsp.PakFile;

            ValveMaterialFile vmt;
            using ( var stream = res.OpenFile( path ) )
            {
                vmt = new ValveMaterialFile( stream );
            }

            var mat = new Material();

            AddMaterialProperties( mat, vmt, path, bsp );

            return mat;
        }
    }
}
