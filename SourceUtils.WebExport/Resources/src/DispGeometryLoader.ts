/// <reference path="PagedLoader.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export interface IDispGeometryPage {
        displacements: IFace[];
        materials: IMaterialGroup[];
    }

    export class DispGeometryPage extends ResourcePage<IDispGeometryPage, WebGame.MeshHandle> {
        private readonly viewer: MapViewer;

        private matGroups: WebGame.MeshHandle[][];
        private dispFaces: IFace[];

        constructor(viewer: MapViewer, page: IPageInfo) {
            super(page);

            this.viewer = viewer;
        }

        onLoadValues(page: IDispGeometryPage): void {
            this.matGroups = new Array<WebGame.MeshHandle[]>(page.materials.length);
            this.dispFaces = page.displacements;

            for (let i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
                const matGroup = page.materials[i];
                const mat = this.viewer.materialLoader.load(matGroup.materialUrl);
                const data = WebGame.MeshManager.decompress(matGroup.meshData);
                this.matGroups[i] = this.viewer.meshes.addMeshData(data, index => mat);
            }

            super.onLoadValues(page);
        }

        protected onGetValue(index: number): Facepunch.WebGame.MeshHandle {
            const dispFace = this.dispFaces[index];
            return this.matGroups[dispFace.material][dispFace.element];
        }
    }

    export class DispGeometryLoader extends PagedLoader<DispGeometryPage, IDispGeometryPage, WebGame.MeshHandle> {
        readonly viewer: MapViewer;

        constructor(viewer: MapViewer) {
            super();

            this.viewer = viewer;
        }

        protected createPage(page: IPageInfo): DispGeometryPage {
            return new DispGeometryPage(this.viewer, page);
        }
    }
}