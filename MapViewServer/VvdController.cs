using System;
using System.Linq;
using System.Net;
using System.Text;
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
        public JToken Json( string format = DefaultFormat, int lod = -1,
            bool vertices = true, bool normals = true, bool texcoords = true, bool tangents = true )
        {
            if ( format != "json" ) throw NotFoundException();

            var vvd = Program.Loader.Load<ValveVertexFile>( FilePath );
            var vtx = Program.Loader.Load<ValveTriangleFile>( FilePath.Replace( ".vvd", ".dx90.vtx" ) );

            var response = new JObject
            {
                { "numLods", vvd.NumLods }
            };

            if ( lod < 0 ) lod = int.MaxValue;
            lod = Math.Max( 0, Math.Min( lod, vvd.NumLods - 1 ) );

            response.Add( "lod", lod );

            var studioVerts = vvd.GetVertices( lod );
            var vertexOrder = vtx.GetVertices( lod );

            var select = vertexOrder.Select( i => studioVerts[i] );

            if ( vertices )
            {
                response.Add( "vertices", SerializeArray( select, vert =>
                    $"{vert.Position.X:F2},{vert.Position.Y:F2},{vert.Position.Z:F2}" ) );
            }

            if ( normals )
            {
                response.Add( "normals", SerializeArray( select, vert =>
                    $"{-vert.Normal.X:F2},{-vert.Normal.Y:F2},{-vert.Normal.Z:F2}" ) );
            }

            if ( texcoords )
            {
                response.Add( "texcoords", SerializeArray( select, vert =>
                    $"{vert.TexCoordX:F3},{1f - vert.TexCoordY:F3}" ) );
            }

            if ( tangents )
            {
                var tangentArr = vvd.GetTangents( lod );
                
                response.Add( "tangents", SerializeArray( vertexOrder.Select( i => tangentArr[i] ), tangent =>
                    $"{tangent.X:F2},{tangent.Y:F2},{tangent.Z:F2},{tangent.W}" ) );
            }

            return response;
        }
    }
}