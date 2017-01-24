using System;
using System.Net;
using SourceUtils;
using Newtonsoft.Json.Linq;
using Ziks.WebServer;
using Ziks.WebServer.Html;

namespace MapViewServer
{
    using static HtmlDocumentHelper;

    [Prefix(UrlPrefix)]
    public class VvdController : ResourceController
    {
        public const string UrlPrefix = "/vvd";
        
        public static string GetUrl( HttpListenerRequest request, string path, int lod = -1 )
        {
            var lodString = lod == -1 ? "{lod}" : lod.ToString();
            return $"http://{request.Url.Authority}{UrlPrefix}/{path}?format=json&lod={lodString}";
        }

        private const string DefaultFormat = "json";
        
        [Get( MatchAllUrl = false )]
        public HtmlElement Html( string format = DefaultFormat )
        {
            return new code( style => "display: block; white-space: pre-wrap" )
            {
                Json().ToString()
            };
        }
        
        [Get( MatchAllUrl = false )]
        public JToken Json( string format = DefaultFormat, int lod = -1, bool vertices = true, bool normals = true, bool texcoords = true )
        {
            if ( format != "json" ) throw NotFoundException();

            var vvd = Program.Loader.Load<ValveVertexFile>( FilePath );
            var response = new JObject
            {
                { "numLods", vvd.NumLods }
            };

            if ( lod < 0 ) return response;
            lod = Math.Min( lod, vvd.NumLods - 1 );

            response.Add( "lod", lod );

            var studioVerts = vvd.GetVertices( lod );
            if ( vertices )
            {
                var verts = new JArray();
                foreach ( var vert in studioVerts )
                {
                    verts.Add( vert.Position.X );
                    verts.Add( vert.Position.Y );
                    verts.Add( vert.Position.Z );
                }

                response.Add( "vertices", verts );
            }

            if ( normals )
            {
                var norms = new JArray();
                foreach ( var vert in studioVerts )
                {
                    norms.Add( vert.Normal.X );
                    norms.Add( vert.Normal.Y );
                    norms.Add( vert.Normal.Z );
                }

                response.Add( "normals", norms );
            }

            if ( texcoords )
            {
                var texcos = new JArray();
                foreach ( var vert in studioVerts )
                {
                    texcos.Add( vert.TexCoordX );
                    texcos.Add( vert.TexCoordY );
                }

                response.Add( "texcoords", texcos );
            }

            return response;
        }
    }
}