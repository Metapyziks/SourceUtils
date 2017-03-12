using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using Newtonsoft.Json.Linq;
using SourceUtils;

namespace MapViewServer
{
    public static class VmtUtils
    {
        public static ValveMaterialFile OpenVmt( string name )
        {
            return OpenVmt( null, name );
        }

        public static ValveMaterialFile OpenVmt( ValveBspFile bsp, string name )
        {
            if (!name.StartsWith( "materials/" )) name = $"materials/{name}";
            if ( !name.EndsWith( ".vmt" ) ) name = $"{name}.vmt";
            IResourceProvider provider;

            if ( bsp != null && bsp.PakFile.ContainsFile( name ) )
            {
                provider = bsp.PakFile;
            }
            else if ( Program.Loader.ContainsFile( name ) )
            {
                provider = Program.Loader;
            }
            else return null;

            using ( var vmtStream = provider.OpenFile( name ) )
            {
                return new ValveMaterialFile( vmtStream );
            }
        }

        private static IEnumerable<string> GetTexturePathVariants( string filePath, string vmtDir )
        {
            filePath = filePath.Replace( '\\', '/' ).ToLower();

            var ext = Path.GetExtension( filePath );
            if ( string.IsNullOrEmpty( ext ) ) filePath += ".vtf";

            if ( !filePath.Contains( '/' ) )
            {
                if ( string.IsNullOrEmpty( vmtDir ) ) yield return filePath;
                else yield return $"{vmtDir}/{filePath}";
            }
            else if ( !filePath.StartsWith( "materials" ) )
            {
                yield return $"materials/{filePath}";
            }
            else
            {
                yield return filePath;
            }
        }

        public static string GetTextureUrl( HttpListenerRequest request, string filePath, string vmtDir )
        {
            return GetTextureUrl( request, null, filePath, vmtDir );
        }

        public static string GetTextureUrl( HttpListenerRequest request, ValveBspFile bsp, string filePath, string vmtDir )
        {
            filePath = filePath.Replace( '\\', '/' );

            foreach ( var variant in GetTexturePathVariants( filePath, vmtDir ) )
            {
                if ( bsp != null && bsp.PakFile.ContainsFile( variant ) ) return VtfController.GetUrl( request, variant, bsp.Name );
                if ( Program.Loader.ContainsFile( variant ) ) return VtfController.GetUrl( request, variant );
            }

            return null;
        }

        private enum MaterialPropertyType
        {
            Boolean,
            Number,
            Texture2D,
            TextureCube
        }

        private static void AddProperty( JArray properties, string name, MaterialPropertyType type, JToken value )
        {
            var existing = properties.FirstOrDefault( x => (string) x["name"] == name );
            if ( existing != null )
            {
                existing["type"] = (int) type;
                existing["value"] = value;
                return;
            }

            properties.Add( new JObject {{"name", name}, {"type", (int) type}, {"value", value}} );
        }

        public static void AddBooleanProperty( JArray properties, string name, bool value )
        {
            AddProperty( properties, name, MaterialPropertyType.Boolean, value );
        }

        public static void AddNumberProperty( JArray properties, string name, float value )
        {
            AddProperty( properties, name, MaterialPropertyType.Number, value );
        }

        public static void AddColorProperty(JArray properties, string name, Color32 value)
        {
            AddProperty(properties, name, MaterialPropertyType.Number, value.ToJson());
        }

        public static void AddTexture2DProperty( JArray properties, string name, string vtfUrl )
        {
            AddProperty( properties, name, MaterialPropertyType.Texture2D, vtfUrl );
        }

        public static void AddTextureCubeProperty( JArray properties, string name, string[] vtfUrls )
        {
            if ( vtfUrls.Length != 6 ) throw new ArgumentException( "Expected 6 cubemap faces.", nameof( vtfUrls ) );
            AddProperty( properties, name, MaterialPropertyType.TextureCube, new JArray( vtfUrls ) );
        }

        private static void SerializeShaderProperties( HttpListenerRequest request, ValveBspFile bsp, ValveMaterialFile vmt, string shaderName, string vmtDir, JArray destArray )
        {
            if ( !vmt.ContainsShader( shaderName ) ) shaderName = vmt.Shaders.FirstOrDefault();

            var props = vmt[shaderName];
            foreach ( var name in props.PropertyNames )
            {
                switch ( name.ToLower() )
                {
                    case "include":
                    {
                        var includePath = props[name];
                        var includeDir = Path.GetDirectoryName( includePath );
                        var includeVmt = OpenVmt( bsp, includePath );
                        SerializeShaderProperties( request, bsp, includeVmt, shaderName, includeDir, destArray );
                        break;
                    }
                    case "$basetexture":
                        AddTexture2DProperty( destArray, "baseTexture", GetTextureUrl( request, bsp, props[name], vmtDir ) );
                        break;
                    case "$texture2":
                    case "$basetexture2":
                        AddTexture2DProperty( destArray, "baseTexture2", GetTextureUrl( request, bsp, props[name], vmtDir ) );
                        break;
                    case "$blendmodulatetexture":
                        AddTexture2DProperty( destArray, "blendModulateTexture", GetTextureUrl( request, bsp, props[name], vmtDir ) );
                        break;
                    case "$normalmap":
                        AddTexture2DProperty( destArray, "normalMap", GetTextureUrl( request, bsp, props[name], vmtDir ) );
                        break;
                    case "$nofog":
                        AddBooleanProperty( destArray, "noFog", props.GetBoolean( name ) );
                        break;
                    case "$alphatest":
                        AddBooleanProperty( destArray, "alphaTest", props.GetBoolean( name ) );
                        break;
                    case "$translucent":
                        AddBooleanProperty( destArray, "translucent", props.GetBoolean( name ) );
                        break;
                    case "$refract":
                        AddBooleanProperty( destArray, "refract", props.GetBoolean( name ) );
                        break;
                    case "$alpha":
                        AddNumberProperty( destArray, "alpha", props.GetSingle( name ) );
                        break;
                    case "$nocull":
                        AddBooleanProperty( destArray, "noCull", props.GetBoolean( name ) );
                        break;
                    case "$notint":
                        AddBooleanProperty( destArray, "noTint", props.GetBoolean( name ) );
                        break;
                    case "$blendtintbybasealpha":
                        AddBooleanProperty( destArray, "baseAlphaTint", props.GetBoolean( name ) );
                        break;
                    case "$fogstart":
                        AddNumberProperty(destArray, "fogStart", props.GetSingle(name));
                        break;
                    case "$fogend":
                        AddNumberProperty(destArray, "fogEnd", props.GetSingle(name));
                        break;
                    case "$fogcolor":
                        AddColorProperty(destArray, "fogColor", props.GetColor(name));
                        break;
                    case "$reflecttint":
                        AddColorProperty( destArray, "reflectTint", props.GetColor( name ) );
                        break;
                    case "$refractamount":
                        AddNumberProperty( destArray, "refractAmount", props.GetSingle( name ) );
                        break;
                }
            }
        }

        public static JToken SerializeVmt( HttpListenerRequest request, ValveMaterialFile vmt, string path )
        {
            return SerializeVmt( request, null, vmt, path );
        }

        public static JToken SerializeVmt( HttpListenerRequest request, ValveBspFile bsp, ValveMaterialFile vmt, string path )
        {
            // TODO: Proper patch shader support
            var shader = vmt.Shaders.FirstOrDefault();
            if ( shader == null ) return null;

            var propArray = new JArray();
            var vmtDir = Path.GetDirectoryName( path ).Replace( '\\', '/' );

            SerializeShaderProperties( request, bsp, vmt, shader, vmtDir, propArray );

            var variant = "Generic";
            if ( propArray.Any(x => (string) x["name"] == "translucent" && (bool) x["value"] ) )
            {
                variant = "Translucent";
            }

            var shaderName = $"Lightmapped{variant}";

            switch ( shader.ToLower() )
            {
                case "lightmappedgeneric":
                    shaderName = $"Lightmapped{variant}";
                    break;
                case "vertexlitgeneric":
                    shaderName = $"VertexLit{variant}";
                    break;
                case "unlittwotexture": // TODO
                case "unlitgeneric":
                    shaderName = $"Unlit{variant}";
                    break;
                case "worldvertextransition":
                    shaderName = "Lightmapped2WayBlend";
                    break;
                case "water":
                    shaderName = "Water";
                    AddBooleanProperty( propArray, "refract", true );
                    break;
            }

            return new JObject
            {
                {"shader", shaderName},
                {"properties", propArray},
#if DEBUG
                {"debug", new JObject
                {
                    {"shader", shader },
                    {"properties", new JArray(vmt[shader].PropertyNames.Select( x => new JArray(x, vmt[shader][x] ))) }
                } }
#endif
            };
        }
    }
}
