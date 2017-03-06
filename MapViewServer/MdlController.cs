using System;
using System.IO;
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
            return $"http://{request.Url.Authority}{UrlPrefix}/{GetProviderPrefix( mapName )}/{path}";
        }

        private JToken GetIndex( IResourceProvider provider, string filePath, string mapName = null )
        {
            StudioModelFile mdl;
            using ( var mdlStream = provider.OpenFile( filePath ) )
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
                            {"center", mesh.Center.ToJson()}
                        } );
                    }

                    var meshDataAction = mapName == null ? nameof( GetVpkMeshData ) : nameof( GetPakMeshData );

                    models.Add( new JObject
                    {
                        {"name", model.Name},
                        {"radius", model.BoundingRadius},
                        {
                            "meshDataUrl", GetActionUrl( meshDataAction,
                                ResourcePath( filePath ),
                                Replace( "mapName", mapName ),
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
                var vmtPath = provider is ValveBspFile.PakFileLump
                    ? mdl.GetMaterialName( i, provider, Resources )
                    : mdl.GetMaterialName( i, provider );

                if ( !vmtPath.Contains( "/" ) )
                {
                    var mdlDir = Path.GetDirectoryName( filePath );
                    vmtPath = Path.Combine( mdlDir, vmtPath ).Replace( '\\', '/' );
                }

                var vmt = mapName == null
                    ? VmtUtils.OpenVmt( vmtPath )
                    : VmtUtils.OpenVmt( BspController.GetBspFile( Request, mapName ), vmtPath );

                materials.Add( vmt == null ? null : VmtUtils.SerializeVmt( Request, vmt, vmtPath ) );
            }

            return new JObject
            {
                {"materials", materials},
                {"bodyParts", parts}
            };
        }

        [Get( "/vpk", MatchAllUrl = false, Extension = ".mdl")]
        public JToken GetIndex()
        {
            return GetIndex( Resources, FilePath );
        }

        [Get( "/pak/{mapName}", MatchAllUrl = false, Extension = ".mdl")]
        public JToken GetIndex([Url] string mapName)
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            return GetIndex( bsp.PakFile, FilePath, mapName );
        }

        private static Func<StudioVertex, string> GetVertSerializer( MeshComponent components )
        {
            switch ( components )
            {
                case MeshComponent.Position | MeshComponent.Uv | MeshComponent.Rgb:
                    return vert => $"{vert.Position.X},{vert.Position.Y},{vert.Position.Z},{vert.TexCoordX},{vert.TexCoordY},0,255,0";
                default:
                    throw new NotImplementedException();
            }
        }

        private JToken GetMeshData( IResourceProvider provider, int bodyPart, int model, int lod )
        {
            var mdlPath = FilePath.Replace( ".mesh", ".mdl" );
            var vvdPath = FilePath.Replace( ".mesh", ".vvd" );
            var vtxPath = FilePath.Replace( ".mesh", ".dx90.vtx" );
            
            StudioModelFile mdl;
            using ( var mdlStream = provider.OpenFile( mdlPath ) )
            {
                mdl = new StudioModelFile( mdlStream );
            }

            ValveVertexFile vvd;
            using ( var vvdStream = provider.OpenFile( vvdPath ) )
            {
                vvd = new ValveVertexFile( vvdStream );
            }

            const MeshComponent components = MeshComponent.Position | MeshComponent.Uv | MeshComponent.Rgb;

            ValveTriangleFile vtx;
            using ( var vtxStream = provider.OpenFile( vtxPath ) )
            {
                vtx = new ValveTriangleFile( vtxStream, mdl, vvd );
            }

            var array = new JArray();

            var meshCount = vtx.GetMeshCount( bodyPart, model, lod );
            for ( var i = 0; i < meshCount; ++i )
            {
                int indexOffset, indexCount, vertexOffset, vertexCount;
                vtx.GetMeshData( bodyPart, model, lod, i, out indexOffset, out indexCount, out vertexOffset, out vertexCount );

                array.Add( new JObject
                {
                    {"type", (int) PrimitiveType.TriangleList},
                    {"material", mdl.GetMesh( bodyPart, model, i ).Material},
                    {"indexOffset", indexOffset},
                    {"indexCount", indexCount},
                    {"vertexOffset", vertexOffset},
                    {"vertexCount", vertexCount}
                } );
            }

            var indexArray = new int[vtx.GetIndexCount( bodyPart, model, lod )];
            vtx.GetIndices( bodyPart, model, lod, indexArray );

            var vertArray = new StudioVertex[vtx.GetVertexCount( bodyPart, model, lod )];
            vtx.GetVertices( bodyPart, model, lod, vertArray );

            return new JObject
            {
                {"components", (int) components },
                {"elements", array},
                {"vertices", SerializeArray( vertArray, GetVertSerializer(components), false )},
                {"indices", SerializeArray( indexArray )}
            };
        }
        
        [Get("/vpk", MatchAllUrl = false, Extension = ".mesh")]
        public JToken GetVpkMeshData( int bodyPart, int model, int lod )
        {
            return GetMeshData( Resources, bodyPart, model, lod );
        }
        
        [Get("/pak/{mapName}", MatchAllUrl = false, Extension = ".mesh")]
        public JToken GetPakMeshData( [Url] string mapName, int bodyPart, int model, int lod )
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            return GetMeshData( bsp.PakFile, bodyPart, model, lod );
        }
    }
}
