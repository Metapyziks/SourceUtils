namespace SourceUtils {
    export namespace Api {
        export interface IBspIndexResponse {
            name: string;
            skyMaterial: IMaterial;
            fog: IFogParams;
            skyCamera: ISkyCameraParams;
            playerStarts: IVector3[];
            numClusters: number;
            numModels: number;
            brushEnts: IFuncBrush[];

            modelUrl: string;
            displacementsUrl: string;
            facesUrl: string;
            visibilityUrl: string;
            lightmapUrl: string;
            materialsUrl: string;
            staticPropsUrl: string;
        }

        export interface IFuncBrush {
            classname: string;
            origin: IVector3;
            angles: IVector3;
            model: number;
            clusters: number[];
        }

        export interface IVector3 {
            x: number;
            y: number;
            z: number;
        }

        export interface IPlane {
            normal: IVector3;
            dist: number;
        }

        export interface IBspModelResponse {
            index: number;
            min: IVector3;
            max: IVector3;
            origin: IVector3;
            tree: string | IBspNode;
        }

        export interface IBspElem {
            min: IVector3;
            max: IVector3;
        }

        export interface IBspNode extends IBspElem {
            plane: IPlane;
            children: IBspElem[];
        }

        export enum LeafFlags {
            Sky = 1,
            Radial = 2,
            Sky2D = 4
        }

        export interface IBspLeaf extends IBspElem {
            index: number;
            cluster: number;
            area: number;
            flags: number;
            hasFaces: boolean;
        }

        export enum PrimitiveType {
            TriangleList,
            TriangleStrip,
            TriangleFan
        }

        export interface IElement {
            type: PrimitiveType;
            material: number;
            indexOffset: number;
            indexCount: number;
            vertexOffset?: number;
            vertexCount?: number;
        }

        export enum MeshComponent {
            Position = 1,
            Normal = 2,
            Uv = 4,
            Uv2 = 8,
            Alpha = 16,
            Rgb = 32
        }

        export interface IVertexContainer {
            components: MeshComponent;
            vertices: string | number[];
        }

        export interface IIndicesContainer {
            elements: IElement[];
            indices: string | number[];
        }

        export interface IFaces extends IVertexContainer, IIndicesContainer { }

        export interface IBspFacesResponse {
            facesList: IFaces[];
        }

        export interface IBspVisibilityResponse {
            index: number;
            pvs: string | number[];
        }

        export interface IDisplacement {
            index: number;
            power: number;
            min: IVector3;
            max: IVector3;
            clusters: number[];
        }

        export interface IBspDisplacementsResponse {
            displacements: IDisplacement[];
        }

        export enum MaterialPropertyType {
            boolean,
            number,
            texture2D,
            textureCube
        }

        export interface IMaterialProperty {
            name: string;
            type: MaterialPropertyType;
            value: boolean | number | string | string[];
        }

        export interface IMaterial {
            shader: string;
            properties: IMaterialProperty[];
        }

        export interface IBspMaterialsResponse {
            materials: IMaterial[];
        }

        export enum StaticPropFlags
        {
            Fades = 1,
            UseLightingOrigin = 2,
            NoDraw = 4,
            IgnoreNormals = 8,
            NoShadow = 0x10,
            Unused = 0x20,
            NoPerVertexLighting = 0x40,
            NoSelfShadowing = 0x80
        }

        export interface IStaticProp {
            model: number | string;
            skin: number;
            origin: IVector3;
            angles: IVector3;
            flags: StaticPropFlags;
            solid: boolean;
            clusters: number[];
            vertLightingUrl?: string;
        }

        export interface IBspStaticPropsResponse
        {
            models: string[];
            props: IStaticProp[];
        }

        export interface IBspVertLightingResponse {
            meshes: (string | number[])[];
        }

        export enum VtfFlags {
            POINTSAMPLE = 0x00000001,
            TRILINEAR = 0x00000002,
            CLAMPS = 0x00000004,
            CLAMPT = 0x00000008,
            ANISOTROPIC = 0x00000010,
            HINT_DXT5 = 0x00000020,
            PWL_CORRECTED = 0x00000040,
            NORMAL = 0x00000080,
            NOMIP = 0x00000100,
            NOLOD = 0x00000200,
            ALL_MIPS = 0x00000400,
            PROCEDURAL = 0x00000800,
            ONEBITALPHA = 0x00001000,
            EIGHTBITALPHA = 0x00002000,
            ENVMAP = 0x00004000,
            RENDERTARGET = 0x00008000,
            DEPTHRENDERTARGET = 0x00010000,
            NODEBUGOVERRIDE = 0x00020000,
            SINGLECOPY = 0x00040000,
            PRE_SRGB = 0x00080000,
            UNUSED_00100000 = 0x00100000,
            UNUSED_00200000 = 0x00200000,
            UNUSED_00400000 = 0x00400000,
            NODEPTHBUFFER = 0x00800000,
            UNUSED_01000000 = 0x01000000,
            CLAMPU = 0x02000000,
            VERTEXTEXTURE = 0x04000000,
            SSBUMP = 0x08000000,
            UNUSED_10000000 = 0x10000000,
            BORDER = 0x20000000,
            UNUSED_40000000 = 0x40000000,
            UNUSED_80000000 = 0x80000000
        }

        export interface IVtfResponse {
            width: number;
            height: number;
            flags: VtfFlags;
            ddsUrl: string;
            pngUrl: string;
            mipmaps: number;
        }

        export interface ISmdMesh {
            material: number;
            center: IVector3;
        }

        export interface ISmdModel {
            name: string;
            radius: number;
            meshDataUrl: string;
            meshes: ISmdMesh[];
        }

        export interface ISmdBodyPart {
            name: string;
            models: ISmdModel[];
        }

        export interface IMdlResponse {
            materials: IMaterial[];
            bodyParts: ISmdBodyPart[];
        }

        export interface IMdlMeshDataResponse extends IVertexContainer, IIndicesContainer { }

        export interface IColor32 {
            r: number;
            g: number;
            b: number;
            a: number;
        }

        export interface IFogParams {
            fogEnabled: boolean;
            fogStart: number;
            fogEnd: number;
            fogMaxDensity: number;
            farZ: number;
            fogColor: IColor32;
        }

        export interface ISkyCameraParams extends IFogParams {
            enabled: boolean;
            origin: IVector3;
            scale: number;
        }
    }
}