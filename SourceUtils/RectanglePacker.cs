using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils
{
    /// <summary>
    /// Adapted from https://github.com/ChevyRay/RectanglePacker
    /// </summary>
    public class RectanglePacker
    {
        public int Width { get; private set; }
        public int Height { get; private set; }

        List<Node> horzNodes = new List<Node>();
        List<Node> vertNodes = new List<Node>();
        List<Node> coreNodes = new List<Node>();

        public RectanglePacker( int width, int height )
        {
            Width = width;
            Height = height;
            AddNode( coreNodes, 0, 0, width, height );
        }

        private void AddNode( List<Node> list, int x, int y, int w, int h )
        {
            if ( w <= 0 || h <= 0 ) return;
            list.Add( new Node( x, y, w, h ) );
        }

        private bool PackList( List<Node> list, int w, int h, out int x, out int y )
        {
            for ( int i = 0; i < list.Count; ++i )
            {
                if ( w > list[i].W || h > list[i].H ) continue;

                var node = list[i];
                list.RemoveAt( i );
                x = node.X;
                y = node.Y;
                int r = x + w;
                int b = y + h;
                AddNode( horzNodes, r, y, node.Right - r, h );
                AddNode( vertNodes, x, b, w, node.Bottom - b );
                AddNode( coreNodes, r, b, node.Right - r, node.Bottom - b );
                Width = Math.Max( Width, r );
                Height = Math.Max( Height, b );
                return true;
            }
            x = 0;
            y = 0;
            return false;
        }

        public bool Pack( int w, int h, out int x, out int y )
        {
            return PackList( horzNodes, w, h, out x, out y )
                || PackList( vertNodes, w, h, out x, out y )
                || PackList( coreNodes, w, h, out x, out y );
        }

        public struct Node
        {
            public int X;
            public int Y;
            public int W;
            public int H;

            public Node( int x, int y, int w, int h )
            {
                X = x;
                Y = y;
                W = w;
                H = h;
            }

            public int Right
            {
                get { return X + W; }
            }

            public int Bottom
            {
                get { return Y + H; }
            }
        }
    }
}