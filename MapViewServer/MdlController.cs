using System;
using Newtonsoft.Json.Linq;
using SourceUtils;
using Ziks.WebServer;

namespace MapViewServer
{
    [Prefix("/mdl")]
    public class MdlController : ResourceController
    {
        [Get( MatchAllUrl = false, Extension = ".mdl")]
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
                        {"vertexOffset", model.VertexIndex },
                        {"vertexCount", model.NumVertices },
                        {"verticesUrl", GetActionUrl( nameof(GetVertices),
                            ResourcePath( FilePath ),
                            Replace( "index", model.VertexIndex ),
                            Replace( "count", model.NumVertices ) ) },
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

        private static Func<ValveVertexFile.StudioVertex, string> GetVertSerializer( MeshComponent components )
        {
            switch ( components )
            {
                case MeshComponent.Position | MeshComponent.Uv:
                    return vert => $"{vert.Position.X},{vert.Position.Y},{vert.Position.Z},{vert.TexCoordX},{vert.TexCoordY}";
                default:
                    throw new NotImplementedException();
            }
        }

        [Get(MatchAllUrl = false, Extension = ".vvd")]
        public JToken GetVertices( int index, int count )
        {
            var provider = Resources;

            ValveVertexFile vvd;
            using ( var vvdStream = provider.OpenFile( FilePath ) )
            {
                vvd = new ValveVertexFile( vvdStream );
            }

            var vertArray = new ValveVertexFile.StudioVertex[count];
            vvd.GetVertices( 0, vertArray, 0 );

            const MeshComponent components = MeshComponent.Position | MeshComponent.Uv;

            return new JObject
            {
                {"components", (int) components },
                {"vertices", SerializeArray( vertArray, GetVertSerializer(components) )}
            };
        }
    }
}
