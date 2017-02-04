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

    export class VisLeaf extends THREE.Mesh implements IVisElem, IFaceLoadTarget {
        isLeaf = true;
        bounds: THREE.Box3;

        cluster: number;

        private model: BspModel;
        private firstFace: number;
        private numFaces: number;
        private loadedFaces = false;
        private inPvs = false;

        constructor(model: BspModel, info: Api.BspLeaf) {
            super(new THREE.BufferGeometry(), new THREE.MultiMaterial([new THREE.MeshPhongMaterial({side: THREE.BackSide})]));

            this.frustumCulled = false;

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
                this.model.remove(this);
                return;
            }

            this.inPvs = true;
            this.model.add(this);
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
            // TODO
            this.setDrawMode(THREE.TriangleFanDrawMode);

            const geom = this.geometry as THREE.BufferGeometry;

            geom.addAttribute("position",
                new THREE.BufferAttribute(Utils.decompressFloat32Array(data.vertices), 3));
            geom.addAttribute("normal",
                new THREE.BufferAttribute(Utils.decompressFloat32Array(data.normals), 3, true));
            geom.setIndex(new THREE.BufferAttribute(Utils.decompressUint32Array(data.indices), 1));

            geom.clearGroups();

            for (let i = 0; i < data.faces.length; ++i)
            {
                const face = data.faces[i];
                geom.addGroup(face.offset, face.count);
            }

            geom.boundingBox = this.bounds;
        }

        private loadFaces(): void {
            if (!this.hasFaces() || this.loadedFaces) return;

            this.loadedFaces = true;
            this.model.map.faceLoader.loadFaces(this.firstFace, this.numFaces, this);
        }
    }

    export class BspModel extends Entity {
        map: Map;

        private info: Api.BspModelResponse;
        private index: number;

        private leaves: VisLeaf[];
        private root: VisNode;

        constructor(map: Map, index: number) {
            super();

            this.frustumCulled = false;

            this.map = map;
            this.index = index;

            this.loadInfo(this.map.info.modelUrl.replace("{index}", "0"));
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