using System;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout( LayoutKind.Sequential )]
    public struct Vector3 : IEquatable<Vector3>
    {
        public static readonly Vector3 Zero = new Vector3(0f, 0f, 0f);
        public static readonly Vector3 NaN = new Vector3( float.NaN, float.NaN, float.NaN );

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

        public static Vector3 Min( Vector3 a, Vector3 b )
        {
            return new Vector3( Math.Min( a.X, b.X ), Math.Min( a.Y, b.Y ), Math.Min( a.Z, b.Z ) );
        }

        public static Vector3 Max( Vector3 a, Vector3 b )
        {
            return new Vector3( Math.Max( a.X, b.X ), Math.Max( a.Y, b.Y ), Math.Max( a.Z, b.Z ) );
        }

        public float X;
        public float Y;
        public float Z;

        public float Length => (float) Math.Sqrt( LengthSquared );
        public float LengthSquared => X * X + Y * Y + Z * Z;

        public Vector3 Normalized => this * (1f / Length);
        public Vector3 Rounded => new Vector3((float) Math.Round(X), (float) Math.Round(Y), (float) Math.Round(Z));

        public bool IsNaN => float.IsNaN( X ) || float.IsNaN( Y ) || float.IsNaN( Z );

        public Vector3( float x, float y, float z )
        {
            X = x;
            Y = y;
            Z = z;
        }

        public float Dot( Vector3 other )
        {
            return X * other.X + Y * other.Y + Z * other.Z;
        }

        public Vector3 Cross( Vector3 other )
        {
            return new Vector3( Y * other.Z - Z * other.Y, Z * other.X - X * other.Z, X * other.Y - Y * other.X );
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
