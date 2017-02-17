/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class Map extends Entity {
        info: Api.BspIndexResponse;

        faceLoader: FaceLoader;
        textureLoader: TextureLoader;
        meshManager: WorldMeshManager;
        shaderManager: ShaderManager;

        private app: AppBase;

        private lightmap: Texture;
        private blankTexture: Texture;
        private blankMaterial: Material;
        private errorMaterial: Material;
        private skyMaterial: Material;

        private models: BspModel[] = [];
        private displacements: Displacement[] = [];
        private materials: Material[] = [];

        private clusters: VisLeaf[];
        private pvsArray: VisLeaf[][];

        constructor(app: AppBase, url: string) {
            super();

            this.app = app;

            this.faceLoader = new FaceLoader(this);
            this.textureLoader = new TextureLoader(app.getContext());
            this.meshManager = new WorldMeshManager(app.getContext());
            this.shaderManager = new ShaderManager(app.getContext());

            this.blankTexture = new BlankTexture(app.getContext(), new THREE.Color(1, 1, 1));
            this.blankMaterial = new Material(this, "LightmappedGeneric");
            this.blankMaterial.properties.baseTexture = this.blankTexture;
            this.errorMaterial = new Material(this, "LightmappedGeneric");
            this.errorMaterial.properties.baseTexture = new ErrorTexture(app.getContext());

            this.loadInfo(url);
        }

        getApp(): AppBase {
            return this.app;
        }

        getLightmap(): Texture {
            return this.lightmap || this.blankTexture;
        }

        getBlankTexture(): Texture {
            return this.blankTexture;
        }

        getWorldSpawn(): BspModel {
            return this.models.length > 0 ? this.models[0] : null;
        }

        setSkyMaterialEnabled(value: boolean): void
        {
            if (this.skyMaterial != null) this.skyMaterial.enabled = value;
        }

        getMaterial(index: number): Material {
            return index === -1
                ? this.skyMaterial
                : (index < this.materials.length ? this.materials[index] : this.blankMaterial) || this.errorMaterial;
        }

        private loadInfo(url: string): void {
            $.getJSON(url,
                (data: Api.BspIndexResponse) => {
                    this.info = data;
                    this.models = new Array<BspModel>(data.numModels);
                    this.clusters = new Array<VisLeaf>(data.numClusters);
                    this.pvsArray = new Array<Array<VisLeaf>>(data.numClusters);
                    this.loadDisplacements();
                    this.loadMaterials();
                    this.lightmap = new Lightmap(this.app.getContext(), data.lightmapUrl);

                    this.skyMaterial = new Material(this, data.skyMaterial);

                    for (let i = 0; i < data.brushEnts.length; ++i) {
                        const ent = data.brushEnts[i];
                        if (this.models[ent.model] !== undefined) throw "Multiple models with the same index.";
                        this.models[ent.model] = new BspModel(this, ent);
                    }
                });
        }

        private loadDisplacements(): void {
            $.getJSON(this.info.displacementsUrl,
                (data: Api.BspDisplacementsResponse) => {
                    this.displacements = [];

                    for (let i = 0; i < data.displacements.length; ++i) {
                        this.displacements.push(new Displacement(this.getWorldSpawn(), data.displacements[i]));
                    }
                });
        }

        private loadMaterials(): void {
            $.getJSON(this.info.materialsUrl,
                (data: Api.BspMaterialsResponse) => {
                    this.materials = [];

                    for (let i = 0; i < data.materials.length; ++i) {
                        const mat = data.materials[i];
                        if (mat == null) {
                            this.materials.push(null);
                        } else {
                            this.materials.push(new Material(this, data.materials[i]));
                        }
                    }
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

        update(): void {
            this.faceLoader.update();
            this.textureLoader.update();
        }

        getPvsArray(root: VisLeaf, callback: (pvs: VisLeaf[]) => void): void {
            const pvs = this.pvsArray[root.cluster];
            if (pvs != null) {
                callback(pvs);
                return;
            }

            this.loadPvsArray(root, callback);
        }

        appendToDrawList(drawList: DrawList, pvs: VisLeaf[]): void {
            for (let i = 0, iEnd = pvs.length; i < iEnd; ++i) {
                drawList.addItem(pvs[i]);
            }

            for (let i = this.displacements.length - 1; i >= 0; --i) {
                const disp = this.displacements[i];
                const clusters = disp.clusters;

                for (let j = 0, jEnd = clusters.length; j < jEnd; ++j) {
                    if (this.clusters[clusters[j]].getIsInDrawList(drawList)) {
                        drawList.addItem(disp);
                        break;
                    }
                }
            }

            for (let i = 1, iEnd = this.models.length; i < iEnd; ++i) {
                if (this.models[i] == null) continue;
                const leaves = this.models[i].getLeaves();

                for (let j = 0, jEnd = leaves.length; j < jEnd; ++j) {
                    drawList.addItem(leaves[j]);
                }
            }
        }

        private loadPvsArray(root: VisLeaf, callback?: (pvs: VisLeaf[]) => void): void {
            const pvs = this.pvsArray[root.cluster] = [];

            const url = this.info.visibilityUrl.replace("{index}", root.cluster.toString());
            $.getJSON(url,
                (data: Api.BspVisibilityResponse) => {
                    const indices = Utils.decompress(data.pvs);

                    for (let i = 0; i < indices.length; ++i) {
                        const leaf = this.clusters[indices[i]];
                        if (leaf !== undefined) pvs.push(leaf);
                    }

                    if (callback != null) callback(pvs);
                });
        }
    }
}