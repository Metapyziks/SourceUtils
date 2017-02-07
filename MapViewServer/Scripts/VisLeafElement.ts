namespace SourceUtils {
    export class VisLeafElement {
        mode: number;
        offset: number;
        count: number;
        materialIndex: number;

        constructor(face: Api.Element) {
            switch (face.type) {
            case Api.PrimitiveType.TriangleList:
                this.mode = WebGLRenderingContext.TRIANGLES;
                break;
            case Api.PrimitiveType.TriangleFan:
                this.mode = WebGLRenderingContext.TRIANGLE_FAN;
                break;
            case Api.PrimitiveType.TriangleStrip:
                this.mode = WebGLRenderingContext.TRIANGLE_STRIP;
                break;
            default:
                this.mode = WebGLRenderingContext.TRIANGLES;
                break;
            }

            this.offset = face.offset;
            this.count = face.count;
            this.materialIndex = 0;
        }
    }
}