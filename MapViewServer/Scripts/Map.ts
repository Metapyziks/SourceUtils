/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class Map extends Entity {
        info: Api.IBspIndexResponse;

        faceLoader: FaceLoader;
        textureLoader: TextureLoader;
        modelLoader: StudioModelLoader;
        hardwareVertsLoader: HardwareVertsLoader;

        meshManager: WorldMeshManager;
        shaderManager: ShaderManager;

        private app: AppBase;

        private loaders: ILoader[] = [];

        private lightmap: Texture;
        private blankTexture: Texture;
        private blankMaterial: Material;
        private errorMaterial: Material;
        private skyMaterial: Material;

        private models: BspModel[] = [];
        private displacements: Displacement[] = [];
        private staticProps: PropStatic[] = [];
        private materials: Material[] = [];

        private clusters: VisLeaf[][];
        private pvsArray: VisLeaf[][];

        constructor(app: AppBase, url: string) {
            super();

            this.app = app;

            this.faceLoader = this.addLoader(new FaceLoader(this));
            this.modelLoader = this.addLoader(new StudioModelLoader(this));
            this.hardwareVertsLoader = this.addLoader(new HardwareVertsLoader());
            this.textureLoader = this.addLoader(new TextureLoader(app.getContext()));

            this.meshManager = new WorldMeshManager(app.getContext());
            this.shaderManager = new ShaderManager(app.getContext());

            this.blankTexture = new BlankTexture(app.getContext(), new THREE.Color(1, 1, 1));
            this.blankMaterial = new Material(this, "LightmappedGeneric");
            this.blankMaterial.properties.baseTexture = this.blankTexture;
            this.errorMaterial = new Material(this, "LightmappedGeneric");
            this.errorMaterial.properties.baseTexture = new ErrorTexture(app.getContext());

            this.loadInfo(url);
        }

        private addLoader<TLoader extends ILoader>(loader: TLoader): TLoader {
            this.loaders.push(loader);
            return loader;
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

        setSkyMaterialEnabled(value: boolean): void {
            if (this.skyMaterial != null) this.skyMaterial.enabled = value;
        }

        getMaterial(index: number): Material {
            return index === -1
                ? this.skyMaterial
                : (index < this.materials.length ? this.materials[index] : this.blankMaterial) || this.errorMaterial;
        }

        private loadInfo(url: string): void {
            $.getJSON(url,
                (data: Api.IBspIndexResponse) => {
                    this.info = data;
                    this.models = new Array<BspModel>(data.numModels);
                    this.clusters = new Array<VisLeaf[]>(data.numClusters);

                    for (let i = 0; i < data.numClusters; ++i) {
                        this.clusters[i] = new Array<VisLeaf>();
                    }

                    this.pvsArray = new Array<Array<VisLeaf>>(data.numClusters);
                    this.lightmap = new Lightmap(this.app.getContext(), data.lightmapUrl);

                    this.loadDisplacements();
                    this.loadMaterials();
                    this.loadStaticProps();

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
                (data: Api.IBspDisplacementsResponse) => {
                    this.displacements = [];

                    for (let i = 0; i < data.displacements.length; ++i) {
                        this.displacements.push(new Displacement(this.getWorldSpawn(), data.displacements[i]));
                    }

                    this.forcePvsInvalidation();
                });
        }

        private loadMaterials(): void {
            $.getJSON(this.info.materialsUrl,
                (data: Api.IBspMaterialsResponse) => {
                    this.materials = [];

                    for (let i = 0; i < data.materials.length; ++i) {
                        const mat = data.materials[i];
                        if (mat == null) {
                            this.materials.push(null);
                        } else {
                            this.materials.push(new Material(this, data.materials[i]));
                        }
                    }

                    this.forcePvsInvalidation();
                });
        }

        private loadStaticProps(): void {
            $.getJSON(this.info.staticPropsUrl,
                (data: Api.IBspStaticPropsResponse) => {
                    this.staticProps = [];

                    for (let i = 0; i < data.props.length; ++i) {
                        const prop = data.props[i];
                        if (typeof prop.model === "number") {
                            prop.model = data.models[prop.model];
                        }

                        this.staticProps.push(new PropStatic(this, prop));
                    }

                    this.forcePvsInvalidation();
                });
        }

        private forcePvsInvalidation(): void {
            const world = this.getWorldSpawn();
            if (world == null) return;
            const leaves = world.getLeaves();
            if (leaves == null) return;
            for (let i = 0; i < leaves.length; ++i) {
                leaves[i].invalidateDrawLists();
            }
        }

        onModelLoaded(model: BspModel): void {
            if (model !== this.getWorldSpawn()) return;

            const leaves = model.getLeaves();
            for (let i = 0; i < leaves.length; ++i) {
                const leaf = leaves[i];
                if (leaf.cluster === -1) continue;
                this.clusters[leaf.cluster].push(leaf);
            }
        }

        update(): void {
            for (let i = 0; i < this.loaders.length; ++i) {
                this.loaders[i].update(4);
            }
        }

        getPvsArray(root: VisLeaf, callback: (pvs: VisLeaf[]) => void): void {
            const pvs = this.pvsArray[root.cluster];
            if (pvs != null) {
                callback(pvs);
                return;
            }

            this.loadPvsArray(root, callback);
        }

        private isAnyClusterVisible(clusters: number[], drawList: DrawList): boolean {
            for (let j = 0, jEnd = clusters.length; j < jEnd; ++j) {
                if (this.clusters[clusters[j]][0].getIsInDrawList(drawList)) return true;
            }
            return false;
        }

        appendToDrawList(drawList: DrawList, pvs: VisLeaf[]): void {
            for (let i = 0, iEnd = pvs.length; i < iEnd; ++i) {
                drawList.addItem(pvs[i]);
            }

            for (let i = this.displacements.length - 1; i >= 0; --i) {
                const disp = this.displacements[i];
                if (this.isAnyClusterVisible(disp.clusters, drawList)) {
                    drawList.addItem(disp);
                }
            }

            for (let i = 1, iEnd = this.models.length; i < iEnd; ++i) {
                const model = this.models[i];
                if (model == null) continue;
                if (!this.isAnyClusterVisible(model.clusters, drawList)) continue;

                const leaves = model.getLeaves();
                for (let j = 0, jEnd = leaves.length; j < jEnd; ++j) {
                    drawList.addItem(leaves[j]);
                }
            }

            for (let i = 0, iEnd = this.staticProps.length; i < iEnd; ++i) {
                const prop = this.staticProps[i];
                if (prop == null) continue;
                if (!this.isAnyClusterVisible(prop.clusters, drawList)) continue;
                drawList.addItem(prop.getDrawListItem());
            }
        }

        private loadPvsArray(root: VisLeaf, callback?: (pvs: VisLeaf[]) => void): void {
            const pvs = this.pvsArray[root.cluster] = [];

            const url = this.info.visibilityUrl.replace("{index}", root.cluster.toString());
            $.getJSON(url,
                (data: Api.IBspVisibilityResponse) => {
                    const indices = Utils.decompress(data.pvs);

                    for (let i = 0; i < indices.length; ++i) {
                        const cluster = this.clusters[indices[i]];
                        for (let j = 0; j < cluster.length; ++j) {
                            pvs.push(cluster[j]);
                        }
                    }

                    if (callback != null) callback(pvs);
                });
        }
    }
}