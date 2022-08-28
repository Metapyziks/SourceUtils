namespace SourceUtils
{
    partial class ValveBspFile
    {
        public interface ILump
        {
            LumpType LumpType { get; }
        }

        public enum LumpType : int
        {
            ENTITIES,
            PLANES,
            TEXDATA,
            VERTEXES,
            VISIBILITY,
            NODES,
            TEXINFO,
            FACES,
            LIGHTING,
            OCCLUSION,
            LEAFS,
            FACEIDS,
            EDGES,
            SURFEDGES,
            MODELS,
            WORLDLIGHTS,
            LEAFFACES,
            LEAFBRUSHES,
            BRUSHES,
            BRUSHSIDES,
            AREAS,
            AREAPORTALS,
            PROPCOLLISION,  // UNUSED0 in sdk2013
            PROPHULLS,      // UNUSED1 in sdk2013
            PROPHULLVERTS,  // UNUSED2 in sdk2013
            PROPTRIS,       // UNUSED3 in sdk2013
            DISPINFO,
            ORIGINALFACES,
            PHYSDISP,
            PHYSCOLLIDE,
            VERTNORMALS,
            VERTNORMALINDICES,
            DISP_LIGHTMAP_ALPHAS,
            DISP_VERTS,
            DISP_LIGHTMAP_SAMPLE_POSITIONS,
            GAME_LUMP,
            LEAFWATERDATA,
            PRIMITIVES,
            PRIMVERTS,
            PRIMINDICES,
            PAKFILE,
            CLIPPORTALVERTS,
            CUBEMAPS,
            TEXDATA_STRING_DATA,
            TEXDATA_STRING_TABLE,
            OVERLAYS,
            LEAFMINDISTTOWATER,
            FACE_MACRO_TEXTURE_INFO,
            DISP_TRIS,
            PROP_BLOB,      // PHYSCOLLIDESURFACE in sdk2013
            WATEROVERLAYS,
            LEAF_AMBIENT_INDEX_HDR,
            LEAF_AMBIENT_INDEX,
            LIGHTING_HDR,
            WORLDLIGHTS_HDR,
            LEAF_AMBIENT_LIGHTING_HDR,
            LEAF_AMBIENT_LIGHTING,
            XZIPPAKFILE,
            FACES_HDR,
            MAP_FLAGS,
            OVERLAY_FADES,
            OVERLAY_SYSTEM_LEVELS,  // not in sdk2013
            PHYSLEVEL,              // not in sdk2013
            DISP_MULTIBLEND         // not in sdk2013
        }
    }
}
