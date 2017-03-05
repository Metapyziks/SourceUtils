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
                            {"center", mesh.Center.ToJson()},
                            {"vertexOffset", mesh.VertexOffset}
                        } );
                    }

                    var verticesAction = mapName == null ? nameof( GetVpkVertices ) : nameof( GetPakVertices );
                    var trianglesAction = mapName == null ? nameof( GetVpkTriangles ) : nameof( GetPakTriangles );

                    models.Add( new JObject
                    {
                        {"name", model.Name},
                        {"radius", model.BoundingRadius},
                        {
                            "verticesUrl", GetActionUrl( verticesAction,
                                ResourcePath( filePath ),
                                Replace( "mapName", mapName ),
                                Replace( "index", model.VertexIndex ),
                                Replace( "count", model.NumVertices ) )
                        },
                        {
                            "trianglesUrl", GetActionUrl( trianglesAction,
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

        private JToken GetVertices( IResourceProvider provider, int index, int count )
        {
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

        [Get("/vpk", MatchAllUrl = false, Extension = ".vvd")]
        public JToken GetVpkVertices( int index, int count )
        {
            return GetVertices( Resources, index, count );
        }

        [Get("/pak/{mapName}", MatchAllUrl = false, Extension = ".vvd")]
        public JToken GetPakVertices( [Url] string mapName, int index, int count )
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            return GetVertices( bsp.PakFile, index, count );
        }

        private JToken GetTriangles( IResourceProvider provider, int bodyPart, int model, int lod )
        {
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
        
        [Get("/vpk", MatchAllUrl = false, Extension = ".vtx")]
        public JToken GetVpkTriangles( int bodyPart, int model, int lod )
        {
            return GetTriangles( Resources, bodyPart, model, lod );
        }
        
        [Get("/pak/{mapName}", MatchAllUrl = false, Extension = ".vtx")]
        public JToken GetPakTriangles( [Url] string mapName, int bodyPart, int model, int lod )
        {
            var bsp = BspController.GetBspFile( Request, mapName );
            return GetTriangles( bsp.PakFile, bodyPart, model, lod );
        }
    }
}
