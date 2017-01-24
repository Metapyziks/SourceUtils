namespace SourceUtils
{
    public partial class ValveBspFile
    {
        [BspLump(LumpType.VERTEXES)]
        public ArrayLump<Vector3> Vertices { get; private set; }
    }
}
