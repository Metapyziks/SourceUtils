namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export interface IPlane {
        norm: Facepunch.IVector3;
        dist: number;
    }

    export interface IBspElement {
        min: Facepunch.IVector3;
        max: Facepunch.IVector3;
    }

    export interface IBspNode extends IBspElement {
        plane: IPlane;
        children: IBspElement[];
    }

    export enum LeafFlags {
        Sky = 1,
        Radial = 2,
        Sky2D = 4
    }

    export interface IBspLeaf extends IBspElement {
        index: number;
        flags: LeafFlags;
        hasFaces: boolean;
        cluster?: number;
    }

    export interface IBspModel {
        index: number;
        min: Facepunch.IVector3;
        max: Facepunch.IVector3;
        origin: Facepunch.IVector3;
        headNode: IBspNode;
    }

    export class Plane {
        norm = new Facepunch.Vector3();
        dist = 0;

        copy(plane: IPlane): this {
            this.norm.copy(plane.norm);
            this.dist = plane.dist;

            return this;
        }
    }

    export interface INodeOrLeaf {
        readonly isLeaf: boolean;
    }

    export class BspNode implements INodeOrLeaf {
        private readonly loader: LeafGeometryLoader;

        readonly isLeaf = false;
        readonly plane = new Plane();
        readonly children = new Array<BspNode | BspLeaf>(2);

        constructor(loader: LeafGeometryLoader, info: IBspNode) {
            this.loader = loader;
            this.plane.copy(info.plane);
            this.children[0] = this.loadChild(info.children[0]);
            this.children[1] = this.loadChild(info.children[1]);
        }

        private loadChild(value: IBspElement): BspNode | BspLeaf {
            const node = value as IBspNode;
            if (node.children !== undefined) {
                return new BspNode(this.loader, node);
            }

            const leaf = value as IBspLeaf;
            return new BspLeaf(this.loader, leaf);
        }

        findLeaves(target: BspLeaf[]): void {
            this.children[0].findLeaves(target);
            this.children[1].findLeaves(target);
        }
    }

    export class BspLeaf extends WebGame.DrawListItem implements INodeOrLeaf {
        readonly isLeaf = true;

        private readonly loader: LeafGeometryLoader;

        readonly index: number;
        readonly flags: LeafFlags;
        readonly cluster: number;
        readonly hasFaces: boolean;

        private hasLoaded: boolean;

        constructor(loader: LeafGeometryLoader, info: IBspLeaf) {
            super();

            this.loader = loader;
            this.index = info.index;
            this.flags = info.flags;
            this.cluster = info.cluster;
            this.hasFaces = info.hasFaces;
        }

        getMeshHandles(): Facepunch.WebGame.MeshHandle[] {
            if (!this.hasFaces) return null;
            if (!this.hasLoaded) {
                this.hasLoaded = true;
                this.loader.load(this.index, handles => this.addMeshHandles(handles));
            }

            return super.getMeshHandles();
        }

        findLeaves(target: BspLeaf[]): void {
            if (this.hasFaces) target.push(this);
        }
    }

    export class BspModel extends WebGame.RenderResource<BspModel> implements Facepunch.ILoadable {
        readonly map: Map;
        readonly url: string;

        private info: IBspModel;
        private headNode: BspNode;
        private leaves: BspLeaf[];

        constructor(map: Map, url: string) {
            super();

            this.map = map;
            this.url = url;
        }

        loadNext(callback: (requeue: boolean) => void): void {
            if (this.info == null) {
                Facepunch.Http.getJson<IBspModel>(this.url, info => {
                    this.onLoad(info);
                    callback(false);
                }, error => {
                    console.warn(error);
                    callback(false);
                });
                return;
            }
        }

        getLeafAt(pos: Facepunch.IVector3): BspLeaf {
            if (this.headNode == null) return null;

            let elem: INodeOrLeaf = this.headNode;
            while (!elem.isLeaf) {
                const node = elem as BspNode;
                const index = node.plane.norm.dot(pos) >= node.plane.dist ? 0 : 1;
                elem = node.children[index];
            }

            return elem.isLeaf ? elem as BspLeaf : null;
        }

        getLeaves(): BspLeaf[] {
            return this.leaves;
        }

        private onLoad(info: IBspModel): void {
            this.info = info;
            this.headNode = new BspNode(this.map.viewer.leafGeometryLoader, info.headNode);
            this.leaves = [];

            this.headNode.findLeaves(this.leaves);
            this.dispatchOnLoadCallbacks();
        }

        isLoaded(): boolean {
            return this.info != null;
        }
    }

    export class BspModelLoader extends Facepunch.Loader<BspModel> {
        readonly viewer: MapViewer;

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        protected onCreateItem(url: string): BspModel {
            return new BspModel(this.viewer.map, url);
        }
    }
}