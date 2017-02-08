using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SourceUtils
{
    /*
        Based on the Public Domain MaxRectsBinPack.cpp source by Jukka Jylänki
        https://github.com/juj/RectangleBinPack/
 
        Ported to C# by Sven Magnus with some edits by James King.
        This version is also public domain - do whatever you want with it.
    */

    internal class MaxRectsBinPack
    {
        public int BinWidth = 0;
        public int BinHeight = 0;

        public int Padding = 0;

        public readonly List<IntRect> UsedRectangles = new List<IntRect>();
        public readonly List<IntRect> FreeRectangles = new List<IntRect>();

        public MaxRectsBinPack(int width, int height)
        {
            Init(width, height);
        }

        public void Init(int width, int height)
        {
            BinWidth = width;
            BinHeight = height;

            var n = new IntRect(0, 0, width, height);

            UsedRectangles.Clear();

            FreeRectangles.Clear();
            FreeRectangles.Add(n);
        }

        public bool Insert<T>(IEnumerable<T> items, Func<T, IntVector2> sizeFunc, Action<int, T, IntRect> setFunc)
        {
            var index = 0;
            var rects = items
                .Select( x => new {item = x, index = index++, size = sizeFunc( x )} )
                .Where( x => x.size.X > 0 || x.size.Y > 0 )
                .ToList();

            while (rects.Count > 0) {
                var bestScore1 = int.MaxValue;
                var bestScore2 = int.MaxValue;
                var bestIntRectanglendex = -1;
                var bestNode = new IntRect();

                for (var i = 0; i < rects.Count; ++i) {
                    var pair = rects[i];

                    int score1, score2;
                    var newNode = ScoreRect(pair.size.X + Padding, pair.size.Y + Padding, out score1, out score2);

                    if (score1 > bestScore1 || (score1 == bestScore1 && score2 >= bestScore2)) continue;

                    bestScore1 = score1;
                    bestScore2 = score2;
                    bestNode = newNode;
                    bestIntRectanglendex = i;
                }

                if (bestIntRectanglendex == -1)
                    return false;

                PlaceRect(ref bestNode);
                setFunc(rects[bestIntRectanglendex].index, rects[bestIntRectanglendex].item,
                    new IntRect(bestNode.X, bestNode.Y, bestNode.Width - Padding, bestNode.Height - Padding));
                rects.RemoveAt(bestIntRectanglendex);
            }

            return true;
        }

        void PlaceRect(ref IntRect node)
        {
            var numRectanglesToProcess = FreeRectangles.Count;
            for (var i = 0; i < numRectanglesToProcess; ++i) {
                if (!SplitFreeNode(FreeRectangles[i], ref node)) continue;

                FreeRectangles.RemoveAt(i);
                --i;
                --numRectanglesToProcess;
            }

            PruneFreeList();

            UsedRectangles.Add(node);
        }

        IntRect ScoreRect(int width, int height, out int score1, out int score2)
        {
            var newNode = FindPositionForNewNodeBottomLeft(width, height, out score1, out score2);
            if (newNode.Height != 0) return newNode;

            score1 = int.MaxValue;
            score2 = int.MaxValue;

            return newNode;
        }

        /// Computes the ratio of used surface area.
        public float Occupancy()
        {
            var usedSurfaceArea = UsedRectangles.Aggregate<IntRect, ulong>(0,
                (current, t) => current + (uint) t.Width * (uint) t.Height);

            return (float) usedSurfaceArea / (BinWidth * BinHeight);
        }

        IntRect FindPositionForNewNodeBottomLeft(int width, int height, out int bestY, out int bestX)
        {
            var bestNode = new IntRect();

            bestX = int.MaxValue;
            bestY = int.MaxValue;

            foreach (var rect in FreeRectangles) {
                if (rect.Width < width || rect.Height < height) continue;

                var top = rect.Y - height;
                var right = rect.X - width;

                if (bestX != int.MaxValue && Math.Max(top, right) >= Math.Max(bestY, bestX)) continue;

                bestNode.X = rect.X;
                bestNode.Y = rect.Y;
                bestNode.Width = width;
                bestNode.Height = height;
                bestY = top;
                bestX = right;
            }

            return bestNode;
        }

        bool SplitFreeNode(IntRect freeNode, ref IntRect usedNode)
        {
            // Test with SAT if the rectangles even intersect.
            if (usedNode.X >= freeNode.X + freeNode.Width || usedNode.X + usedNode.Width <= freeNode.X ||
                usedNode.Y >= freeNode.Y + freeNode.Height || usedNode.Y + usedNode.Height <= freeNode.Y)
                return false;

            if (usedNode.X < freeNode.X + freeNode.Width && usedNode.X + usedNode.Width > freeNode.X) {
                // New node at the top side of the used node.
                if (usedNode.Y > freeNode.Y && usedNode.Y < freeNode.Y + freeNode.Height) {
                    IntRect newNode = freeNode;
                    newNode.Height = usedNode.Y - newNode.Y;
                    FreeRectangles.Add(newNode);
                }

                // New node at the bottom side of the used node.
                if (usedNode.Y + usedNode.Height < freeNode.Y + freeNode.Height) {
                    IntRect newNode = freeNode;
                    newNode.Y = usedNode.Y + usedNode.Height;
                    newNode.Height = freeNode.Y + freeNode.Height - (usedNode.Y + usedNode.Height);
                    FreeRectangles.Add(newNode);
                }
            }

            if (usedNode.Y < freeNode.Y + freeNode.Height && usedNode.Y + usedNode.Height > freeNode.Y) {
                // New node at the left side of the used node.
                if (usedNode.X > freeNode.X && usedNode.X < freeNode.X + freeNode.Width) {
                    IntRect newNode = freeNode;
                    newNode.Width = usedNode.X - newNode.X;
                    FreeRectangles.Add(newNode);
                }

                // New node at the right side of the used node.
                if (usedNode.X + usedNode.Width < freeNode.X + freeNode.Width) {
                    IntRect newNode = freeNode;
                    newNode.X = usedNode.X + usedNode.Width;
                    newNode.Width = freeNode.X + freeNode.Width - (usedNode.X + usedNode.Width);
                    FreeRectangles.Add(newNode);
                }
            }

            return true;
        }

        void PruneFreeList()
        {
            for (var i = 0; i < FreeRectangles.Count; ++i)
                for (var j = i + 1; j < FreeRectangles.Count; ++j) {
                    if (IsContainedIn(FreeRectangles[i], FreeRectangles[j])) {
                        FreeRectangles.RemoveAt(i);
                        --i;
                        break;
                    }

                    if (!IsContainedIn(FreeRectangles[j], FreeRectangles[i])) continue;

                    FreeRectangles.RemoveAt(j);
                    --j;
                }
        }

        static bool IsContainedIn(IntRect a, IntRect b)
        {
            return a.X >= b.X && a.Y >= b.Y
                && a.X + a.Width <= b.X + b.Width
                && a.Y + a.Height <= b.Y + b.Height;
        }
    }
}
