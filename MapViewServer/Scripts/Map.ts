/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export interface IVisElem {
        isLeaf: boolean;
        bounds: THREE.Box3;

        getAllLeaves(dstArray: VisLeaf[]): void;
    }

    export class VisNode implements IVisElem {
        isLeaf = false;
        bounds: THREE.Box3;

        children: IVisElem[];
        plane: THREE.Plane;

        private static createVisElem(model: BspModel, info: Api.BspElem): IVisElem {
            if ((info as any).children != undefined) {
                return new VisNode(model, info as Api.BspNode);
            } else {
                return new VisLeaf(model, info as Api.BspLeaf);
            }
        }

        constructor(model: BspModel, info: Api.BspNode) {
            const normal = info.plane.normal;
            const min = info.min;
            const max = info.max;

            this.plane = new THREE.Plane(new THREE.Vector3(normal.x, normal.y, normal.z), info.plane.dist);
            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));

            this.children = [
                VisNode.createVisElem(model, info.children[0]),
                VisNode.createVisElem(model, info.children[1])
            ];
        }

        getAllLeaves(dstArray: VisLeaf[]): void {
            this.children[0].getAllLeaves(dstArray);
            this.children[1].getAllLeaves(dstArray);
        }
    }

    export class VisLeafElement {
        mode: number;
        offset: number;
        count: number;
        materialIndex: number;

        constructor(face: Api.Element)
        {
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

    export class VisLeaf implements IVisElem, IFaceLoadTarget {
        isLeaf = true;
        bounds: THREE.Box3;

        cluster: number;

        material: THREE.MultiMaterial;

        private model: BspModel;
        private firstFace: number;
        private numFaces: number;
        private loadedFaces = false;
        private inPvs = false;

        private vertices: THREE.BufferAttribute;
        private indices: THREE.BufferAttribute;
        private buffers: { [key: string]:WebGLBuffer } = {};
        private elements: VisLeafElement[];

        private needsUpdate: boolean;

        constructor(model: BspModel, info: Api.BspLeaf) {
            const min = info.min;
            const max = info.max;

            this.model = model;
            this.cluster = info.cluster === undefined ? -1 : info.cluster;
            this.numFaces = info.numFaces === undefined ? 0 : info.numFaces;
            this.firstFace = info.firstFace;

            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
        }

        hasFaces(): boolean { return this.numFaces > 0; }

        getAllLeaves(dstArray: VisLeaf[]): void {
            dstArray.push(this);
        }

        setInPvs(value: boolean): void {
            if (this.inPvs === value) return;
            if (!this.hasFaces()) return;

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

        onLoadFaces(data: Api.FacesRange): void {
            this.vertices = new THREE.BufferAttribute(Utils.decompressFloat32Array(data.vertices), 6);
            this.indices = new THREE.BufferAttribute(Utils.decompressUint16Array(data.indices), 1);

            this.elements = [];

            for (let i = 0; i < data.elements.length; ++i)
            {
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
            if (!this.hasFaces() || this.loadedFaces) return;

            this.loadedFaces = true;
            this.model.map.faceLoader.loadFaces(this.firstFace, this.numFaces, this);
        }
    }

    export class BspModel extends THREE.Mesh {
        map: Map;

        private info: Api.BspModelResponse;
        private index: number;

        private leaves: VisLeaf[];
        private root: VisNode;

        constructor(map: Map, index: number) {
            super(new THREE.BufferGeometry(), new THREE.MeshPhongMaterial());

            this.frustumCulled = false;

            this.map = map;
            this.index = index;

            this.loadInfo(this.map.info.modelUrl.replace("{index}", index.toString()));

            // Hack
            (this as any).onAfterRender = this.onAfterRenderImpl;
        }

        private loadInfo(url: string): void {
            $.getJSON(url, (data: Api.BspModelResponse) => {
                this.info = data;
                this.loadTree();
                this.map.onModelLoaded(this);
            });
        }

        private loadTree(): void {
            this.leaves = [];
            this.root = new VisNode(this, Utils.decompress(this.info.tree));
            this.root.getAllLeaves(this.leaves);
        }

        getLeaves(): VisLeaf[] {
            return this.leaves;
        }

        findLeaf(pos: THREE.Vector3): VisLeaf {
            if (this.root == null) return null;

            let elem: IVisElem = this.root;

            while (!elem.isLeaf) {
                const node = elem as VisNode;
                const index = node.plane.normal.dot(pos) >= node.plane.constant ? 0 : 1;
                elem = node.children[index];
            }

            return elem as VisLeaf;
        }

        onAfterRenderImpl(renderer: THREE.Renderer, scene: THREE.Scene, camera: THREE.Camera,
            geom: THREE.Geometry, mat: THREE.Material, group: THREE.Group): void {
            const leaves = this === this.map.getWorldSpawn() ? this.map.getPvs() : this.leaves;

            const webGlRenderer = renderer as THREE.WebGLRenderer;

            const gl = webGlRenderer.context;
            const props = webGlRenderer.properties;

            const matProps = props.get(this.material);
            const program = matProps.program;
            const attribs = program.getAttributes();

            gl.enableVertexAttribArray(attribs["position"]);
            gl.enableVertexAttribArray(attribs["normal"]);

            for (let i = 0, leafCount = leaves.length; i < leafCount; ++i) {
                const leaf = leaves[i];
                leaf.render(gl, attribs);
            }
        }
    }

    export class Map extends Entity {
        info: Api.BspIndexResponse;

        faceLoader = new FaceLoader(this);

        private models: BspModel[] = [];
        private clusters: VisLeaf[];
        private pvsArray: VisLeaf[][];

        private pvsRoot: VisLeaf;
        private pvs: VisLeaf[] = [];

        constructor(url: string) {
            super();

            this.frustumCulled = false;

            this.loadInfo(url);
        }

        getPvsRoot(): VisLeaf {
            return this.pvsRoot;
        }

        getPvs(): VisLeaf[] {
            return this.pvs;
        }

        getWorldSpawn(): BspModel {
            return this.models.length > 0 ? this.models[0] : null;
        }

        private loadInfo(url: string): void {
            $.getJSON(url, (data: Api.BspIndexResponse) => {
                this.info = data;
                this.models = new Array<BspModel>(data.numModels);
                this.clusters = new Array<VisLeaf>(data.numClusters);
                this.pvsArray = new Array<Array<VisLeaf>>(data.numClusters);
                this.add(this.models[0] = new BspModel(this, 0));
            });
        }

        onModelLoaded(model: BspModel): void {
            if (model !== this.getWorldSpawn()) return;

            const leaves = model.getLeaves();
            for (let i = 0; i < leaves.length; ++i) {
                const leaf = leaves[i];
                if (leaf.cluster === -1) continue;
                this.clusters[leaf.cluster] = leaf;
            }
        }

        private replacePvs(pvs: VisLeaf[]): void {
            for (let i = this.pvs.length - 1; i >= 0; --i) {
                this.pvs[i].setInPvs(false);
            }

            this.pvs = [];

            for (let i = pvs.length - 1; i >= 0; --i) {
                pvs[i].setInPvs(true);
                this.pvs.push(pvs[i]);
            }

            this.faceLoader.update();
        }

        updatePvs(position: THREE.Vector3): void {
            const worldSpawn = this.getWorldSpawn();
            if (worldSpawn == null) return;

            const root = worldSpawn.findLeaf(position);
            if (root === this.pvsRoot) return;

            this.pvsRoot = root;
            if (root == null || root.cluster === -1) return;

            const pvs = this.pvsArray[root.cluster];
            if (pvs !== null && pvs !== undefined) {
                if (pvs.length > 0) this.replacePvs(pvs);
                return;
            }

            this.loadPvsArray(root.cluster);
        }

        private loadPvsArray(cluster: number): void {
            const pvs = this.pvsArray[cluster] = [];

            const url = this.info.visibilityUrl.replace("{index}", cluster.toString());
            $.getJSON(url, (data: Api.BspVisibilityResponse) => {
                const indices = Utils.decompress(data.pvs);

                for (let i = 0; i < indices.length; ++i) {
                    const leaf = this.clusters[indices[i]];
                    if (leaf !== undefined) pvs.push(leaf);
                }

                if (this.pvsRoot != null && this.pvsRoot.cluster === cluster) {
                    this.replacePvs(pvs);
                }
            });
        }
    }
}