using System;
using System.Collections.Generic;

namespace SourceUtils
{
    /// <summary>
    /// Adapted from https://github.com/ChevyRay/RectanglePacker
    /// </summary>
    public class RectanglePacker
    {
        public int Width { get; private set; }
        public int Height { get; private set; }

        public int MaxWidth { get; }
        public int MaxHeight { get; }

        private readonly List<Node> _nodes = new List<Node>();

        public RectanglePacker( int initialWidth = 1, int initialHeight = 1,
            int maxWidth = int.MaxValue, int maxHeight = int.MaxValue )
        {
            Width = initialWidth;
            Height = initialHeight;

            MaxWidth = maxWidth;
            MaxHeight = maxHeight;

            AddNode( 0, 0, int.MaxValue, int.MaxValue );
        }

        private int FindInsertionIndex( Node node, int first, int last )
        {
            while ( true )
            {
                if ( first == last ) return first;

                var mid = (first + last) >> 1;
                var comparison = node.CompareTo( _nodes[mid] );
                if ( comparison == 0 ) return mid;
                if ( comparison > 0 ) last = mid;
                else first = mid + 1;
            }
        }

        private void AddNode( int x, int y, int w, int h )
        {
            if ( w <= 0 || h <= 0 ) return;
            var node = new Node( x, y, w, h );

            var index = FindInsertionIndex( node, 0, _nodes.Count );
            _nodes.Insert( index, node );
        }

        private bool CanFitInNode( int w, int h, Node node )
        {
            return w <= node.W && h <= node.H && node.X + w <= Width && node.Y + h <= Height;
        }

        private bool TryExpand()
        {
            if ( Width >= MaxWidth && Height >= MaxHeight ) return false;

            if ( Width <= Height && Width < MaxWidth ) Width = Math.Min( MaxWidth, Width * 2 );
            else Height = Math.Min( MaxHeight, Height * 2 );

            return true;
        }

        public bool Pack( int w, int h, out int x, out int y )
        {
            do
            {
                for ( var i = _nodes.Count - 1; i >= 0; --i )
                {
                    if ( !CanFitInNode( w, h, _nodes[i] ) ) continue;

                    var node = _nodes[i];
                    _nodes.RemoveAt( i );

                    x = node.X;
                    y = node.Y;

                    var r = x + w;
                    var b = y + h;

                    if ( node.Bottom - b > node.Right - r )
                    {
                        AddNode( r, y, node.Right - r, h );
                        AddNode( x, b, node.W, node.Bottom - b );
                    }
                    else
                    {
                        AddNode( x, b, w, node.Bottom - b );
                        AddNode( r, y, node.Right - r, node.H );
                    }

                    return true;
                }
            } while ( TryExpand() );

            x = 0;
            y = 0;
            return false;
        }

        public struct Node : IComparable<Node>
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

            public int MaxSide => Math.Max( W, H );
            public int MinSide => Math.Min( W, H );

            public int Right
            {
                get { return X + W; }
            }

            public int Bottom
            {
                get { return Y + H; }
            }

            public int CompareTo( Node other )
            {
                var wComparison = MaxSide.CompareTo( other.MaxSide );
                return wComparison != 0 ? wComparison : MinSide.CompareTo( other.H );
            }
        }
    }
}