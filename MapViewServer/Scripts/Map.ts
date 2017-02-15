﻿/// <reference path="AppBase.ts"/>

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

        private pvsOrigin = new THREE.Vector3();
        private pvsRoot: VisLeaf;
        private pvs: VisLeaf[] = [];

        constructor(app: AppBase, url: string) {
            super();

            this.app = app;
            this.frustumCulled = false;

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

        getPvsRoot(): VisLeaf {
            return this.pvsRoot;
        }

        getPvs(): VisLeaf[] {
            return this.pvs;
        }

        getWorldSpawn(): BspModel {
            return this.models.length > 0 ? this.models[0] : null;
        }

        getMaterial(index: number): Material {
            return index === -1 ? this.skyMaterial : (index < this.materials.length ? this.materials[index] : this.blankMaterial) || this.errorMaterial;
        }

        private loadInfo(url: string): void {
            $.getJSON(url,
                (data: Api.BspIndexResponse) => {
                    this.info = data;
                    this.models = new Array<BspModel>(data.numModels);
                    this.clusters = new Array<VisLeaf>(data.numClusters);
                    this.pvsArray = new Array<Array<VisLeaf>>(data.numClusters);
                    this.add(this.models[0] = new BspModel(this, 0));
                    this.loadDisplacements();
                    this.loadMaterials();
                    this.lightmap = new Lightmap(this.app.getContext(), data.lightmapUrl);

                    this.skyMaterial = new Material(this, data.skyMaterial);

                    const spawnPos = data.playerStarts[0];
                    this.app.camera.position.set(spawnPos.x, spawnPos.y, spawnPos.z + 64);
                });
        }

        private loadDisplacements(): void {
            $.getJSON(this.info.displacementsUrl,
                (data: Api.BspDisplacementsResponse) => {
                    this.displacements = [];

                    for (let i = 0; i < data.displacements.length; ++i) {
                        this.displacements.push(new Displacement(data.displacements[i]));
                    }

                    this.refreshPvs();
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

        private replacePvs(pvs: VisLeaf[]): void {
            const drawList = this.getWorldSpawn().getDrawList();

            this.pvs = [];

            drawList.clear();

            for (let i = pvs.length - 1; i >= 0; --i) {
                drawList.addItem(pvs[i]);
                this.pvs.push(pvs[i]);
            }

            for (let i = this.displacements.length - 1; i >= 0; --i) {
                const disp = this.displacements[i];
                const clusters = disp.clusters;

                for (let j = 0, jEnd = clusters.length; j < jEnd; ++j) {
                    if (this.clusters[clusters[j]].getIsVisible()) {
                        drawList.addItem(disp);
                        break;
                    }
                }
            }

            this.faceLoader.update();
        }

        render(camera: THREE.Camera): void {
            this.textureLoader.update();
            const worldSpawn = this.getWorldSpawn();
            if (worldSpawn != null) worldSpawn.render(camera);
        }

        updatePvs(position: THREE.Vector3, force?: boolean): void {
            const worldSpawn = this.getWorldSpawn();
            if (worldSpawn == null) return;

            this.pvsOrigin.copy(position);

            const root = worldSpawn.findLeaf(position);
            if (root === this.pvsRoot && !force) return;

            this.pvsRoot = root;
            if (root == null || root.cluster === -1) return;

            const pvs = this.pvsArray[root.cluster];
            if (pvs !== null && pvs !== undefined) {
                if (pvs.length > 0) this.replacePvs(pvs);
                return;
            }

            this.loadPvsArray(root.cluster);
        }

        refreshPvs(): void {
            this.updatePvs(this.pvsOrigin, true);
        }

        private loadPvsArray(cluster: number): void {
            const pvs = this.pvsArray[cluster] = [];

            const url = this.info.visibilityUrl.replace("{index}", cluster.toString());
            $.getJSON(url,
                (data: Api.BspVisibilityResponse) => {
                    const indices = Utils.decompress(data.pvs);

                    for (let i = 0; i < indices.length; ++i) {
                        const leaf = this.clusters[indices[i]];
                        if (leaf !== undefined) pvs.push(leaf);
                    }

                    if (this.pvsRoot != null && this.pvsRoot.cluster === cluster) {
                        this.replacePvs(pvs);
                    }
                });
        }
    }
}