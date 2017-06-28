/// <reference path="PagedLoader.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export interface ISmdMesh {
        meshId: number;
        material: number;
        element: number;
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
        private page: StudioModelPage;

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        private static getOrCreateMatGroup(matGroups: WebGame.IMeshData[], attribs: WebGame.VertexAttribute[]): WebGame.IMeshData {
            for (let matGroup of matGroups) {
                if (matGroup.attributes.length !== attribs.length) continue;
                let matches = true;
                for (let i = 0; i < attribs.length; ++i) {
                    if (matGroup.attributes[i].id !== attribs[i].id) {
                        matches = false;
                        break;
                    }
                }
                if (matches) return matGroup;
            }

            const newGroup = WebGame.MeshManager.createEmpty(attribs);
            matGroups.push(newGroup);
            return newGroup;
        }

        createMeshHandles(bodyPartIndex: number, transform: Facepunch.Matrix4): WebGame.MeshHandle[] {
            const bodyPart = this.info.bodyParts[bodyPartIndex];
            const handles: WebGame.MeshHandle[] = [];

            const matGroups: WebGame.IMeshData[] = [];

            for (let model of bodyPart.models) {
                for (let mesh of model.meshes) {
                    const srcGroup = this.page.getMaterialGroup(mesh.material);
                    const dstGroup = StudioModel.getOrCreateMatGroup(matGroups, srcGroup.attributes);

                    WebGame.MeshManager.copyElement(srcGroup, dstGroup, mesh.element);
                }
            }

            for (let matGroup of matGroups) {
                WebGame.MeshManager.transform4F(matGroup, WebGame.VertexAttribute.position, pos => pos.applyMatrix4(transform), 1);
                WebGame.MeshManager.transform4F(matGroup, WebGame.VertexAttribute.normal, norm => norm.applyMatrix4(transform), 0);

                this.viewer.meshes.addMeshData(matGroup, index => this.viewer.mapMaterialLoader.loadMaterial(index), handles);
            }

            return handles;
        }

        loadFromInfo(info: IStudioModel, page: StudioModelPage): void {
            this.info = info;
            this.page = page;
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

        private matGroups: WebGame.IMeshData[];
        private models: IStudioModel[];

        constructor(viewer: MapViewer, page: IPageInfo) {
            super(page);

            this.viewer = viewer;
        }

        getMaterialGroup(index: number) {
            return this.matGroups[index];
        }

        onLoadValues(page: IStudioModelPage): void {
            this.models = page.models;
            this.matGroups = new Array<Facepunch.WebGame.IMeshData>(page.materials.length);

            for (let i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
                const matGroup = page.materials[i];
                this.matGroups[i] = WebGame.MeshManager.decompress(matGroup.meshData);
                for (let element of this.matGroups[i].elements) {
                    element.material = matGroup.material;
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
            this.load(index, (info, page) => model.loadFromInfo(info, page));
            return model;
        }

        onCreatePage(page: IPageInfo): StudioModelPage {
            return new StudioModelPage(this.viewer, page);
        }
    }
}
