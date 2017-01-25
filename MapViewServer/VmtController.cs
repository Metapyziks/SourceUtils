using System.IO;
using System.Net;
using SourceUtils;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix(UrlPrefix)]
    public class VmtController : ResourceController
    {
        public const string UrlPrefix = "/vmt";

        private const string DefaultFormat = "json";
        
        public static string GetUrl( HttpListenerRequest request, string path )
        {
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}?format=json";
        }

        private string GetTextureUrl( string filePath )
        {
            filePath = filePath.Replace( '\\', '/' );

            var ext = Path.GetExtension( filePath );
            if ( string.IsNullOrEmpty( ext ) ) filePath += ".vtf";

            return VtfController.GetUrl( Request, filePath );
        }

        private void HandleVertexLitGeneric( JObject response, JObject outProperties, MaterialPropertyGroup properties )
        {
            response["material"] = "MeshPhongMaterial";

            foreach ( var name in properties.PropertyNames )
            {
                switch ( name.ToLower() )
                {
                    case "$basetexture":
                        outProperties.Add( "map", GetTextureUrl( properties[name] ) );
                        break;
                    case "$bumpmap":
                        outProperties.Add( "bumpMap", GetTextureUrl( properties[name] ) );
                        break;
                    case "$envmapmask":
                        outProperties.Add( "specularMap", GetTextureUrl( properties[name] ) );
                        break;
                }
            }
        }

        private JToken PropertyGroupToJson(string shaderName, MaterialPropertyGroup props)
        {
            var obj = new JObject();
            var raw = new JObject();
            
            foreach (var name in props.PropertyNames)
            {
                var value = props[name];
                var lower = name.ToLower();
                
                int intValue;
                if (int.TryParse(value, out intValue))
                {
                    raw.Add(lower, intValue);
                    continue;
                }
                
                double doubleValue;
                if (double.TryParse(value, out doubleValue))
                {
                    raw.Add(lower, doubleValue);
                    continue;
                }
                
                raw.Add(lower, value.Replace( '\\', '/' ));
            }

            var properties = new JObject();
            obj.Add( "material", "MeshBasicMaterial" );
            obj.Add( "properties", properties );

            //switch ( shaderName.ToLower() )
            //{
            //    case "vertexlitgeneric":
                    HandleVertexLitGeneric( obj, properties, props );
            //        break;
            //}

            obj.Add( "sourceName", shaderName );
            obj.Add( "sourceProperties", raw );
            
            return obj;
        }
        
        [Get( MatchAllUrl = false )]
        public HtmlElement Html( string format = DefaultFormat )
        {
            return new code( style => "display: block; white-space: pre-wrap" )
            {
                Json().ToString()
            };
        }
        
        [Get( MatchAllUrl = false )]
        public JToken Json( string format = DefaultFormat )
        {
            if ( format != "json" ) throw NotFoundException();

            var vmt = Program.Loader.Load<ValveMaterialFile>( FilePath );
            var response = new JObject();

            var shaders = new JArray();
            
            foreach (var shader in vmt.Shaders)
            {
                shaders.Add(PropertyGroupToJson(shader, vmt[shader]));
            }

            response.Add( "shaders", shaders );
            
            return response;
        }
    }
}