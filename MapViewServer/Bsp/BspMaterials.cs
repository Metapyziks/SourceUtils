using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;

namespace MapViewServer
{
    partial class BspController
    {
        private JToken GetSkyMaterial( ValveBspFile bsp, string skyName )
        {
            var postfixes = new[]
            {
                 "ft", "bk", "dn", "up", "rt", "lf"
            };
            
            var propArray = new JArray();
            var faceUrls = new string[6];

            var i = 0;
            foreach ( var postfix in postfixes )
            {
                var matName = $"materials/skybox/{skyName}{postfix}.vmt";
                var matDir = Path.GetDirectoryName( matName );
                var vmt = OpenVmt( bsp, matName );
                var shaderProps = vmt[vmt.Shaders.FirstOrDefault()];
                var baseTex = shaderProps["$hdrcompressedtexture"] ?? shaderProps["$basetexture"];
                faceUrls[i++] = GetTextureUrl( bsp, baseTex, matDir );
            }

            AddTextureCubeProperty( propArray, "baseTexture", faceUrls );

            return new JObject
            {
                {"shader", "Sky"},
                {"properties", propArray}
            };
        }

        private ValveMaterialFile OpenVmt( ValveBspFile bsp, string name )
        {
            if (!name.StartsWith( "materials/" )) name = $"materials/{name}.vmt";
            IResourceProvider provider;

            if ( bsp.PakFile.ContainsFile( name ) )
            {
                provider = bsp.PakFile;
            }
            else if ( Resources.ContainsFile( name ) )
            {
                provider = Resources;
            }
            else return null;

            using ( var vmtStream = provider.OpenFile( name ) )
            {
                return new ValveMaterialFile( vmtStream );
            }
        }

        private IEnumerable<string> GetTexturePathVariants( string filePath, string vmtDir )
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

        private string GetTextureUrl( ValveBspFile bsp, string filePath, string vmtDir )
        {
            filePath = filePath.Replace( '\\', '/' );

            foreach ( var variant in GetTexturePathVariants( filePath, vmtDir ) )
            {
                if ( bsp.PakFile.ContainsFile( variant ) ) return VtfController.GetUrl( Request, variant, bsp.Name );
                if ( Resources.ContainsFile( variant ) ) return VtfController.GetUrl( Request, variant );
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

        private void AddBooleanProperty( JArray properties, string name, bool value )
        {
            AddProperty( properties, name, MaterialPropertyType.Boolean, value );
        }

        private void AddNumberProperty( JArray properties, string name, float value )
        {
            AddProperty( properties, name, MaterialPropertyType.Number, value );
        }

        private void AddTexture2DProperty( JArray properties, string name, string vtfUrl )
        {
            AddProperty( properties, name, MaterialPropertyType.Texture2D, vtfUrl );
        }

        private void AddTextureCubeProperty( JArray properties, string name, string[] vtfUrls )
        {
            if ( vtfUrls.Length != 6 ) throw new ArgumentException( "Expected 6 cubemap faces.", nameof( vtfUrls ) );
            AddProperty( properties, name, MaterialPropertyType.TextureCube, new JArray( vtfUrls ) );
        }

        private void SerializeShaderProperties( ValveBspFile bsp, ValveMaterialFile vmt, string shaderName, string vmtDir, JArray destArray )
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
                        SerializeShaderProperties( bsp, includeVmt, shaderName, includeDir, destArray );
                        break;
                    }
                    case "$basetexture":
                        AddTexture2DProperty( destArray, "baseTexture", GetTextureUrl( bsp, props[name], vmtDir ) );
                        break;
                    case "$basetexture2":
                        AddTexture2DProperty( destArray, "baseTexture2", GetTextureUrl( bsp, props[name], vmtDir ) );
                        break;
                    case "$blendmodulatetexture":
                        AddTexture2DProperty( destArray, "blendModulateTexture", GetTextureUrl( bsp, props[name], vmtDir ) );
                        break;
                    case "$alphatest":
                        AddBooleanProperty( destArray, "alphaTest", props.GetBoolean( name ) );
                        break;
                    case "$translucent":
                        AddBooleanProperty( destArray, "translucent", props.GetBoolean( name ) );
                        break;
                    case "$alpha":
                        AddNumberProperty( destArray, "alpha", props.GetSingle( name ) );
                        break;
                    case "$nocull":
                        AddBooleanProperty( destArray, "noCull", props.GetBoolean( name ) );
                        break;
                }
            }
        }

        private JToken SerializeVmt( ValveBspFile bsp, ValveMaterialFile vmt, string path )
        {
            var shader = vmt.Shaders.FirstOrDefault();
            if ( shader == null ) return null;

            var propArray = new JArray();
            var vmtDir = Path.GetDirectoryName( path ).Replace( '\\', '/' );

            SerializeShaderProperties( bsp, vmt, shader, vmtDir, propArray );

            var shaderName = "LightmappedGeneric";

            switch ( shader.ToLower() )
            {
                case "worldvertextransition":
                    shaderName = "Lightmapped2WayBlend";
                    break;
            }

            if ( shaderName == "LightmappedGeneric" && propArray.Any(x => (string) x["name"] == "translucent" ) )
            {
                shaderName = "LightmappedTranslucent";
            }

            return new JObject
            {
                {"shader", shaderName},
                {"properties", propArray},
                {"debug", new JObject
                {
                    {"shader", shader },
                    {"properties", new JArray(vmt[shader].PropertyNames.Select( x => new JArray(x, vmt[shader][x] ))) }
                } }
            };
        }

        [Get( "/{mapName}/materials" )]
        public JToken GetMaterials( [Url] string mapName )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var response = new JArray();
            
            var bsp = GetBspFile( Request, mapName );
            for ( var i = 0; i < bsp.TextureStringTable.Length; ++i )
            {
                var path = $"materials/{bsp.GetTextureString( i ).ToLower()}.vmt";
                var vmt = OpenVmt( bsp, path );
                response.Add( vmt == null ? null : SerializeVmt( bsp, vmt, path ) );
            }

            return new JObject
            {
                {"materials", response}
            };
        }
    }
}
