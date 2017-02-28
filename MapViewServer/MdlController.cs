using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;

namespace MapViewServer
{
    [Prefix(UrlPrefix)]
    public class MdlController : ResourceController
    {
        public const string UrlPrefix = "/mdl";
        
        [Get( MatchAllUrl = false )]
        public JToken GetIndex()
        {
            var mdl = Program.Loader.Load<StudioModelFile>( FilePath );

            return new JObject { {"model", "yes"} };
        }
    }
}
