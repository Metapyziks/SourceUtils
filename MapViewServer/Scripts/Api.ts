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
            facesUrl: string;
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
            cluster: number;
            area: number;
            firstBrush: number;
            numBrushes: number;
            firstFace: number;
            numFaces: number;
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

        export class FacesRange
        {
            from: number;
            count: number;
            elements: Elements[];
            vertices: string | number[];
            indices: string | number[];
        }

        export class BspFacesResponse
        {
            ranges: FacesRange[];
        }

        export class BspVisibilityResponse {
            index: number;
            pvs: string | number[];
        }
    }
}