namespace SourceUtils
{
    public struct IntRect
    {
        public int X;
        public int Y;
        public int Width;
        public int Height;

        public IntVector2 Min => new IntVector2( X, Y );
        public IntVector2 Max => new IntVector2( X, Y );
        public IntVector2 Size => new IntVector2( Width, Height );

        public IntRect( int x, int y, int width, int height )
        {
            X = x;
            Y = y;
            Width = width;
            Height = height;
        }
    }
}
