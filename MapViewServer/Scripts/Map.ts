/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class Map extends Entity {
        info: Api.BspIndexResponse;

        faceLoader = new FaceLoader(this);
        meshManager: WorldMeshManager;

        private renderer: THREE.Renderer;

        private lightmapMaterial: THREE.MeshBasicMaterial;
        private textureLoader: THREE.TextureLoader;

        private models: BspModel[] = [];
        private displacements: Displacement[] = [];

        private clusters: VisLeaf[];
        private pvsArray: VisLeaf[][];

        private pvsRoot: VisLeaf;
        private pvs: VisLeaf[] = [];

        constructor(url: string, renderer: THREE.Renderer) {
            super();

            this.renderer = renderer;
            this.frustumCulled = false;

            this.meshManager = new WorldMeshManager((renderer as THREE.WebGLRenderer).context);

            this.textureLoader = new THREE.TextureLoader();
            this.lightmapMaterial = new THREE.MeshBasicMaterial({ side: THREE.BackSide });

            this.loadInfo(url);
        }

        getLightmapMaterial(): THREE.Material {
            return this.lightmapMaterial;
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

        private loadInfo(url: string): void {
            $.getJSON(url,
                (data: Api.BspIndexResponse) => {
                    this.info = data;
                    this.models = new Array<BspModel>(data.numModels);
                    this.clusters = new Array<VisLeaf>(data.numClusters);
                    this.pvsArray = new Array<Array<VisLeaf>>(data.numClusters);
                    this.add(this.models[0] = new BspModel(this, 0));
                    this.loadDisplacements();
                    this.loadLightmap();
                });
        }

        private loadDisplacements(): void
        {
            $.getJSON(this.info.displacementsUrl,
                (data: Api.BspDisplacementsResponse) => {
                    this.displacements = [];

                    for (let i = 0; i < data.displacements.length; ++i) {
                        this.displacements.push(new Displacement(data.displacements[i]));
                    }
                });
        }

        private loadLightmap(): void {
            this.textureLoader.load(this.info.lightmapUrl,
                image => {
                    this.lightmapMaterial.map = image;
                    this.lightmapMaterial.needsUpdate = true;
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

        updatePvs(position: THREE.Vector3): void {
            const worldSpawn = this.getWorldSpawn();
            if (worldSpawn == null) return;

            const root = worldSpawn.findLeaf(position);
            if (root === this.pvsRoot) return;

            this.pvsRoot = root;
            if (root == null || root.cluster === -1) return;

            const pvs = this.pvsArray[root.cluster];
            if (pvs !== null && pvs !== undefined) {
                if (pvs.length > 0) this.replacePvs(pvs);
                return;
            }

            this.loadPvsArray(root.cluster);
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

        debugPrint(): void {
            this.meshManager.debugPrint();

            if (this.getWorldSpawn() != null) {
                this.getWorldSpawn().debugPrint();
            }
        }
    }
}