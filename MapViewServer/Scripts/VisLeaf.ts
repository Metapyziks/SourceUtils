namespace SourceUtils {
    export class VisLeaf implements IVisElem, IFaceLoadTarget {
        isLeaf = true;
        bounds: THREE.Box3;

        leafIndex: number;
        cluster: number;

        material: THREE.MultiMaterial;

        private model: BspModel;
        private hasFaces: boolean;
        private loadedFaces = false;
        private inPvs = false;

        private vertices: THREE.BufferAttribute;
        private indices: THREE.BufferAttribute;
        private buffers: { [key: string]: WebGLBuffer } = {};
        private elements: VisLeafElement[];

        private needsUpdate: boolean;

        constructor(model: BspModel, info: Api.BspLeaf) {
            const min = info.min;
            const max = info.max;

            this.model = model;
            this.leafIndex = info.index;
            this.hasFaces = info.hasFaces;
            this.cluster = info.cluster === undefined ? -1 : info.cluster;

            this.bounds = new THREE.Box3(new THREE.Vector3(min
                    .x,
                    min.y,
                    min.z),
                new THREE.Vector3(max.x, max.y, max.z));
        }

        getAllLeaves(dstArray: VisLeaf[]): void {
            dstArray.push(this);
        }

        setInPvs(value: boolean): void {
            if (this.inPvs === value) return;
            if (!this.hasFaces) return;

            if (!value) {
                this.inPvs = false;
                return;
            }

            this.inPvs = true;
            this.loadFaces();
        }

        private static rootCenter = new THREE.Vector3();
        private static thisCenter = new THREE.Vector3();

        faceLoadPriority(): number {
            if (!this.inPvs) return Number.POSITIVE_INFINITY;

            const root = this.model.map.getPvsRoot();
            if (this === root || root == null) return 0;

            root.bounds.getCenter(VisLeaf.rootCenter);
            this.bounds.getCenter(VisLeaf.thisCenter);

            VisLeaf.rootCenter.sub(VisLeaf.thisCenter);

            return VisLeaf.rootCenter.lengthSq();
        }

        onLoadFaces(data: Api.Faces): void {
            this.vertices = new THREE.BufferAttribute(Utils.decompressFloat32Array(data.vertices), 6);
            this.indices = new THREE.BufferAttribute(Utils.decompressUint16Array(data.indices), 1);

            this.elements = [];

            for (let i = 0; i < data.elements.length; ++i) {
                this.elements.push(new VisLeafElement(data.elements[i]));
            }

            this.needsUpdate = true;
        }

        render(gl: WebGLRenderingContext, attribs: any): void {
            if (this.elements == null) return;

            if (this.needsUpdate) this.updateBuffers(gl);

            const positionAttrib = attribs["position"];
            const normalAttrib = attribs["normal"];

            const verticesBuffer = this.getGlBuffer(this.vertices);
            const indicesBuffer = this.getGlBuffer(this.indices);

            gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
            gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.vertexAttribPointer(normalAttrib, 3, gl.FLOAT, true, 6 * 4, 3 * 4);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

            for (let i = 0, count = this.elements.length; i < count; ++i) {
                const element = this.elements[i];
                gl.drawElements(element.mode, element.count, gl.UNSIGNED_SHORT, element.offset * 2);
            }
        }

        private getGlBuffer(buffer: THREE.BufferAttribute): WebGLBuffer {
            return this.buffers[buffer.uuid];
        }

        private updateBuffer(gl: WebGLRenderingContext, buffer: THREE.BufferAttribute, type: number) {
            let glBuffer = this.getGlBuffer(buffer);

            if (glBuffer === undefined) {
                glBuffer = this.buffers[buffer.uuid] = gl.createBuffer();
            }

            gl.bindBuffer(type, glBuffer);
            gl.bufferData(type, buffer.array as any, gl.STATIC_DRAW);
        }

        private updateBuffers(gl: WebGLRenderingContext) {
            this.needsUpdate = false;

            this.updateBuffer(gl, this.vertices, gl.ARRAY_BUFFER);
            this.updateBuffer(gl, this.indices, gl.ELEMENT_ARRAY_BUFFER);
        }

        private loadFaces(): void {
            if (!this.hasFaces || this.loadedFaces) return;

            this.loadedFaces = true;
            this.model.map.faceLoader.loadFaces(this.leafIndex, this);
        }
    }
}