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

        createMeshHandles(bodyPartIndex: number, transform: Facepunch.Matrix4, vertLighting?: number[][]): WebGame.MeshHandle[] {
            const bodyPart = this.info.bodyParts[bodyPartIndex];
            const handles: WebGame.MeshHandle[] = [];

            const matGroups: WebGame.IMeshData[] = [];

            for (let model of bodyPart.models) {
                for (let mesh of model.meshes) {
                    const srcGroup = this.page.getMaterialGroup(mesh.material);
                    const attribs = [];
                    attribs.push.apply(attribs, srcGroup.attributes);
                    attribs.push(WebGame.VertexAttribute.rgb);

                    const dstGroup = StudioModel.getOrCreateMatGroup(matGroups, attribs);
                    const newElem = WebGame.MeshManager.copyElement(srcGroup, dstGroup, mesh.element);

                    if (vertLighting == null || mesh.meshId === undefined || mesh.meshId < 0 || mesh.meshId >= vertLighting.length) continue;

                    const rgbOffset = WebGame.MeshManager.getAttributeOffset(attribs, WebGame.VertexAttribute.rgb);
                    const vertLength = WebGame.MeshManager.getVertexLength(attribs);
                    const lighting = vertLighting[mesh.meshId];

                    const compMul = 2 / 255;
                    const vertData = dstGroup.vertices;
                    for (let i = newElem.vertexOffset + rgbOffset,
                        iEnd = newElem.vertexOffset + newElem.vertexCount,
                        j = 0; i < iEnd; i += vertLength, ++j) {
                        const lightValue = lighting[j];
                        const r = ((lightValue >> 16) & 0xff) * compMul;
                        const g = ((lightValue >> 8) & 0xff) * compMul;
                        const b = (lightValue & 0xff) * compMul;

                        vertData[i] = r;
                        vertData[i + 1] = g;
                        vertData[i + 2] = b;
                    }
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
        private matGroups: WebGame.IMeshData[];
        private models: IStudioModel[];

        constructor(page: IPageInfo) {
            super(page);
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
            return new StudioModelPage(page);
        }
    }

    export interface IVertexLightingPage {
        props: (string | number[])[][];
    }

    export class VertexLightingPage extends ResourcePage<IVertexLightingPage, number[][]> {
        private props: number[][][];

        onLoadValues(page: IVertexLightingPage): void {
            this.props = new Array<number[][]>(page.props.length);

            for (let i = 0, iEnd = page.props.length; i < iEnd; ++i) {
                const srcProp = page.props[i];
                const dstProp = this.props[i] = new Array<number[]>(srcProp.length);

                for (let j = 0, jEnd = srcProp.length; j < jEnd; ++j) {
                    dstProp[j] = Facepunch.Utils.decompress(srcProp[j]);
                }
            }

            super.onLoadValues(page);
        }

        onGetValue(index: number): number[][] {
            return this.props[index];
        }
    }

    export class VertexLightingLoader extends PagedLoader<VertexLightingPage, IVertexLightingPage, number[][]> {
        onCreatePage(page: IPageInfo): VertexLightingPage {
            return new VertexLightingPage(page);
        }
    }
}
