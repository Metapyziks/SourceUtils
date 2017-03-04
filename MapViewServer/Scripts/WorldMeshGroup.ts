namespace SourceUtils {
    export class WorldMeshHandle {
        group: WorldMeshGroup;
        parent: Entity;
        drawMode: number;
        materialIndex: number;
        material: Material;
        offset: number;
        count: number;

        constructor(group?: WorldMeshGroup, drawMode?: number, material?: number | Material, offset?: number, count?: number) {
            this.group = group;
            this.drawMode = drawMode;

            if (typeof material === "number") {
                this.materialIndex = material;
            } else {
                this.material = material;
            }

            this.offset = offset;
            this.count = count;
        }

        clone(newParent: Entity): WorldMeshHandle {
            const copy = new WorldMeshHandle(this.group, this.drawMode, this.material || this.materialIndex, this.offset, this.count);
            copy.parent = newParent;
            return copy;
        }

        compareTo(other: WorldMeshHandle): number
        {
            if (this.parent !== other.parent) {
                return this.parent != null
                    ? this.parent.compareTo(other.parent)
                    : other.parent.compareTo(this.parent);
            }
            const matComp = this.material.compareTo(other.material);
            if (matComp !== 0) return matComp;
            const groupComp = this.group.compareTo(other.group);
            if (groupComp !== 0) return groupComp;
            return this.offset - other.offset;
        }

        canMerge(other: WorldMeshHandle): boolean {
            return this.materialIndex === other.materialIndex
                && this.material === other.material
                && this.offset + this.count === other.offset
                && this.group === other.group
                && this.parent === other.parent
                && this.drawMode === other.drawMode;
        }

        merge(other: WorldMeshHandle): void {
            this.count += other.count;
        }
    }

    export class WorldMeshGroup {
        private static maxIndices = 2147483647;
        private static nextId = 1;

        private id: number;
        private gl: WebGLRenderingContext;

        private components: Api.MeshComponent;
        private vertexSize: number;
        private maxVertLength: number;

        private vertices: WebGLBuffer;
        private indices: WebGLBuffer;

        private vertCount = 0;
        private indexCount = 0;

        private vertexData: Float32Array;
        private indexData: Uint16Array;

        private positionOffset: number;
        private hasPositions = false;
        private normalOffset: number;
        private hasNormals = false;
        private uvOffset: number;
        private hasUvs = false;
        private uv2Offset: number;
        private hasUv2s = false;
        private alphaOffset: number;
        private hasAlphas = false;

        constructor(gl: WebGLRenderingContext, components: Api.MeshComponent) {
            this.id = WorldMeshGroup.nextId++;
            this.gl = gl;
            this.vertices = gl.createBuffer();
            this.indices = gl.createBuffer();
            this.components = components;

            this.vertexSize = 0;

            if ((components & Api.MeshComponent.position) === Api.MeshComponent.position) {
                this.hasPositions = true;
                this.positionOffset = this.vertexSize;
                this.vertexSize += 3;
            }

            if ((components & Api.MeshComponent.normal) === Api.MeshComponent.normal) {
                this.hasNormals = true;
                this.normalOffset = this.vertexSize;
                this.vertexSize += 3;
            }

            if ((components & Api.MeshComponent.uv) === Api.MeshComponent.uv) {
                this.hasUvs = true;
                this.uvOffset = this.vertexSize;
                this.vertexSize += 2;
            }

            if ((components & Api.MeshComponent.uv2) === Api.MeshComponent.uv2)
            {
                this.hasUv2s = true;
                this.uv2Offset = this.vertexSize;
                this.vertexSize += 2;
            }

            if ((components & Api.MeshComponent.alpha) === Api.MeshComponent.alpha)
            {
                this.hasAlphas = true;
                this.alphaOffset = this.vertexSize;
                this.vertexSize += 1;
            }

            this.maxVertLength = this.vertexSize * 65536;
        }

        compareTo(other: WorldMeshGroup): number {
            return this.id - other.id;
        }

        getId(): number { return this.id; }

        getVertexCount(): number {
            return this.vertCount / this.vertexSize;
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

        canAddMeshData(data: MeshData): boolean {
            return this.components === data.components && this.vertCount + data.vertices.length <= this.maxVertLength &&
                this.indexCount + data.indices.length <= WorldMeshGroup.maxIndices;
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

        addMeshData(data: MeshData): WorldMeshHandle[] {
            if (!this.canAddMeshData(data)) {
                throw new Error("Can't add faces to WorldMeshGroup (would exceed size limit).");
            }

            const gl = this.gl;

            const newVertices = data.vertices;
            const newIndices = data.indices;

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

            const elementOffset = Math.round(vertexOffset / this.vertexSize);
            for (let i = 0, iEnd = newIndices.length; i < iEnd; ++i) {
                newIndices[i] += elementOffset;
            }

            this.indexData.set(newIndices, indexOffset);
            this.indexCount += newIndices.length;

            this.updateBuffer(gl.ARRAY_BUFFER, this.vertices, this.vertexData, newVertices, oldVertices, vertexOffset);
            this.updateBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.indexData, newIndices, oldIndices, indexOffset);

            const handles = new Array<WorldMeshHandle>(data.elements.length);

            for (let i = 0; i < data.elements.length; ++i) {
                const element = data.elements[i];
                handles[i] = new WorldMeshHandle(this, this.getDrawMode(element.type), element.material, element.offset + indexOffset, element.count);
            }

            return handles;
        }

        prepareForRendering(program: ShaderProgram): void {
            const gl = this.gl;

            const stride = this.vertexSize * 4;

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);

            program.enableMeshComponents(this.components);

            program.setVertexAttribPointer(Api.MeshComponent.position, 3, gl.FLOAT, false, stride, this.positionOffset * 4);
            program.setVertexAttribPointer(Api.MeshComponent.uv, 2, gl.FLOAT, false, stride, this.uvOffset * 4);
            program.setVertexAttribPointer(Api.MeshComponent.uv2, 2, gl.FLOAT, false, stride, this.uv2Offset * 4);
            program.setVertexAttribPointer(Api.MeshComponent.alpha, 1, gl.FLOAT, false, stride, this.alphaOffset * 4);

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