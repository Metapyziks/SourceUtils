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
                var vmt = VmtUtils.OpenVmt( bsp, matName );
                var shaderProps = vmt[vmt.Shaders.FirstOrDefault()];
                var baseTex = shaderProps["$hdrcompressedtexture"] ?? shaderProps["$basetexture"];
                faceUrls[i++] = VmtUtils.GetTextureUrl( Request, bsp, baseTex, matDir );
            }

            VmtUtils.AddTextureCubeProperty( propArray, "baseTexture", faceUrls );

            return new JObject
            {
                {"shader", "Sky"},
                {"properties", propArray}
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
                var vmt = VmtUtils.OpenVmt( bsp, path );
                response.Add( vmt == null ? null : VmtUtils.SerializeVmt( Request, bsp, vmt, path ) );
            }

            return new JObject
            {
                {"materials", response}
            };
        }
    }
}
