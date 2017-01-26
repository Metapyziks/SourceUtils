using System;
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

        [ThreadStatic]
        private static StringBuilder _sBuilder;

        private JToken EncodeAttributes<TValue>( TValue[] verts, int[] ordering, bool compressed,
            Action<StringBuilder, TValue> action )
        {
            if ( _sBuilder == null ) _sBuilder = new StringBuilder();
            else _sBuilder.Remove( 0, _sBuilder.Length );

            _sBuilder.Append( "[" );
            for ( var i = 0; i < ordering.Length; ++i )
            {
                if ( i != 0 ) _sBuilder.Append( "," );
                action( _sBuilder, verts[ordering[i]] );
            }
            _sBuilder.Append( "]" );

            return compressed ? (JToken) LZString.compressToBase64( _sBuilder.ToString() ) : JArray.Parse( _sBuilder.ToString() );
        }
        
        [Get( MatchAllUrl = false )]
        public JToken Json( string format = DefaultFormat, int lod = -1,
            bool vertices = true, bool normals = true, bool texcoords = true, bool tangents = true, bool compressed = true )
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
            response.Add( "compressed", compressed );

            var studioVerts = vvd.GetVertices( lod );
            var vertexOrder = vtx.GetVertices( lod );

            if ( vertices )
            {
                response.Add( "vertices", EncodeAttributes( studioVerts, vertexOrder, compressed, ( builder, vert ) =>
                    builder.AppendFormat( "{0:F3},{1:F3},{2:F3}", vert.Position.X, vert.Position.Y, vert.Position.Z ) ) );
            }

            if ( normals )
            {
                response.Add( "normals", EncodeAttributes( studioVerts, vertexOrder, compressed, ( builder, vert ) =>
                    builder.AppendFormat( "{0:F3},{1:F3},{2:F3}", -vert.Normal.X, -vert.Normal.Y, -vert.Normal.Z ) ) );
            }

            if ( texcoords )
            {
                response.Add( "texcoords", EncodeAttributes( studioVerts, vertexOrder, compressed, ( builder, vert ) =>
                    builder.AppendFormat( "{0:F3},{1:F3}", vert.TexCoordX, 1f - vert.TexCoordY ) ) );
            }

            if ( tangents )
            {
                var tangentArr = vvd.GetTangents( lod );

                response.Add( "tangents", tangentArr == null ? null :
                    EncodeAttributes( tangentArr, vertexOrder, compressed, ( builder, tangent ) =>
                        builder.AppendFormat( "{0:F3},{1:F3},{2:F3},{3}", tangent.X, tangent.Y, tangent.Z, tangent.W ) ) );
            }

            return response;
        }
    }
}