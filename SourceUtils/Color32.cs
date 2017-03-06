using System;

namespace SourceUtils
{
    public struct Color32 : IEquatable<Color32>
    {
        public static Color32 FromRgb( int rgb )
        {
            return new Color32( (byte) ((rgb >> 16) & 0xff), (byte) ((rgb >> 8) & 0xff), (byte) (rgb & 0xff) );
        }
        public static Color32 FromBgr( int bgr )
        {
            return new Color32( (byte) (bgr & 0xff), (byte) ((bgr >> 8) & 0xff), (byte) ((bgr >> 16) & 0xff) );
        }
        
        public static Color32 FromArgb( int argb )
        {
            return new Color32( (byte) ((argb >> 16) & 0xff), (byte) ((argb >> 8) & 0xff), (byte) (argb & 0xff), (byte) ((argb >> 24) & 0xff) );
        }

        public byte R;
        public byte G;
        public byte B;
        public byte A;
        
        public Color32( byte r, byte g, byte b, byte a = 255 )
        {
            R = r;
            G = g;
            B = b;
            A = a;
        }

        public int ToRgb()
        {
            return (R << 16) | (G << 8) | B;
        }
        
        public int ToArgb()
        {
            return (A << 24) | ToRgb();
        }

        public override int GetHashCode()
        {
            return ToArgb();
        }

        public bool Equals( Color32 other )
        {
            return R == other.R && G == other.G && B == other.B && A == other.A;
        }

        public override bool Equals( object obj )
        {
            return obj is Color32 && Equals( (Color32) obj );
        }
    }
}
