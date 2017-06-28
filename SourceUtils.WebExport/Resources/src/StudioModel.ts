/// <reference path="PagedLoader.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export interface ISmdMesh {
        meshId: number;
        material: number;
        element: number;
        meshHandle?: WebGame.MeshHandle;
    }

    export interface ISmdModel {
        meshes: ISmdMesh[];
    }

    export interface ISmdBodyPart {
        name: string;
        models: ISmdModel[];
    }

    export interface IStudioModel {
        bodyParts: ISmdBodyPart[];
    }

    export class StudioModel extends WebGame.RenderResource<StudioModel> {
        readonly viewer: MapViewer;

        private info: IStudioModel;

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        getMeshHandles(bodyPartIndex: number, target: WebGame.MeshHandle[]): number {
            const bodyPart = this.info.bodyParts[bodyPartIndex];
            if (bodyPart == null) return 0;

            let added = 0;
            for (let model of bodyPart.models) {
                for (let mesh of model.meshes) {
                    if (mesh.meshHandle == null) continue;
                    target.push(mesh.meshHandle);
                    ++added;
                }
            }

            return added;
        }

        loadFromInfo(info: IStudioModel): void {
            this.info = info;
            this.dispatchOnLoadCallbacks();
        }

        isLoaded(): boolean { return this.info != null; }
    }

    export interface IStudioModelPage {
        models: IStudioModel[];
        materials: IMaterialGroup[];
    }

    export class StudioModelPage extends ResourcePage<IStudioModelPage, IStudioModel> {
        private readonly viewer: MapViewer;

        private matGroups: WebGame.MeshHandle[][];
        private models: IStudioModel[];

        constructor(viewer: MapViewer, page: IPageInfo) {
            super(page);

            this.viewer = viewer;
        }

        onLoadValues(page: IStudioModelPage): void {
            this.models = page.models;
            this.matGroups = new Array<WebGame.MeshHandle[]>(page.materials.length);

            for (let i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
                const matGroup = page.materials[i];
                const mat = this.viewer.mapMaterialLoader.loadMaterial(matGroup.material);
                const data = WebGame.MeshManager.decompress(matGroup.meshData);
                for (let element of data.elements) {
                    element.material = mat;
                }
                this.matGroups[i] = this.viewer.meshes.addMeshData(data);
            }

            for (let smd of this.models) {
                for (let bodyPart of smd.bodyParts) {
                    for (let model of bodyPart.models) {
                        for (let mesh of model.meshes) {
                            mesh.meshHandle = this.matGroups[mesh.material][mesh.element];
                        }
                    }
                }
            }

            super.onLoadValues(page);
        }

        onGetValue(index: number): IStudioModel {
            return this.models[index];
        }
    }

    export class StudioModelLoader extends PagedLoader<StudioModelPage, IStudioModelPage, IStudioModel> {
        readonly viewer: MapViewer;

        private readonly models: { [index: number]: StudioModel } = {};

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        loadModel(index: number): StudioModel {
            let model = this.models[index];
            if (model !== undefined) return model;
            this.models[index] = model = new StudioModel(this.viewer);
            this.load(index, info => model.loadFromInfo(info));
            return model;
        }

        onCreatePage(page: IPageInfo): StudioModelPage {
            return new StudioModelPage(this.viewer, page);
        }
    }
}
