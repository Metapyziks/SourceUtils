using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace MapViewServer
{
    partial class BspController
    {
        private string GetModelUrl( string filePath )
        {
            return MdlController.GetUrl( Request, filePath );
        }

        [Get( "/{mapName}/static-props" )]
        public JToken GetStaticProps( [Url] string mapName )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var bsp = GetBspFile( Request, mapName );

            var models = new JArray();
            var modelCount = bsp.StaticProps.ModelCount;
            for ( var i = 0; i < modelCount; ++i )
            {
                models.Add( GetModelUrl( bsp.StaticProps.GetModelName( i ) ) );
            }

            var response = new JArray();
            var propCount = bsp.StaticProps.PropCount;
            for ( var i = 0; i < propCount; ++i )
            {
                int modelIndex, skin;
                bsp.StaticProps.GetPropModelSkin( i, out modelIndex, out skin );

                Vector3 origin, angles;
                bsp.StaticProps.GetPropTransform( i, out origin, out angles );

                StaticPropFlags flags;
                bool solid;
                uint diffMod;
                bsp.StaticProps.GetPropInfo( i, out flags, out solid, out diffMod );

                var clusters = new JArray();
                foreach ( var leaf in bsp.StaticProps.GetPropLeaves( i ) )
                {
                    clusters.Add( bsp.Leaves[leaf].Cluster );
                }

                response.Add( new JObject
                {
                    {"model", modelIndex},
                    {"skin", skin},
                    {"origin", origin.ToJson()},
                    {"angles", angles.ToJson()},
                    {"flags", (int) flags},
                    {"solid", solid},
                    {"diffuse", diffMod},
                    {"clusters", clusters}
                } );
            }

            return new JObject
            {
                {"models", models},
                {"props", response}
            };
        }
    }
}
