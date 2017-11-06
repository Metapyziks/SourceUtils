/// <reference path="PagedLoader.ts"/>

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
        private readonly viewer: MapViewer;

        readonly isLeaf = false;
        readonly plane = new Plane();
        readonly children = new Array<BspNode | BspLeaf>(2);

        constructor(viewer: MapViewer, info: IBspNode) {
            this.viewer = viewer;
            this.plane.copy(info.plane);
            this.children[0] = this.loadChild(info.children[0]);
            this.children[1] = this.loadChild(info.children[1]);
        }

        private loadChild(value: IBspElement): BspNode | BspLeaf {
            const node = value as IBspNode;
            if (node.children !== undefined) {
                return new BspNode(this.viewer, node);
            }

            const leaf = value as IBspLeaf;
            return new BspLeaf(this.viewer, leaf);
        }

        findLeaves(target: BspLeaf[]): void {
            this.children[0].findLeaves(target);
            this.children[1].findLeaves(target);
        }
    }

    export class BspLeaf extends WebGame.DrawListItem implements INodeOrLeaf {
        readonly isLeaf = true;

        private readonly viewer: MapViewer;

        readonly index: number;
        readonly flags: LeafFlags;
        readonly cluster: number;
        readonly hasFaces: boolean;

        private hasLoaded: boolean;
        private ambientSamples: IAmbientSample[];
        private hasLoadedAmbient: boolean;

        constructor(viewer: MapViewer, info: IBspLeaf) {
            super();

            this.viewer = viewer;
            this.index = info.index;
            this.flags = info.flags;
            this.cluster = info.cluster;
            this.hasFaces = info.hasFaces;
        }

        private static readonly getAmbientCube_temp = new Facepunch.Vector3();
        getAmbientCube(pos: Facepunch.IVector3, outSamples: Facepunch.IVector3[], callback?: (success: boolean) => void): boolean {
            if (!this.hasLoadedAmbient) {
                this.hasLoadedAmbient = true;
                this.viewer.ambientLoader.load(this.index, value => this.ambientSamples = value);
            }

            const samples = this.ambientSamples;
            if (samples == null) {
                if (callback != null) {
                    const leafCopy = this;
                    this.viewer.ambientLoader.load(this.index, value => {
                        if (value.length > 0) {
                            if (pos != null) leafCopy.getAmbientCube(pos, outSamples);
                            callback(true);
                        } else {
                            callback(false);
                        }
                    });
                }
                return false;
            }

            if (samples.length === 0) {
                if (callback != null) callback(false);
                return false;
            }

            if (pos != null) {
                let closestIndex: number = undefined;
                let closestDistSq = Number.MAX_VALUE;

                const temp = BspLeaf.getAmbientCube_temp;

                // TODO: interpolation

                for (let i = 0; i < samples.length; ++i) {
                    const sample = samples[i];
                    temp.copy(sample.position);
                    temp.sub(pos);
                    const distSq = temp.lengthSq();

                    if (distSq < closestDistSq) {
                        closestDistSq = distSq;
                        closestIndex = i;
                    }
                }

                const closestSamples = samples[closestIndex].samples;

                for (let i = 0; i < 6; ++i) {
                    const rgbExp = closestSamples[i];
                    const outVec = outSamples[i] || (outSamples[i] = new Facepunch.Vector3());
                    ColorConversion.rgbExp32ToVector3(rgbExp, outVec);
                }
            }

            if (callback != null) callback(true);

            return true;
        }

        getMeshHandles(): Facepunch.WebGame.MeshHandle[] {
            if (!this.hasFaces) return null;
            if (!this.hasLoaded) {
                this.hasLoaded = true;
                this.viewer.leafGeometryLoader.load(this.index, handles => this.addMeshHandles(handles));
            }

            return super.getMeshHandles();
        }

        findLeaves(target: BspLeaf[]): void {
            if (this.hasFaces) target.push(this);
        }
    }

    export class BspModel extends WebGame.RenderResource<BspModel> {

        readonly viewer: MapViewer;

        private info: IBspModel;
        private headNode: BspNode;
        private leaves: BspLeaf[];

        constructor(viewer: MapViewer) {
            super();

            this.viewer = viewer;
        }

        loadFromInfo(info: IBspModel): void {
            this.info = info;
            this.headNode = new BspNode(this.viewer, info.headNode);
            this.leaves = [];

            this.headNode.findLeaves(this.leaves);
            this.dispatchOnLoadCallbacks();
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

        isLoaded(): boolean {
            return this.info != null;
        }
    }

    export interface IBspModelPage {
        models: IBspModel[];
    }

    export class BspModelPage extends ResourcePage<IBspModelPage, IBspModel> {
        private readonly viewer: MapViewer;

        private models: IBspModel[];

        constructor(viewer: MapViewer, page: IPageInfo) {
            super(page);

            this.viewer = viewer;
        }

        onLoadValues(page: IBspModelPage): void {
            this.models = page.models;

            super.onLoadValues(page);
        }

        protected onGetValue(index: number): IBspModel {
            return this.models[index];
        }
    }

    export class BspModelLoader extends PagedLoader<IBspModelPage, IBspModel, BspModelPage> {
        readonly viewer: MapViewer;

        private readonly models: { [index: number]: BspModel } = {};

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        loadModel(index: number): BspModel {
            let model = this.models[index];
            if (model !== undefined) return model;
            this.models[index] = model = new BspModel(this.viewer);
            this.load(index, info => model.loadFromInfo(info));
            return model;
        }

        onCreatePage(page: IPageInfo): BspModelPage {
            return new BspModelPage(this.viewer, page);
        }
    }
}