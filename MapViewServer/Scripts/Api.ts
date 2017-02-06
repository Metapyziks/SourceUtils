namespace SourceUtils
{
    export namespace Api
    {
        export class BspIndexResponse
        {
            name: string;
            numClusters: number;
            numModels: number;

            modelUrl: string;
            leafFacesUrl: string;
            visibilityUrl: string;
        }

        export class Vector3
        {
            x: number;
            y: number;
            z: number;
        }

        export class Plane {
            normal: Vector3;
            dist: number;
        }

        export class BspModelResponse
        {
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
            offset: number;
            count: number;
        }

        export class Faces
        {
            index: number;
            elements: Element[];
            vertices: string | number[];
            indices: string | number[];
        }

        export class BspFacesResponse
        {
            facesList: Faces[];
        }

        export class BspVisibilityResponse {
            index: number;
            pvs: string | number[];
        }
    }
}