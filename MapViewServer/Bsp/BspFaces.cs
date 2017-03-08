using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace MapViewServer
{
    partial class BspController
    {
        private enum FacesType
        {
            Leaf,
            Displacement
        }

        private struct FacesRequest
        {
            public readonly FacesType Type;
            public readonly int Index;

            public FacesRequest( string str )
            {
                switch ( str[0] )
                {
                    case 'l':
                        Type = FacesType.Leaf;
                        break;
                    case 'd':
                        Type = FacesType.Displacement;
                        break;
                    default:
                        throw new NotImplementedException();
                }

                Index = int.Parse( str.Substring( 1 ) );
            }

            public IEnumerable<int> GetFaceIndices( ValveBspFile bsp )
            {
                switch ( Type )
                {
                    case FacesType.Leaf:
                    {
                        var leaf = bsp.Leaves[Index];
                        for ( int i = leaf.FirstLeafFace, iEnd = leaf.FirstLeafFace + leaf.NumLeafFaces; i < iEnd; ++i )
                        {
                            yield return bsp.LeafFaces[i];
                        }

                        yield break;
                    }
                    case FacesType.Displacement:
                    {
                        yield return bsp.DisplacementInfos[Index].MapFace;
                        yield break;
                    }
                }
            }
        }

        private static readonly Regex _sFaceRequestsRegex = new Regex( @"^(?<item>[ld][0-9]+)(\s+(?<item>[ld][0-9]+))*$" );

        [Get( "/{mapName}/faces" )]
        public JToken GetFaces( [Url] string mapName, string tokens )
        {
            if ( CheckNotExpired( mapName ) ) return null;

            var match = _sFaceRequestsRegex.Match( tokens );
            if ( !match.Success ) throw BadParameterException( nameof( tokens ) );

            var array = new JArray();
            var vertArray = new VertexArray();

            var bsp = GetBspFile( Request, mapName );
            foreach ( var token in match.Groups["item"].Captures
                .Cast<Capture>()
                .Select( x => x.Value ) )
            {
                var request = new FacesRequest( token );
                vertArray.Clear();

                vertArray.ComponentMask = MeshComponent.Position | MeshComponent.Uv | MeshComponent.Uv2;

                if ( request.Type == FacesType.Displacement )
                {
                    vertArray.ComponentMask |= MeshComponent.Alpha;
                }

                foreach ( var faceIndex in request.GetFaceIndices( bsp ) )
                {
                    SerializeFace( bsp, faceIndex, vertArray );
                }

                array.Add( new JObject
                {
                    {"components", (int) vertArray.ComponentMask},
                    {"elements", vertArray.GetElements()},
                    {"vertices", vertArray.GetVertices( Compressed )},
                    {"indices", vertArray.GetIndices( Compressed )}
                } );
            }

            return new JObject
            {
                {"facesList", array}
            };
        }

        [ThreadStatic] private static List<int> _sIndicesBuffer;

        private static void SerializeDisplacement( ValveBspFile bsp, int faceIndex, ref Face face, ref Plane plane,
            VertexArray verts )
        {
            if ( face.NumEdges != 4 )
            {
                throw new Exception( "Expected displacement to have 4 edges." );
            }

            var disp = bsp.DisplacementManager[face.DispInfo];
            var texInfo = bsp.TextureInfos[face.TexInfo];

            var texData = bsp.TextureData[texInfo.TexData];
            var texScale = new Vector2( 1f / texData.Width, 1f / texData.Height );

            Vector3 c0, c1, c2, c3;
            disp.GetCorners( out c0, out c1, out c2, out c3 );

            var uv00 = GetUv( c0, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
            var uv10 = GetUv( c3, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
            var uv01 = GetUv( c1, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
            var uv11 = GetUv( c2, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;

            for ( var y = 0; y < disp.Subdivisions; ++y )
            {
                verts.BeginPrimitive();
                var v0 = (y + 0) / (float) disp.Subdivisions;
                var v1 = (y + 1) / (float) disp.Subdivisions;

                for ( var x = 0; x < disp.Size; ++x )
                {
                    var u = x / (float) disp.Subdivisions;

                    var p0 = disp.GetPosition( x, y + 0 );
                    var p1 = disp.GetPosition( x, y + 1 );

                    var uv0 = (uv00 * (1f - u) + uv10 * u) * (1f - v0) + (uv01 * (1f - u) + uv11 * u) * v0;
                    var uv1 = (uv00 * (1f - u) + uv10 * u) * (1f - v1) + (uv01 * (1f - u) + uv11 * u) * v1;

                    verts.AddVertex( p0, texCoord: uv0, alpha: disp.GetAlpha( x, y + 0 ) / 255f,
                        lightmapCoord: GetLightmapUv( bsp, x, y + 0, disp.Subdivisions, faceIndex, ref face ) );
                    verts.AddVertex( p1, texCoord: uv1, alpha: disp.GetAlpha( x, y + 1 ) / 255f,
                        lightmapCoord: GetLightmapUv( bsp, x, y + 1, disp.Subdivisions, faceIndex, ref face ) );
                }

                verts.CommitPrimitive( PrimitiveType.TriangleStrip, texData.NameStringTableId );
            }
        }

        private static Vector2 GetUv( Vector3 pos, TexAxis uAxis, TexAxis vAxis )
        {
            return new Vector2(
                pos.Dot( uAxis.Normal ) + uAxis.Offset,
                pos.Dot( vAxis.Normal ) + vAxis.Offset );
        }

        private static Vector2 GetLightmapUv( ValveBspFile bsp, Vector3 pos, int faceIndex, ref Face face,
            ref TextureInfo texInfo )
        {
            var lightmapUv = GetUv( pos, texInfo.LightmapUAxis, texInfo.LightmapVAxis );

            Vector2 min, size;
            bsp.LightmapLayout.GetUvs( faceIndex, out min, out size );

            lightmapUv.X -= face.LightMapOffsetX - .5f;
            lightmapUv.Y -= face.LightMapOffsetY - .5f;
            lightmapUv.X /= face.LightMapSizeX + 1f;
            lightmapUv.Y /= face.LightMapSizeY + 1f;

            lightmapUv.X *= size.X;
            lightmapUv.Y *= size.Y;
            lightmapUv.X += min.X;
            lightmapUv.Y += min.Y;

            return lightmapUv;
        }

        private static Vector2 GetLightmapUv( ValveBspFile bsp, int x, int y, int dispSize, int faceIndex, ref Face face )
        {
            var lightmapUv = new Vector2( (float) x / dispSize, (float) y / dispSize );

            Vector2 min, size;
            bsp.LightmapLayout.GetUvs( faceIndex, out min, out size );

            return lightmapUv * size + min;
        }

        private static void SerializeFace( ValveBspFile bsp, int index, VertexArray verts )
        {
            const SurfFlags ignoreFlags = SurfFlags.NODRAW | SurfFlags.LIGHT;
            const SurfFlags skyFlags = SurfFlags.SKY2D | SurfFlags.SKY;

            var face = bsp.FacesHdr[index];
            var texInfo = bsp.TextureInfos[face.TexInfo];
            var plane = bsp.Planes[face.PlaneNum];
            
            if ( (texInfo.Flags & ignoreFlags) != 0 || texInfo.TexData < 0 ) return;
            var isSky = (texInfo.Flags & skyFlags) != 0;

            if ( face.DispInfo != -1 )
            {
                SerializeDisplacement( bsp, index, ref face, ref plane, verts );
                return;
            }

            var texData = bsp.TextureData[texInfo.TexData];
            var texScale = new Vector2( 1f / texData.Width, 1f / texData.Height );

            verts.BeginPrimitive();

            for ( int i = face.FirstEdge, iEnd = face.FirstEdge + face.NumEdges; i < iEnd; ++i )
            {
                var vert = bsp.GetVertexFromSurfEdgeId( i );
                var uv = GetUv( vert, texInfo.TextureUAxis, texInfo.TextureVAxis ) * texScale;
                var uv2 = GetLightmapUv( bsp, vert, index, ref face, ref texInfo );

                verts.AddVertex( vert, texCoord: uv, lightmapCoord: uv2 );
            }

            var numPrimitives = face.NumPrimitives & 0x7fff;
            var texStringIndex = isSky ? -1 : texData.NameStringTableId;

            if ( numPrimitives == 0 )
            {
                verts.CommitPrimitive( PrimitiveType.TriangleFan, texStringIndex );
                return;
            }

            if ( _sIndicesBuffer == null ) _sIndicesBuffer = new List<int>();

            for ( int i = face.FirstPrimitive, iEnd = face.FirstPrimitive + numPrimitives; i < iEnd; ++i )
            {
                var primitive = bsp.Primitives[i];
                for ( int j = primitive.FirstIndex, jEnd = primitive.FirstIndex + primitive.IndexCount; j < jEnd; ++j )
                {
                    _sIndicesBuffer.Add( bsp.PrimitiveIndices[j] );
                }

                verts.CommitPrimitive( primitive.Type, texStringIndex, _sIndicesBuffer );
                _sIndicesBuffer.Clear();
            }
        }
    }
}
