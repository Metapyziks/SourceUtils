using SourceUtils;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix("/vmt")]
    public class VmtController : ResourceController
    {
        private const string DefaultFormat = "json";

        private static JToken PropertyGroupToJson(MaterialPropertyGroup props)
        {
            var obj = new JObject();
            
            foreach (var name in props.PropertyNames)
            {
                var value = props[name];
                
                int intValue;
                if (int.TryParse(value, out intValue))
                {
                    obj.Add(name, intValue);
                    continue;
                }
                
                double doubleValue;
                if (double.TryParse(value, out doubleValue))
                {
                    obj.Add(name, doubleValue);
                    continue;
                }
                
                obj.Add(name, value);
            }
            
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

            var vmt = Program.Loader.Load<ValveMaterialFile>(FilePath);
            var response = new JObject();
            
            foreach (var shader in vmt.Shaders)
            {
                response.Add(shader, PropertyGroupToJson(vmt[shader]));
            }
            
            return response;
        }
    }
}