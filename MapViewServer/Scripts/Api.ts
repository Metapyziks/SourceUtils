namespace SourceUtils {
    export namespace Api {
        export class BspIndexResponse {
            name: string;
            skyMaterials: Material[];
            playerStarts: Vector3[];
            numClusters: number;
            numModels: number;

            modelUrl: string;
            displacementsUrl: string;
            facesUrl: string;
            visibilityUrl: string;
            lightmapUrl: string;
            materialsUrl: string;
        }

        export class Vector3 {
            x: number;
            y: number;
            z: number;
        }

        export class Plane {
            normal: Vector3;
            dist: number;
        }

        export class BspModelResponse {
            index: number;
            min: Vector3;
            max: Vector3;
            origin: Vector3;
            tree: string | BspNode;
        }

        export class BspElem {
            min: Vector3;
            max: Vector3;
        }

        export class BspNode extends BspElem {
            plane: Plane;
            children: BspElem[];
        }

        export class BspLeaf extends BspElem {
            index: number;
            cluster: number;
            area: number;
            hasFaces: boolean;
        }

        export enum PrimitiveType {
            TriangleList,
            TriangleStrip,
            TriangleFan
        }

        export class Element {
            type: PrimitiveType;
            material: number;
            offset: number;
            count: number;
        }

        export enum MeshComponent {
            position = 1,
            normal = 2,
            uv = 4,
            uv2 = 8
        }

        export class Faces {
            components: MeshComponent;
            elements: Element[];
            vertices: string | number[];
            indices: string | number[];
        }

        export class BspFacesResponse {
            facesList: Faces[];
        }

        export class BspVisibilityResponse {
            index: number;
            pvs: string | number[];
        }

        export class Displacement {
            index: number;
            power: number;
            min: Vector3;
            max: Vector3;
            clusters: number[];
        }

        export class BspDisplacementsResponse {
            displacements: Displacement[];
        }

        export enum MaterialPropertyType {
            boolean,
            number,
            texture
        }

        export class MaterialProperty {
            name: string;
            type: MaterialPropertyType;
            value: boolean | number | string;
        }

        export class Material {
            shader: string;
            properties: MaterialProperty[];
        }

        export class BspMaterialsResponse {
            materials: Material[];
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

        export class VtfResponse {
            width: number;
            height: number;
            flags: VtfFlags;
            ddsUrl: string;
            pngUrl: string;
            mipmaps: number;
        }
    }
}