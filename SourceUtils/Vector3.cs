using System;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout( LayoutKind.Sequential )]
    public struct Vector3 : IEquatable<Vector3>
    {
        public static Vector3 operator -( Vector3 vector )
        {
            return new Vector3( -vector.X, -vector.Y, -vector.Z );
        }

        public static Vector3 operator +( Vector3 a, Vector3 b )
        {
            return new Vector3( a.X + b.X, a.Y + b.Y, a.Z + b.Z );
        }

        public static Vector3 operator -( Vector3 a, Vector3 b )
        {
            return new Vector3( a.X - b.X, a.Y - b.Y, a.Z - b.Z );
        }

        public static Vector3 operator *( Vector3 a, Vector3 b )
        {
            return new Vector3( a.X * b.X, a.Y * b.Y, a.Z * b.Z );
        }

        public static Vector3 operator *( Vector3 vec, float scalar )
        {
            return new Vector3( vec.X * scalar, vec.Y * scalar, vec.Z * scalar );
        }
        
        public static Vector3 operator *( float scalar, Vector3 vec )
        {
            return new Vector3( vec.X * scalar, vec.Y * scalar, vec.Z * scalar );
        }

        public float X;
        public float Y;
        public float Z;

        public float LengthSquared => X * X + Y * Y + Z * Z;

        public Vector3( float x, float y, float z )
        {
            X = x;
            Y = y;
            Z = z;
        }

        public bool Equals( Vector3 other )
        {
            return X == other.X && Y == other.Y && Z == other.Z;
        }

        public bool Equals( Vector3 other, float epsilon )
        {
            return Math.Abs( X - other.X ) < epsilon && Math.Abs( Y - other.Y ) < epsilon &&
                   Math.Abs( Z - other.Z ) < epsilon;
        }

        public override bool Equals( object obj )
        {
            return obj is Vector3 && Equals( (Vector3) obj );
        }

        public override int GetHashCode()
        {
            unchecked
            {
                var hashCode = X.GetHashCode();
                hashCode = (hashCode * 397) ^ Y.GetHashCode();
                hashCode = (hashCode * 397) ^ Z.GetHashCode();
                return hashCode;
            }
        }

        public override string ToString()
        {
            return $"({X:F2}, {Y:F2}, {Z:F2})";
        }
    }
}
