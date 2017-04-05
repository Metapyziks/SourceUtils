namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export class BrushEntity extends WebGame.DrawableEntity {
            readonly map: Map;
            readonly info: IBrushEntity;

            readonly model: BspModel;

            constructor(map: Map, info: IBrushEntity) {
                super();

                this.map = map;
                this.info = info;
                this.model = map.viewer.bspModelLoader.load(info.modelUrl);
                this.model.addUsage(this);
            }

            isInCluster(cluster: number): boolean {
                const clusters = this.info.clusters;
                if (clusters == null) return false;
                for (let i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    if (clusters[i] === cluster) return true;
                }
                return false;
            }

            isInAnyCluster(clusters: number[]): boolean {
                if (clusters == null) return false;
                for (let i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    if (this.isInCluster(clusters[i])) return true;
                }
                return false;
            }

            populateDrawList(drawList: WebGame.DrawList, clusters: number[]): void {
                if (!this.isInAnyCluster(clusters)) return;
                drawList.addItem(this);
                this.onPopulateDrawList(drawList, clusters);
            }

            protected onPopulateDrawList(drawList: WebGame.DrawList, pvsClusters: number[]): void {
                const leaves = this.model.getLeaves();
                if (leaves != null) drawList.addItems(leaves);
            }
        }

        export class Worldspawn extends BrushEntity {
            private readonly clusterLeaves: {[cluster: number]: BspLeaf[]} = {};

            constructor(map: Map, info: IBrushEntity) {
                super(map, info);

                this.model.addOnLoadCallback(model => this.onModelLoad());
            }

            private onModelLoad(): void {
                const leaves = this.model.getLeaves();

                for (let i = 0, iEnd = leaves.length; i < iEnd; ++i) {
                    const leaf = leaves[i];
                    if (leaf.cluster === undefined) continue;

                    let clusterLeaves = this.clusterLeaves[leaf.cluster];
                    if (clusterLeaves == null) {
                        this.clusterLeaves[leaf.cluster] = clusterLeaves = [];
                    }

                    clusterLeaves.push(leaf);
                }

                this.map.viewer.forceDrawListInvalidation(true);
            }

            isInAnyCluster(clusters: number[]): boolean {
                return true;
            }

            isInCluster(cluster: number): boolean {
                return true;
            }

            /*
            protected onPopulateDrawList(drawList: Facepunch.WebGame.DrawList, clusters: number[]): void {
                if (clusters == null) return;
                for (let i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    const cluster = clusters[i];
                    const clusterLeaves = this.clusterLeaves[cluster];
                    if (clusterLeaves != null) drawList.addItems(clusterLeaves);
                }
            }
            */
        }
    }
}