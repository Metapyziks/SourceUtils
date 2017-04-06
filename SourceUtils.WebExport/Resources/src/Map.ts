/// <reference path="../js/facepunch.webgame.d.ts"/>

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

    export class Map implements WebGame.ICommandBufferParameterProvider {
        static readonly lightmapParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Texture);
        static readonly lightmapInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);

        readonly viewer: MapViewer;

        worldspawn: Entities.Worldspawn;

        private lightmap: WebGame.Texture;

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

            this.lightmap = this.viewer.textureLoader.load(info.lightmapUrl);

            for (let i = 0, iEnd = info.brushEntities.length; i < iEnd; ++i) {
                const ent = info.brushEntities[i];

                switch (ent.classname) {
                    case "worldspawn":
                        this.worldspawn = new Entities.Worldspawn(this, ent);
                        this.lightmap.addUsage(this.worldspawn);
                        break;
                }
            }

            this.viewer.forceDrawListInvalidation(true);
        }

        getLeafAt(pos: Facepunch.IVector3): BspLeaf {
            if (this.worldspawn == null || this.worldspawn.model == null) return null;
            return this.worldspawn.model.getLeafAt(pos);
        }

        populateDrawList(drawList: WebGame.DrawList, pvsRoot: BspLeaf): void {
            if (this.worldspawn == null) return;

            let vis: number[] = null;

            if (this.worldspawn.model != null && pvsRoot != null && pvsRoot.cluster !== undefined) {
                const cluster = pvsRoot.cluster;

                vis = this.clusterVis[cluster];
                if (vis === undefined) {
                    let immediate = true;
                    this.viewer.visLoader.load(cluster,
                        loaded => {
                            this.clusterVis[cluster] = vis = loaded;
                            if (!immediate) this.viewer.forceDrawListInvalidation(true);
                        });
                    immediate = false;

                    if (vis === undefined) {
                        this.clusterVis[cluster] = vis = null;
                    }
                }
            }

            this.worldspawn.populateDrawList(drawList, vis);
        }

        private readonly lightmapInfoValues = new Float32Array(4);

        populateCommandBufferParameters(buf: Facepunch.WebGame.CommandBuffer): void {
            const lightmap = this.lightmap != null && this.lightmap.isLoaded()
                ? this.lightmap
                : WebGame.TextureUtils.getWhiteTexture(this.viewer.context);

            buf.setParameter(Map.lightmapParam, lightmap);

            this.lightmapInfoValues[0] = lightmap.getWidth(0);
            this.lightmapInfoValues[1] = lightmap.getHeight(0);
            this.lightmapInfoValues[2] = 1 / this.lightmapInfoValues[0];
            this.lightmapInfoValues[3] = 1 / this.lightmapInfoValues[1];

            buf.setParameter(Map.lightmapInfoParam, this.lightmapInfoValues);
        }
    }
}