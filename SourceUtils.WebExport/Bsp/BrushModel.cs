using Newtonsoft.Json;
using SourceUtils.ValveBsp;
using Ziks.WebServer;

namespace SourceUtils.WebExport.Bsp
{
    public struct Plane
    {
        public static implicit operator Plane(ValveBsp.Plane plane)
        {
            return new Plane(plane);
        }

        [JsonProperty("norm")]
        public Vector3 Normal { get; set; }

        [JsonProperty("dist")]
        public float Dist { get; set; }

        public Plane(ValveBsp.Plane plane)
        {
            Normal = plane.Normal;
            Dist = plane.Dist;
        }
    }

    public struct Vector3
    {
        public static implicit operator Vector3(SourceUtils.Vector3 vec)
        {
            return new Vector3(vec);
        }

        public static implicit operator Vector3(Vector3S vec)
        {
            return new Vector3(vec);
        }

        [JsonProperty("x")]
        public float X;

        [JsonProperty("y")]
        public float Y;

        [JsonProperty("z")]
        public float Z;

        public Vector3(SourceUtils.Vector3 vec)
        {
            X = vec.X;
            Y = vec.Y;
            Z = vec.Z;
        }

        public Vector3(Vector3S vec)
        {
            X = vec.X;
            Y = vec.Y;
            Z = vec.Z;
        }
    }

    public class BspElement
    {
        [JsonProperty("min")]
        public Vector3 Min { get; set; }

        [JsonProperty("max")]
        public Vector3 Max { get; set; }
    }

    public class BspNode : BspElement
    {
        [JsonProperty("plane")]
        public Plane Plane { get; set; }

        [JsonProperty("children")]
        public BspElement[] Children { get; } = new BspElement[2];
    }

    public class BspLeaf : BspElement
    {
        [JsonProperty("index")]
        public int Index { get; set; }

        [JsonProperty("flags")]
        public LeafFlags Flags { get; set; }

        [JsonProperty("hasFaces")]
        public bool HasFaces { get; set; }

        [JsonProperty("cluster")]
        public int? Cluster { get; set; }
    }

    public class BspModel
    {
        [JsonProperty("index")]
        public int Index { get; set; }

        [JsonProperty("min")]
        public Vector3 Min { get; set; }

        [JsonProperty("max")]
        public Vector3 Max { get; set; }

        [JsonProperty("origin")]
        public Vector3 Origin { get; set; }

        [JsonProperty("headNode")]
        public BspNode HeadNode { get; set; }
    }

    [Prefix( "/maps/{map}/geom" )]
    class ModelController : ResourceController
    {
        private BspElement ConvertElement( ValveBspFile bsp, BspChild child )
        {
            return child.IsLeaf ? (BspElement) ConvertLeaf( bsp, child.Index ) : ConvertNode( bsp, child.Index );
        }

        private BspNode ConvertNode( ValveBspFile bsp, int index )
        {
            var node = bsp.Nodes[index];
            var response = new BspNode
            {
                Min = node.Min,
                Max = node.Max,
                Plane = bsp.Planes[node.PlaneNum]
            };

            response.Children[0] = ConvertElement( bsp, node.ChildA );
            response.Children[1] = ConvertElement( bsp, node.ChildB );

            return response;
        }

        private BspLeaf ConvertLeaf( ValveBspFile bsp, int index )
        {
            var leaf = bsp.Leaves[index];
            var response = new BspLeaf
            {
                Index = index,
                Min = leaf.Min,
                Max = leaf.Max,
                Flags = leaf.AreaFlags.Flags,
                HasFaces = leaf.NumLeafFaces > 0
            };

            if ( leaf.Cluster != -1 ) response.Cluster = leaf.Cluster;

            return response;
        }

        [Get("/model{index}.json")]
        public BspModel Get( [Url] string map, [Url] int index )
        {
            var bsp = Program.GetMap(map);
            var model = bsp.Models[index];

            return new BspModel
            {
                Index = index,
                Min = model.Min,
                Max = model.Max,
                Origin = model.Origin,
                HeadNode = ConvertNode( bsp, model.HeadNode )
            };
        }
    }
}
