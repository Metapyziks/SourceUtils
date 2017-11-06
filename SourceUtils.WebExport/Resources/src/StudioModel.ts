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

        private static encode2CompColor(vertLit: number, albedoMod: number): number {
            return vertLit + albedoMod * 0.00390625;
        }

        private static readonly sampleAmbientCube_samples = new Array<Facepunch.Vector3>(6);
        private static readonly sampleAmbientCube_temp = new Facepunch.Vector3();
        private static sampleAmbientCube(leaf: BspLeaf, pos: Facepunch.IVector3, normal: Facepunch.IVector3): number {
            const rgb = StudioModel.sampleAmbientCube_temp.set(0, 0, 0);
            const samples = StudioModel.sampleAmbientCube_samples;

            leaf.getAmbientCube(pos, samples);

            let sample: Facepunch.IVector3;
            let mul: number;

            if (normal.x < 0) {
                sample = samples[1];
            } else {
                sample = samples[0];
            }

            mul = normal.x * normal.x;
            rgb.add(sample.x * mul, sample.y * mul, sample.z * mul);

            if (normal.y < 0) {
                sample = samples[3];
            } else {
                sample = samples[2];
            }

            mul = normal.y * normal.y;
            rgb.add(sample.x * mul, sample.y * mul, sample.z * mul);

            if (normal.z < 0) {
                sample = samples[5];
            } else {
                sample = samples[4];
            }

            mul = normal.z * normal.z;
            rgb.add(sample.x * mul, sample.y * mul, sample.z * mul);

            const r = ColorConversion.linearToScreenGamma(rgb.x);
            const g = ColorConversion.linearToScreenGamma(rgb.y);
            const b = ColorConversion.linearToScreenGamma(rgb.z);

            return r | (g << 8) | (b << 16);
        }

        createMeshHandles(bodyPartIndex: number, transform: Facepunch.Matrix4, lighting?: (number[][] | BspLeaf), albedoModulation?: number): WebGame.MeshHandle[] {
            const bodyPart = this.info.bodyParts[bodyPartIndex];
            const handles: WebGame.MeshHandle[] = [];

            const matGroups: WebGame.IMeshData[] = [];

            if (albedoModulation === undefined) albedoModulation = 0xffffff;
            else albedoModulation &= 0xffffff;

            const albedoR = albedoModulation & 0xff;
            const albedoG = (albedoModulation >> 8) & 0xff;
            const albedoB = (albedoModulation >> 16) & 0xff;

            const hasAmbientLighting = lighting != null && (lighting as BspLeaf).isLeaf;
            const hasVertLighting = lighting != null && !hasAmbientLighting;

            const leaf = hasAmbientLighting ? lighting as BspLeaf : null;
            const tempPos = new Facepunch.Vector4();
            const tempNormal = new Facepunch.Vector4();

            for (let model of bodyPart.models) {
                for (let mesh of model.meshes) {
                    const srcGroup = this.page.getMaterialGroup(mesh.material);
                    const attribs = [];
                    attribs.push.apply(attribs, srcGroup.attributes);
                    attribs.push(WebGame.VertexAttribute.rgb);

                    const dstGroup = StudioModel.getOrCreateMatGroup(matGroups, attribs);
                    const newElem = WebGame.MeshManager.copyElement(srcGroup, dstGroup, mesh.element);

                    const posOffset = WebGame.MeshManager.getAttributeOffset(attribs, WebGame.VertexAttribute.position);
                    const normalOffset = WebGame.MeshManager.getAttributeOffset(attribs, WebGame.VertexAttribute.normal);
                    const rgbOffset = WebGame.MeshManager.getAttributeOffset(attribs, WebGame.VertexAttribute.rgb);
                    const vertLength = WebGame.MeshManager.getVertexLength(attribs);
                    const vertLighting = hasVertLighting ? (lighting as number[][])[mesh.meshId] : null;

                    const vertData = dstGroup.vertices;
                    for (let i = newElem.vertexOffset,
                        iEnd = newElem.vertexOffset + newElem.vertexCount,
                        j = 0; i < iEnd; i += vertLength, ++j) {

                        const posIndex = i + posOffset;
                        const normalIndex = i + normalOffset;
                        const rgbIndex = i + rgbOffset;

                        let r: number;
                        let g: number;
                        let b: number;

                        if (hasVertLighting) {
                            const rgba = vertLighting[j];
                            r = rgba & 0xff;
                            g = (rgba >> 8) & 0xff;
                            b = (rgba >> 16) & 0xff;
                        } else if (hasAmbientLighting) {
                            tempPos.set(vertData[posIndex], vertData[posIndex + 1], vertData[posIndex + 2], 1);
                            tempPos.applyMatrix4(transform);
                            tempNormal.set(vertData[normalIndex], vertData[normalIndex + 1], vertData[normalIndex + 2], 0);
                            tempNormal.applyMatrix4(transform);
                            const rgb = StudioModel.sampleAmbientCube(leaf, tempPos, tempNormal);
                            r = rgb & 0xff;
                            g = (rgb >> 8) & 0xff;
                            b = (rgb >> 16) & 0xff;
                        } else {
                            r = g = b = 0x7f;
                        }

                        vertData[rgbIndex] = StudioModel.encode2CompColor(r, albedoR);
                        vertData[rgbIndex + 1] = StudioModel.encode2CompColor(g, albedoG);
                        vertData[rgbIndex + 2] = StudioModel.encode2CompColor(b, albedoB);
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

        protected onGetValue(index: number): IStudioModel {
            return this.models[index];
        }
    }

    export class StudioModelLoader extends PagedLoader<IStudioModelPage, IStudioModel, StudioModelPage> {
        readonly viewer: MapViewer;

        private readonly models: { [index: number]: StudioModel } = {};

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        update(requestQuota: number): number {
            return super.update(this.viewer.visLoader.getLoadProgress() < 1 ? 0 : requestQuota);
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
                const dstProp = this.props[i] = srcProp == null ? null : new Array<number[]>(srcProp.length);

                if (srcProp == null) continue;
                for (let j = 0, jEnd = srcProp.length; j < jEnd; ++j) {
                    dstProp[j] = Facepunch.Utils.decompress(srcProp[j]);
                }
            }

            super.onLoadValues(page);
        }

        protected onGetValue(index: number): number[][] {
            return this.props[index];
        }
    }

    export class VertexLightingLoader extends PagedLoader<IVertexLightingPage, number[][], VertexLightingPage> {
        readonly viewer: MapViewer;

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        update(requestQuota: number): number {
            return super.update(this.viewer.visLoader.getLoadProgress() < 1 ? 0 : requestQuota);
        }

        onCreatePage(page: IPageInfo): VertexLightingPage {
            return new VertexLightingPage(page);
        }
    }
}
