using System;
using System.Runtime.InteropServices;

namespace SourceUtils
{
    [StructLayout(LayoutKind.Sequential)]
    public struct Vector4 : IEquatable<Vector4>
    {
        public static Vector4 operator -(Vector4 vector)
        {
            return new Vector4(-vector.X, -vector.Y, -vector.Z, -vector.W);
        }

        public float X;
        public float Y;
        public float Z;
        public float W;

        public Vector4(float x, float y, float z, float w)
        {
            X = x;
            Y = y;
            Z = z;
            W = w;
        }

        public bool Equals(Vector4 other)
        {
            return X == other.X && Y == other.Y && Z == other.Z && W == other.W;
        }

        public bool Equals(Vector4 other, float epsilon)
        {
            return Math.Abs( X - other.X ) < epsilon && Math.Abs( Y - other.Y ) < epsilon && Math.Abs( Z - other.Z ) < epsilon && Math.Abs( W - other.W ) < epsilon;
        }

        public override bool Equals(object obj)
        {
            return obj is Vector4 && Equals((Vector4) obj);
        }

        public override int GetHashCode()
        {
            unchecked
            {
                var hashCode = X.GetHashCode();
                hashCode = (hashCode * 397) ^ Y.GetHashCode();
                hashCode = (hashCode * 397) ^ Z.GetHashCode();
                hashCode = (hashCode * 397) ^ W.GetHashCode();
                return hashCode;
            }
        }

        public override string ToString()
        {
            return $"({X:F2}, {Y:F2}, {Z:F2}, {W:F2})";
        }
    }
}
