namespace SourceUtils {
    export class WorldMeshHandle {
        group: WorldMeshGroup;
        drawMode: number;
        offset: number;
        count: number;

        constructor(group: WorldMeshGroup, drawMode: number, offset: number, count: number) {
            this.group = group;
            this.drawMode = drawMode;
            this.offset = offset;
            this.count = count;
        }
    }

    export class WorldMeshGroup {
        private static vertComponents = 8;
        private static maxVertLength = 65536 * WorldMeshGroup.vertComponents;
        private static maxIndices = 2147483647;

        private gl: WebGLRenderingContext;

        private vertices: WebGLBuffer;
        private indices: WebGLBuffer;

        private vertCount = 0;
        private indexCount = 0;

        private vertexData: Float32Array;
        private indexData: Uint16Array;

        constructor(gl: WebGLRenderingContext) {
            this.gl = gl;
            this.vertices = gl.createBuffer();
            this.indices = gl.createBuffer();
        }

        getVertexCount(): number {
            return this.vertCount / WorldMeshGroup.vertComponents;
        }

        getTriangleCount(): number {
            return this.indexCount / 3;
        }

        private ensureCapacity<TArray extends Float32Array |
            Uint16Array>(array: TArray, length: number, ctor: (size: number) => TArray): TArray {
            if (array != null && array.length >= length) return array;

            let newLength = 2048;
            while (newLength < length) newLength *= 2;

            const newArray = ctor(newLength);
            if (array != null) newArray.set(array, 0);

            return newArray;
        }

        canAddFaces(faces: FaceData): boolean {
            return this.vertCount + faces.vertices.length <= WorldMeshGroup.maxVertLength &&
                this.indexCount + faces.indices.length <= WorldMeshGroup.maxIndices;
        }

        private updateBuffer<TArray extends Float32Array | Uint16Array>(target: number,
            buffer: WebGLBuffer,
            data: TArray,
            newData: TArray,
            oldData: TArray,
            offset: number): void {
            const gl = this.gl;

            gl.bindBuffer(target, buffer);

            if (data !== oldData) {
                gl.bufferData(target, data.byteLength, gl.STATIC_DRAW);
                gl.bufferSubData(target, 0, data);
            } else {
                gl.bufferSubData(target, offset * data.BYTES_PER_ELEMENT, newData);
            }
        }

        private getDrawMode(primitiveType: Api.PrimitiveType): number {
            switch (primitiveType) {
            case Api.PrimitiveType.TriangleList:
                return this.gl.TRIANGLES;
            case Api.PrimitiveType.TriangleStrip:
                return this.gl.TRIANGLE_STRIP;
            case Api.PrimitiveType.TriangleFan:
                return this.gl.TRIANGLE_FAN;
            default:
                throw new Error(`Unknown primitive type '${primitiveType}'.`);
            }
        }

        addFaces(faces: FaceData): WorldMeshHandle[] {
            if (!this.canAddFaces(faces)) {
                throw new Error("Can't add faces to WorldMeshGroup (would exceed size limit).");
            }

            const gl = this.gl;

            const newVertices = faces.vertices;
            const newIndices = faces.indices;

            const vertexOffset = this.vertCount;
            const oldVertices = this.vertexData;
            this.vertexData = this.ensureCapacity(this.vertexData,
                this.vertCount + newVertices.length,
                size => new Float32Array(size));

            const indexOffset = this.indexCount;
            const oldIndices = this.indexData;
            this.indexData = this.ensureCapacity(this.indexData,
                this.indexCount + newIndices.length,
                size => new Uint16Array(size));

            this.vertexData.set(newVertices, vertexOffset);
            this.vertCount += newVertices.length;

            const elementOffset = Math.round(vertexOffset / WorldMeshGroup.vertComponents);
            for (let i = 0, iEnd = newIndices.length; i < iEnd; ++i) {
                newIndices[i] += elementOffset;
            }

            this.indexData.set(newIndices, indexOffset);
            this.indexCount += newIndices.length;

            this.updateBuffer(gl.ARRAY_BUFFER, this.vertices, this.vertexData, newVertices, oldVertices, vertexOffset);
            this.updateBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.indexData, newIndices, oldIndices, indexOffset);

            const handles = new Array<WorldMeshHandle>(faces.elements.length);

            for (let i = 0; i < faces.elements.length; ++i) {
                const element = faces.elements[i];
                handles[i] = new WorldMeshHandle(this, this.getDrawMode(element.type), element.offset + indexOffset, element.count);
            }

            return handles;
        }

        prepareForRendering(attribs: IProgramAttributes): void {
            const gl = this.gl;

            const stride = WorldMeshGroup.vertComponents * 4;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, stride, 0 * 4);
            gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, true, stride, 3 * 4);
            if (attribs.uv !== undefined) gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, stride, 6 * 4);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
        }

        renderElements(drawMode: number, offset: number, count: number): void {
            const gl = this.gl;
            gl.drawElements(drawMode, count, gl.UNSIGNED_SHORT, offset * 2);
        }

        dispose(): void {
            if (this.vertices !== undefined) {
                this.gl.deleteBuffer(this.vertices);
                this.vertices = undefined;
            }

            if (this.indices !== undefined) {
                this.gl.deleteBuffer(this.indices);
                this.indices = undefined;
            }
        }
    }
}