/// <reference path="FormattedWriter.ts"/>
/// <reference path="Entity.ts"/>

namespace SourceUtils {
    export class WorldMeshHandle {
        group: WorldMeshGroup;
        parent: Entity;
        drawMode: number;
        materialIndex: number;
        material: Material;
        vertexOffset: number;
        indexOffset: number;
        indexCount: number;

        constructor(group?: WorldMeshGroup, drawMode?: number, material?: number | Material,
            vertexOffset?: number, indexOffset?: number, indexCount?: number) {
            this.group = group;
            this.drawMode = drawMode;

            if (typeof material === "number") {
                this.materialIndex = material;
            } else {
                this.material = material;
            }

            this.vertexOffset = vertexOffset;
            this.indexOffset = indexOffset;
            this.indexCount = indexCount;
        }

        clone(newParent: Entity): WorldMeshHandle {
            const copy = new WorldMeshHandle(this.group, this.drawMode, this.material || this.materialIndex,
                this.vertexOffset, this.indexOffset, this.indexCount);
            copy.parent = newParent;
            return copy;
        }

        compareTo(other: WorldMeshHandle): number {
            const sortComp = this.material.drawOrderCompareTo(other.material);
            if (sortComp !== 0) return sortComp;

            if (this.parent !== other.parent) {
                return this.parent != null
                    ? this.parent.compareTo(other.parent)
                    : other.parent.compareTo(this.parent);
            }

            const groupComp = this.group.compareTo(other.group);
            if (groupComp !== 0) return groupComp;
            const matComp = this.material.compareTo(other.material);
            if (matComp !== 0) return matComp;
            return this.indexOffset - other.indexOffset;
        }

        canMerge(other: WorldMeshHandle): boolean {
            return this.materialIndex === other.materialIndex
                && this.material === other.material
                && this.group === other.group
                && this.vertexOffset === other.vertexOffset
                && this.indexOffset + this.indexCount === other.indexOffset
                && this.parent === other.parent
                && this.drawMode === other.drawMode;
        }

        merge(other: WorldMeshHandle): void {
            this.indexCount += other.indexCount;
        }
    }

    export class WorldMeshGroup implements IStateLoggable {
        private static maxIndices = 2147483648;
        private static nextId = 1;

        private id: number;
        private gl: WebGLRenderingContext;

        private components: Api.MeshComponent;
        private vertexSize: number;
        private maxVertLength: number;
        private lastSubBufferOffset = 0;
        private maxSubBufferLength: number;

        private vertices: WebGLBuffer;
        private indices: WebGLBuffer;

        private vertCount = 0;
        private indexCount = 0;
        private handleCount = 0;

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
        private rgbOffset: number;
        private hasRgbs = false;

        constructor(gl: WebGLRenderingContext, components: Api.MeshComponent) {
            this.id = WorldMeshGroup.nextId++;
            this.gl = gl;
            this.vertices = gl.createBuffer();
            this.indices = gl.createBuffer();
            this.components = components;

            this.vertexSize = 0;

            if ((components & Api.MeshComponent.Position) === Api.MeshComponent.Position) {
                this.hasPositions = true;
                this.positionOffset = this.vertexSize;
                this.vertexSize += 3;
            }

            if ((components & Api.MeshComponent.Normal) === Api.MeshComponent.Normal) {
                this.hasNormals = true;
                this.normalOffset = this.vertexSize;
                this.vertexSize += 3;
            }

            if ((components & Api.MeshComponent.Uv) === Api.MeshComponent.Uv) {
                this.hasUvs = true;
                this.uvOffset = this.vertexSize;
                this.vertexSize += 2;
            }

            if ((components & Api.MeshComponent.Uv2) === Api.MeshComponent.Uv2)
            {
                this.hasUv2s = true;
                this.uv2Offset = this.vertexSize;
                this.vertexSize += 2;
            }

            if ((components & Api.MeshComponent.Alpha) === Api.MeshComponent.Alpha)
            {
                this.hasAlphas = true;
                this.alphaOffset = this.vertexSize;
                this.vertexSize += 1;
            }

            if ((components & Api.MeshComponent.Rgb) === Api.MeshComponent.Rgb)
            {
                this.hasRgbs = true;
                this.rgbOffset = this.vertexSize;
                this.vertexSize += 3;
            }

            this.maxVertLength = 2147483648;
            this.maxSubBufferLength = this.vertexSize * 65536; 
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

            if (this.vertCount - this.lastSubBufferOffset * this.vertexSize > this.maxSubBufferLength) {
                this.lastSubBufferOffset = Math.round(vertexOffset / this.vertexSize);
            }

            const elementOffset = Math.round(vertexOffset / this.vertexSize) - this.lastSubBufferOffset;
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
                handles[i] = new WorldMeshHandle(this, this.getDrawMode(element.type), element.material, this.lastSubBufferOffset, element.indexOffset + indexOffset, element.indexCount);
                ++this.handleCount;
            }

            return handles;
        }

        bufferBindBuffers(buf: CommandBuffer, program: ShaderProgram): void {
            const gl = this.gl;

            buf.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            buf.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);

            program.bufferEnableMeshComponents(buf, this.components);
        }

        bufferAttribPointers(buf: CommandBuffer, program: ShaderProgram, vertexOffset: number): void {
            const gl = this.gl;

            const stride = this.vertexSize * 4;
            const baseOffset = vertexOffset * stride;

            program.bufferAttribPointer(buf, Api.MeshComponent.Position, 3, gl.FLOAT, false, stride, baseOffset + this.positionOffset * 4);
            program.bufferAttribPointer(buf, Api.MeshComponent.Uv, 2, gl.FLOAT, false, stride, baseOffset + this.uvOffset * 4);
            program.bufferAttribPointer(buf, Api.MeshComponent.Uv2, 2, gl.FLOAT, false, stride, baseOffset + this.uv2Offset * 4);
            program.bufferAttribPointer(buf, Api.MeshComponent.Alpha, 1, gl.FLOAT, false, stride, baseOffset + this.alphaOffset * 4);
            program.bufferAttribPointer(buf, Api.MeshComponent.Rgb, 3, gl.FLOAT, false, stride, baseOffset + this.rgbOffset * 4);
        }

        bufferRenderElements(buf: CommandBuffer, mode: number, offset: number, count: number): void {
            buf.drawElements(mode, count, this.gl.UNSIGNED_SHORT, offset * 2);
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

        logState(writer: FormattedWriter): void {
            writer.writeProperty("components", this.components);
            writer.writeProperty("handleCount", this.handleCount);
            writer.writeProperty("vertexSize", this.vertexSize);
            writer.writeProperty("vertexCount", this.vertCount / this.vertexSize);
            writer.writeProperty("indexCount", this.indexCount);
        }
    }
}