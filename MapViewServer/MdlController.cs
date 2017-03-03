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
            var provider = Resources;

            StudioModelFile mdl;
            using ( var mdlStream = provider.OpenFile( FilePath ) )
            {
                mdl = new StudioModelFile( mdlStream );
            }

            var parts = new JArray();

            for ( var i = 0; i < mdl.BodyPartCount; ++i )
            {
                var models = new JArray();

                foreach ( var model in mdl.GetModels( i ) )
                {
                    var meshes = new JArray();

                    foreach ( var mesh in mdl.GetMeshes( model.MeshIndex, model.NumMeshes ) )
                    {
                        meshes.Add( new JObject
                        {
                            {"material", mesh.Material},
                            {"center", mesh.Center.ToJson()},
                            {"vertexOffset", mesh.VertexOffset},
                            {"vertexCount", mesh.NumVertices}
                        } );
                    }

                    models.Add( new JObject
                    {
                        {"name", model.Name },
                        {"radius", model.BoundingRadius },
                        {"vertexCount", model.NumVertices },
                        {"verticesUrl", null },
                        {"meshes", meshes }
                    } );
                }

                parts.Add( new JObject
                {
                    {"name", mdl.GetBodyPartName( i )},
                    {"models", models}
                } );
            }

            var materials = new JArray();

            for ( var i = 0; i < mdl.NumTextures; ++i )
            {
                var vmtPath = mdl.GetMaterialName( provider, i );
                var vmt = VmtUtils.OpenVmt( vmtPath );
                materials.Add( VmtUtils.SerializeVmt( Request, vmt, vmtPath ) );
            }

            return new JObject
            {
                {"materials", materials},
                {"bodyParts", parts}
            };
        }
    }
}
