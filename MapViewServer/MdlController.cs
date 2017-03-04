using System;
using System.Net;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace MapViewServer
{
    [Prefix(UrlPrefix)]
    public class MdlController : ResourceController
    {
        public const string UrlPrefix = "/mdl";

        public static string GetUrl( HttpListenerRequest request, string path, string mapName = null )
        {
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}";
        }

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

            for ( var bodyPartIndex = 0; bodyPartIndex < mdl.BodyPartCount; ++bodyPartIndex )
            {
                var models = new JArray();

                var modelIndex = 0;
                foreach ( var model in mdl.GetModels( bodyPartIndex ) )
                {
                    var meshes = new JArray();

                    foreach ( var mesh in mdl.GetMeshes( model.MeshIndex, model.NumMeshes ) )
                    {
                        meshes.Add( new JObject
                        {
                            {"material", mesh.Material},
                            {"center", mesh.Center.ToJson()},
                            {"vertexOffset", mesh.VertexOffset}
                        } );
                    }

                    models.Add( new JObject
                    {
                        {"name", model.Name},
                        {"radius", model.BoundingRadius},
                        {
                            "verticesUrl", GetActionUrl( nameof( GetVertices ),
                                ResourcePath( FilePath ),
                                Replace( "index", model.VertexIndex ),
                                Replace( "count", model.NumVertices ) )
                        },
                        {
                            "trianglesUrl", GetActionUrl( nameof( GetTriangles ),
                                ResourcePath( FilePath ),
                                Replace( "bodyPart", bodyPartIndex ),
                                Replace( "model", modelIndex ),
                                Replace( "lod", 0 ) )
                        },
                        {"meshes", meshes}
                    } );

                    ++modelIndex;
                }

                parts.Add( new JObject
                {
                    {"name", mdl.GetBodyPartName( bodyPartIndex )},
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
                {"vertices", SerializeArray( vertArray, GetVertSerializer(components), false )}
            };
        }

        [Get(MatchAllUrl = false, Extension = ".vtx")]
        public JToken GetTriangles( int bodyPart, int model, int lod )
        {
            var provider = Resources;

            var filePath = FilePath.Replace( ".vtx", ".dx90.vtx" );

            ValveTriangleFile vtx;
            using ( var vtxStream = provider.OpenFile( filePath ) )
            {
                vtx = new ValveTriangleFile( vtxStream );
            }

            var array = new JArray();

            var meshCount = vtx.GetMeshCount( bodyPart, model, lod );
            for ( var i = 0; i < meshCount; ++i )
            {
                int offset, count;
                vtx.GetMeshData( bodyPart, model, lod, i, out offset, out count );

                array.Add( new JObject
                {
                    {"type", (int) PrimitiveType.TriangleList},
                    {"offset", offset},
                    {"count", count}
                } );
            }

            var indexArray = new int[vtx.GetIndexCount( bodyPart, model, lod )];
            vtx.GetIndices( bodyPart, model, lod, indexArray );

            return new JObject
            {
                {"elements", array},
                {"indices", SerializeArray( indexArray )}
            };
        }
    }
}
