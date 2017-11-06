/// <reference path="PagedLoader.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export interface IMapMaterialPage {
        textures: WebGame.ITextureInfo[];
        materials: WebGame.IMaterialInfo[];
    }

    export class MapMaterialPage extends ResourcePage<IMapMaterialPage, WebGame.IMaterialInfo> {
        private readonly viewer: MapViewer;

        private materials: WebGame.IMaterialInfo[];

        constructor(viewer: MapViewer, page: IPageInfo) {
            super(page);

            this.viewer = viewer;
        }

        onLoadValues(page: IMapMaterialPage): void {
            this.materials = page.materials;

            const textures = page.textures;
            for (let i = 0, iEnd = this.materials.length; i < iEnd; ++i) {
                const mat = this.materials[i];
                if (mat == null) continue;
                const props = mat.properties;
                for (let j = 0, jEnd = props.length; j < jEnd; ++j) {
                    const prop = props[j];
                    if (prop.type !== WebGame.MaterialPropertyType.TextureIndex) continue;
                    prop.type = WebGame.MaterialPropertyType.TextureInfo;
                    prop.value = textures[prop.value as number];
                }
            }

            super.onLoadValues(page);
        }

        protected onGetValue(index: number): WebGame.IMaterialInfo {
            return this.materials[index];
        }
    }

    export class MapMaterialLoader extends PagedLoader<IMapMaterialPage, WebGame.IMaterialInfo, MapMaterialPage> {
        readonly viewer: MapViewer;

        private readonly materials: {[index: number]: WebGame.MaterialLoadable} = {};

        constructor(viewer: MapViewer) {
            super();
            this.viewer = viewer;
        }

        loadMaterial(index: number): WebGame.Material {
            let material = this.materials[index];
            if (material !== undefined) return material;
            this.materials[index] = material = new WebGame.MaterialLoadable(this.viewer);
            this.load(index, info => info == null ? null : material.loadFromInfo(info));
            return material;
        }

        protected onCreatePage(page: IPageInfo): MapMaterialPage {
            return new MapMaterialPage(this.viewer, page);
        }
    }
}