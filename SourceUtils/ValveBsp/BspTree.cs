using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils.ValveBsp
{
    public class BspTree
    {
        internal interface IElem
        {
            void GetIntersectingLeaves( Vector3[] corners, List<Leaf> outLeaves );
        }

        private class Node : IElem
        {
            public readonly int Index;
            public readonly BspNode Info;

            public readonly Plane Plane;

            public readonly IElem ChildA;
            public readonly IElem ChildB;

            public IElem this[ int index ]
            {
                get
                {
                    switch ( index )
                    {
                        case 0: return ChildA;
                        case 1: return ChildB;
                        default: throw new IndexOutOfRangeException();
                    }
                }
            }

            public Node( ValveBspFile bsp, int index )
            {
                Index = index;
                Info = bsp.Nodes[index];

                Plane = bsp.Planes[Info.PlaneNum];

                ChildA = Info.ChildA.IsLeaf ? (IElem) new Leaf( bsp, Info.ChildA.Index ) : new Node( bsp, Info.ChildA.Index );
                ChildB = Info.ChildB.IsLeaf ? (IElem) new Leaf( bsp, Info.ChildB.Index ) : new Node( bsp, Info.ChildB.Index );
            }

            void IElem.GetIntersectingLeaves( Vector3[] corners, List<Leaf> outLeaves )
            {
                bool front = false, back = false;

                for ( int i = 0, count = corners.Length; i < count; ++i )
                {
                    if ( Plane.IsInFront( corners[i] ) )
                    {
                        front = true;
                        if ( back ) break;
                    }
                    else
                    {
                        back = true;
                        if ( front ) break;
                    }
                }

                if ( front ) ChildA.GetIntersectingLeaves( corners, outLeaves );
                if ( back ) ChildB.GetIntersectingLeaves( corners, outLeaves );
            }
        }

        public class Leaf : IElem
        {
            public readonly int Index;
            public readonly IBspLeaf Info;

            public Leaf( ValveBspFile bsp, int index )
            {
                Index = index;
                Info = bsp.Leaves[index];
            }

            void IElem.GetIntersectingLeaves( Vector3[] corners, List<Leaf> outLeaves )
            {
                if ( Info.Cluster != -1 ) outLeaves.Add( this );
            }
        }

        private readonly ValveBspFile _bsp;
        private readonly Node _headNode;
        
        public readonly BspModel Info;

        public BspTree( ValveBspFile bsp, int modelIndex )
        {
            _bsp = bsp;
            Info = bsp.Models[modelIndex];

            _headNode = new Node( bsp, Info.HeadNode );
        }

        [ThreadStatic]
        private static Vector3[] _sCorners;

        public IEnumerable<Leaf> GetIntersectingLeaves( Vector3 min, Vector3 max )
        {
            var list = new List<Leaf>();
            GetIntersectingLeaves( min, max, list );
            return list;
        }

        public void GetIntersectingLeaves( Vector3 min, Vector3 max, List<Leaf> outLeaves )
        {
            if ( _sCorners == null ) _sCorners = new Vector3[8];

            _sCorners[0] = new Vector3( min.X, min.Y, min.Z );
            _sCorners[1] = new Vector3( max.X, min.Y, min.Z );
            _sCorners[2] = new Vector3( min.X, max.Y, min.Z );
            _sCorners[3] = new Vector3( max.X, max.Y, min.Z );
            _sCorners[4] = new Vector3( min.X, min.Y, max.Z );
            _sCorners[5] = new Vector3( max.X, min.Y, max.Z );
            _sCorners[6] = new Vector3( min.X, max.Y, max.Z );
            _sCorners[7] = new Vector3( max.X, max.Y, max.Z );

            ((IElem) _headNode).GetIntersectingLeaves( _sCorners, outLeaves );
        }
    }
}
