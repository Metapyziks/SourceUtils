namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export interface IPageInfo {
        first: number;
        count: number;
        url: string;
    }

    export interface IBrushEntity {
        classname: string;
        origin: Facepunch.IVector3;
        angles: Facepunch.IVector3;
        modelUrl: string;
        clusters?: number[];
    }

    export interface IMap {
        name: string;
        lightmapUrl: string;
        visPages: IPageInfo[];
        leafPages: IPageInfo[];
        brushEntities: IBrushEntity[];
    }

    export class Map {
        readonly viewer: MapViewer;

        worldspawn: Entities.Worldspawn;

        private info: IMap;
        private clusterVis: {[cluster: number]: number[]} = {};

        constructor(viewer: MapViewer) {
            this.viewer = viewer;
        }

        unload(): void {
            throw new Error("Map unloading not implemented.");
        }

        load(url: string): void {
            Facepunch.Http.getJson<IMap>(url, info => {
                this.onLoad(info);
            });
        }

        private onLoad(info: IMap): void {
            if (this.info != null) this.unload();

            this.info = info;
            this.viewer.leafGeometryLoader.setPageLayout(info.leafPages);
            this.viewer.visLoader.setPageLayout(info.visPages);

            for (let i = 0, iEnd = info.brushEntities.length; i < iEnd; ++i) {
                const ent = info.brushEntities[i];

                switch (ent.classname) {
                    case "worldspawn":
                        this.worldspawn = new Entities.Worldspawn(this, ent);
                        break;
                }
            }

            this.viewer.forceDrawListInvalidation(true);
        }

        populateDrawList(drawList: WebGame.DrawList, camera: WebGame.Camera): void {
            if (this.worldspawn == null) return;

            let vis: number[] = null;

            const pos = Facepunch.Vector3.pool.create();

            if (this.worldspawn.model != null) {
                const leaf = this.worldspawn.model.getLeafAt(camera.getPosition(pos));
                if (leaf != null && leaf.cluster !== undefined) {
                    const cluster = leaf.cluster;

                    vis = this.clusterVis[cluster];
                    if (vis == null) {
                        let immediate = true;
                        this.viewer.visLoader.load(cluster,
                            loaded => {
                                this.clusterVis[cluster] = vis = loaded;
                                if (!immediate) this.viewer.forceDrawListInvalidation(true);
                            });
                        immediate = false;

                        if (vis == null) {
                            this.clusterVis[cluster] = vis = [cluster];
                        }
                    }
                }
            }

            this.worldspawn.populateDrawList(drawList, vis);

            pos.release();
        }
    }
}