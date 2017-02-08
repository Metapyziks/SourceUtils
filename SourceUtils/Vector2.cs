using System;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout( LayoutKind.Sequential )]
    public struct Vector2 : IEquatable<Vector2>
    {
        public static readonly Vector2 Zero = new Vector2( 0f, 0f );

        public static Vector2 operator -( Vector2 vector )
        {
            return new Vector2( -vector.X, -vector.Y );
        }

        public static Vector2 operator +( Vector2 a, Vector2 b )
        {
            return new Vector2( a.X + b.X, a.Y + b.Y );
        }

        public static Vector2 operator -( Vector2 a, Vector2 b )
        {
            return new Vector2( a.X - b.X, a.Y - b.Y );
        }

        public static Vector2 operator *( Vector2 vector, float scalar )
        {
            return new Vector2( vector.X * scalar, vector.Y * scalar );
        }

        public static Vector2 operator *( Vector2 a, Vector2 b )
        {
            return new Vector2( a.X * b.X, a.Y * b.Y );
        }

        public static Vector2 operator /( Vector2 a, Vector2 b )
        {
            return new Vector2( a.X / b.X, a.Y / b.Y );
        }

        public float X;
        public float Y;

        public Vector2( float x, float y )
        {
            X = x;
            Y = y;
        }

        public bool Equals( Vector2 other )
        {
            return X == other.X && Y == other.Y;
        }

        public bool Equals( Vector2 other, float epsilon )
        {
            return Math.Abs( X - other.X ) < epsilon && Math.Abs( Y - other.Y ) < epsilon;
        }

        public override bool Equals( object obj )
        {
            return obj is Vector2 && Equals( (Vector2) obj );
        }

        public override int GetHashCode()
        {
            unchecked
            {
                var hashCode = X.GetHashCode();
                hashCode = (hashCode * 397) ^ Y.GetHashCode();
                return hashCode;
            }
        }

        public override string ToString()
        {
            return $"({X:F2}, {Y:F2})";
        }
    }
}
