using System;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SourceUtils;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace MapViewServer
{
    [Prefix("/bsp")]
    public class BspController : ResourceController
    {
        private static string GetMapPath( string mapName )
        {
            if ( !mapName.EndsWith( ".bsp" ) ) mapName = $"{mapName}.bsp";

            return Path.Combine( Program.CsgoDirectory, "maps", mapName );
        }

        private ValveBspFile OpenBspFile( string mapName )
        {
            var path = GetMapPath( mapName );
            if ( !File.Exists( path ) ) throw NotFoundException( true );

            return new ValveBspFile( File.Open( path, FileMode.Open, FileAccess.Read, FileShare.Read ) );
        }

        private static JToken SerializeBspChild( ValveBspFile bsp, BspChild child )
        {
            return child.IsLeaf ? SerializeBspLeaf( bsp, child.Index ) : SerializeBspNode( bsp, child.Index );
        }

        private static JToken SerializeBspNode( ValveBspFile bsp, int index )
        {
            var node = bsp.Nodes[index];
            var plane = bsp.Planes[node.PlaneNum];

            return new JObject
            {
                { "plane", plane.ToJson() },
                { "min", node.Min.ToJson() },
                { "max", node.Max.ToJson() },
                { "children", new JArray {
                    SerializeBspChild( bsp, node.ChildA ),
                    SerializeBspChild( bsp, node.ChildB )
                } }
            };
        }

        public static JToken SerializeBspLeaf( ValveBspFile bsp, int index )
        {
            var leaf = bsp.Leaves[index];
            
            var response = new JObject
            {
                { "min", leaf.Min.ToJson() },
                { "max", leaf.Max.ToJson() },
                { "area", leaf.AreaFlags.Area }
            };

            if ( leaf.Cluster != -1 )
            {
                response.Add( "cluster", leaf.Cluster );
            }

            if ( leaf.NumLeafBrushes > 0 )
            {
                response.Add( "firstBrush", leaf.FirstLeafBrush );
                response.Add( "numBrushes", leaf.NumLeafBrushes );
            }

            if ( leaf.NumLeafFaces > 0 )
            {
                response.Add( "firstFace", leaf.FirstLeafFace );
                response.Add( "numFaces", leaf.NumLeafFaces );
            }

            return response;
        }

        public class VertexArray
        {
            private struct Vertex : IEquatable<Vertex>
            {
                public readonly Vector3 Position;
                public readonly Vector3 Normal;

                public Vertex( Vector3 position, Vector3 normal )
                {
                    Position = position;
                    Normal = normal;
                }

                public bool Equals( Vertex other )
                {
                    return Position.Equals( other.Position ) && Normal.Equals( other.Normal );
                }

                public override bool Equals( object obj )
                {
                    if ( ReferenceEquals( null, obj ) ) return false;
                    return obj is Vertex && Equals( (Vertex) obj );
                }

                public override int GetHashCode()
                {
                    return Position.GetHashCode();
                }
            }

            private readonly List<Vertex> _vertices = new List<Vertex>();
            private readonly List<int> _indices = new List<int>();
            private readonly Dictionary<Vertex, int> _indexMap = new Dictionary<Vertex, int>();

            public JToken GetVertices( BspController controller )
            {
                return controller.SerializeArray( _vertices,
                    vertex => $"{vertex.Position.X},{vertex.Position.Y},{vertex.Position.Z}" );
            }

            public JToken GetNormals( BspController controller )
            {
                return controller.SerializeArray( _vertices,
                    vertex => $"{vertex.Normal.X},{vertex.Normal.Y},{vertex.Normal.Z}" );
            }

            public JToken GetIndices( BspController controller )
            {
                return controller.SerializeArray( _indices );
            }

            public void Clear()
            {
                _vertices.Clear();
                _indices.Clear();
                _indexMap.Clear();
            }

            public int IndexCount => _indices.Count;

            public void Add( Vector3 pos, Vector3 normal )
            {
                var vertex = new Vertex( pos, normal );

                int index;
                if ( !_indexMap.TryGetValue( vertex, out index ) )
                {
                    index = _vertices.Count;
                    _vertices.Add( vertex );
                    _indexMap.Add( vertex, index );
                }

                _indices.Add( index );
            }
        }

        public enum FaceType
        {
            TriangleList,
            TriangleStrip,
            TriangleFan
        }

        public static JToken SerializeFace( ValveBspFile bsp, int index, VertexArray verts )
        {
            var face = bsp.FacesHdr[index];
            var plane = bsp.Planes[face.PlaneNum];

            var offset = verts.IndexCount;

            for ( var surfIndex = face.FirstEdge; surfIndex < face.FirstEdge + face.NumEdges; ++surfIndex )
            {
                var surfEdge = bsp.SurfEdges[surfIndex];
                var edgeIndex = Math.Abs( surfEdge );
                var edge = bsp.Edges[edgeIndex];
                var vert = bsp.Vertices[surfEdge >= 0 ? edge.A : edge.B];

                verts.Add( vert, plane.Normal );
            }

            return new JObject
            {
                { "drawMode", (int) FaceType.TriangleFan },
                { "offset", offset },
                { "count", verts.IndexCount }
            };
        }

        [Get( "/{_mapName}" )]
        public JToken GetIndex( [Url] string _mapName )
        {
            using ( var bsp = OpenBspFile( _mapName ) )
            {
                return new JObject
                {
                    {"name", _mapName},
                    {"numClusters", bsp.Visibility.NumClusters},
                    {"numModels", bsp.Models.Length},
                    {"modelUrl", GetActionUrl( nameof( GetModels ), mapName => _mapName )},
                    {"facesUrl", GetActionUrl( nameof( GetFaces ), mapName => _mapName )},
                    {"visibilityUrl", GetActionUrl( nameof( GetVisibility ), mapName => _mapName )}
                };
            }
        }

        [Get( "/{mapName}/faces" )]
        public JToken GetFaces( [Url] string mapName, int from, int count = 1 )
        {
            if ( from == -1 ) throw NotFoundException( true );

            var response = new JObject();
            var vertArray = new VertexArray();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                var faceArr = new JArray();

                for ( var i = from; i < from + count; ++i )
                {
                    faceArr.Add( SerializeFace( bsp, i, vertArray ) );
                }

                response.Add( "faces", faceArr );
                response.Add( "vertices", vertArray.GetVertices( this ) );
                response.Add( "normals", vertArray.GetNormals( this ) );
                response.Add( "indices", vertArray.GetIndices( this ) );
            }

            return response;
        }

        [Get( "/{mapName}/model" )]
        public JToken GetModels( [Url] string mapName, int index )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                var model = bsp.Models[index];
                var tree = SerializeBspNode( bsp, model.HeadNode );

                response.Add( "index", index );
                response.Add( "min", model.Min.ToJson() );
                response.Add( "max", model.Max.ToJson() );
                response.Add( "origin", model.Origin.ToJson() );
                response.Add( "tree", Compressed ? LZString.compressToBase64( tree.ToString( Formatting.None ) ) : tree );
            }

            return response;
        }

        [Get( "/{mapName}/visibility" )]
        public JToken GetVisibility( [Url] string mapName, int index )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "index", index );
                response.Add( "pvs", SerializeArray( bsp.Visibility[index] ) );
            }

            return response;
        }
    }
}
