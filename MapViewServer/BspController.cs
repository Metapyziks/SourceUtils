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
    [Prefix(UrlPrefix)]
    public class BspController : ResourceController
    {
        public const string UrlPrefix = "/bsp";

        private ValveBspFile OpenBspFile( string mapName )
        {
            if ( !mapName.EndsWith( ".bsp" ) ) mapName = $"{mapName}.bsp";

            var path = Path.Combine( Program.CsgoDirectory, "maps", mapName );
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
                { "cluster", leaf.Cluster },
                { "min", leaf.Min.ToJson() },
                { "max", leaf.Max.ToJson() },
                { "area", leaf.AreaFlags.Area }
            };

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
            private readonly Dictionary<Vertex, int> _indices = new Dictionary<Vertex, int>();

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

            public void Clear()
            {
                _vertices.Clear();
                _indices.Clear();
            }

            public int Add( Vector3 pos, Vector3 normal )
            {
                var vertex = new Vertex( pos, normal );

                int index;
                if ( _indices.TryGetValue( vertex, out index ) ) return index;

                index = _vertices.Count;
                _vertices.Add( vertex );
                _indices.Add( vertex, index );
                return index;
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

            var indices = new JArray();

            for ( var surfIndex = face.FirstEdge; surfIndex < face.FirstEdge + face.NumEdges; ++surfIndex )
            {
                var surfEdge = bsp.SurfEdges[surfIndex];
                var edgeIndex = Math.Abs( surfEdge );
                var edge = bsp.Edges[edgeIndex];
                var vert = bsp.Vertices[surfEdge >= 0 ? edge.A : edge.B];

                indices.Add( verts.Add( vert, plane.Normal ) );
            }

            return new JObject
            {
                { "type", (int) FaceType.TriangleFan },
                { "indices", indices }
            };
        }
        
        [Get( "/{mapName}/faces" )]
        public JToken GetFaces( [Url] string mapName, int from = -1, int count = 1 )
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
            }

            return response;
        }

        [Get( "/{mapName}/bsp-models" )]
        public JToken GetBspModels( [Url] string mapName, int index = -1 )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "models", bsp.Models.Length );

                if ( index == -1 ) return response;
                
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
        public JToken GetVisibility( [Url] string mapName, int index = -1 )
        {
            var response = new JObject();

            using ( var bsp = OpenBspFile( mapName ) )
            {
                response.Add( "clusters", bsp.Visibility.NumClusters );

                if ( index == -1 ) return response;
                
                response.Add( "index", index );
                response.Add( "pvs", SerializeArray( bsp.Visibility[index] ) );
            }

            return response;
        }
    }
}
