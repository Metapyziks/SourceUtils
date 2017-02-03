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

    export class VisLeaf extends THREE.Mesh implements IVisElem {
        isLeaf = true;
        bounds: THREE.Box3;

        cluster: number;

        private model: BspModel;
        private firstFace: number;
        private numFaces: number;
        private loadedFaces = false;

        constructor(model: BspModel, info: Api.BspLeaf) {
            super(new THREE.BufferGeometry(), new THREE.MultiMaterial([new THREE.MeshPhongMaterial({side: THREE.BackSide})]));

            const min = info.min;
            const max = info.max;

            this.model = model;
            this.cluster = info.cluster === undefined ? -1 : info.cluster;
            this.numFaces = info.numFaces === undefined ? 0 : info.numFaces;
            this.firstFace = info.firstFace;

            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
            this.visible = false;
        }

        hasFaces(): boolean { return this.numFaces > 0; }

        getAllLeaves(dstArray: VisLeaf[]): void {
            dstArray.push(this);
        }

        loadFaces(): void {
            if (!this.hasFaces() || this.loadedFaces) return;

            const url = this.model.map.info.facesUrl
                .replace("{from}", this.firstFace.toString())
                .replace("{count}", this.numFaces.toString());

            const geom = this.geometry as THREE.BufferGeometry;

            $.getJSON(url, (data: Api.BspFacesResponse) => {
                // TODO
                this.setDrawMode(THREE.TriangleFanDrawMode);

                geom.addAttribute("position",
                    new THREE.BufferAttribute(Utils.decompressFloat32Array(data.vertices), 3));
                geom.addAttribute("normal",
                    new THREE.BufferAttribute(Utils.decompressFloat32Array(data.normals), 3, true));
                geom.setIndex(new THREE.BufferAttribute(Utils.decompressUint32Array(data.indices), 1));

                geom.clearGroups();

                for (let i = 0; i < data.faces.length; ++i) {
                    const face = data.faces[i];
                    geom.addGroup(face.offset, face.count);
                }

                this.loadedFaces = true;
                this.visible = true;
            });
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

            this.map = map;
            this.index = index;

            this.loadInfo(this.map.info.modelUrl.replace("{index}", "0"));
        }

        private loadInfo(url: string): void {
            $.getJSON(url, (data: Api.BspModelResponse) => {
                this.info = data;
                this.loadTree();
            });
        }

        private loadTree(): void {
            this.leaves = [];
            this.root = new VisNode(this, Utils.decompress(this.info.tree));
            this.root.getAllLeaves(this.leaves);

            for (let i = 0; i < this.leaves.length; ++i) {
                if (this.leaves[i].hasFaces()) {
                    this.leaves[i].loadFaces();
                    this.add(this.leaves[i]);
                }
            }
        }
    }

    export class Map extends Entity {
        info: Api.BspIndexResponse;

        private models: BspModel[];

        constructor(url: string) {
            super();

            this.loadInfo(url);
        }

        private loadInfo(url: string): void {
            $.getJSON(url, (data: Api.BspIndexResponse) => {
                this.info = data;
                this.models = new Array<BspModel>(data.numModels);
                this.add(this.models[0] = new BspModel(this, 0));
            });
        }
    }
}