using System.IO;
using System.Linq;
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

        private string GetTextureUrl( string filePath, bool alphaOnly = false )
        {
            filePath = filePath.Replace( '\\', '/' );

            var ext = Path.GetExtension( filePath );
            if ( string.IsNullOrEmpty( ext ) ) filePath += ".vtf";

            var fullPath = filePath;

            if ( !filePath.Contains( '/' ) )
            {
                var matPath = Path.GetDirectoryName( FilePath );
                if ( !string.IsNullOrEmpty( matPath ) )
                {
                    fullPath = $"{matPath}/{filePath}";
                    if ( !Program.Loader.ContainsFile( fullPath ) ) fullPath = filePath;
                }
            }

            return VtfController.GetUrl( Request, fullPath, alphaOnly );
        }

        private enum PropertyType
        {
            Boolean,
            Number,
            Texture
        }

        private static void AddProperty( JArray properties, string name, PropertyType type, JToken value )
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
            AddProperty( properties, name, PropertyType.Number, value );
        }

        private void AddNumberProperty( JArray properties, string name, float value )
        {
            AddProperty( properties, name, PropertyType.Number, value );
        }

        private void AddTextureProperty( JArray properties, string name, string vtfPath, bool alphaOnly = false )
        {
            AddProperty( properties, name, PropertyType.Texture, GetTextureUrl( vtfPath, alphaOnly ) );
        }

        private void HandleVertexLitGeneric( JObject response, JArray outProperties, MaterialPropertyGroup properties )
        {
            response["material"] = "MeshPhongMaterial";

            foreach ( var name in properties.PropertyNames )
            {
                switch ( name.ToLower() )
                {
                    case "$basetexture":
                        AddTextureProperty( outProperties, "map", properties[name] );
                        break;
                    case "$bumpmap":
                        AddTextureProperty( outProperties, "bumpMap", properties[name] );
                        AddTextureProperty( outProperties, "specularMap", properties[name], true );
                        AddNumberProperty( outProperties, "bumpScale", 0.25f );
                        break;
                    case "$envmapmask":
                        AddTextureProperty( outProperties, "specularMap", properties[name] );
                        break;
                    case "$alphatest":
                        AddNumberProperty( outProperties, "alphaTest", properties.GetBoolean( name ) ? 0.5f : 0f );
                        break;
                    case "$translucent":
                        AddBooleanProperty( outProperties, "transparent", properties.GetBoolean( name ) );
                        break;
                    case "$nocull":
                        AddNumberProperty( outProperties, "side", properties.GetBoolean( name ) ? 2f : 1f );
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

            var properties = new JArray();
            obj.Add( "material", "MeshBasicMaterial" );
            obj.Add( "properties", properties );

            AddNumberProperty( properties, "side", 1f );

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