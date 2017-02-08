using System;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout(LayoutKind.Sequential)]
    public struct IntVector2 : IEquatable<IntVector2>
    {
        public static readonly IntVector2 Zero = new IntVector2( 0, 0 );

        public int X;
        public int Y;

        public IntVector2( int x, int y )
        {
            X = x;
            Y = y;
        }

        public bool Equals( IntVector2 other )
        {
            return X == other.X && Y == other.Y;
        }

        public override bool Equals( object obj )
        {
            if ( ReferenceEquals( null, obj ) ) return false;
            return obj is IntVector2 && Equals( (IntVector2) obj );
        }

        public override int GetHashCode()
        {
            unchecked
            {
                return (X * 397) ^ Y;
            }
        }
    }
}
