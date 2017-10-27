namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface IWorldspawn extends IBrushEntity {
            skyMaterial: WebGame.IMaterialInfo;
        }

        export class Worldspawn extends BrushEntity {
            private readonly clusterLeaves: {[cluster: number]: BspLeaf[]} = {};

            constructor(map: Map, info: IWorldspawn) {
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

            protected onPopulateDrawList(drawList: Facepunch.WebGame.DrawList, clusters: number[]): void {
                if (clusters == null) {
                    const leaves = this.model.getLeaves();
                    if (leaves != null) drawList.addItems(leaves);
                    return;
                }

                for (let i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    const cluster = clusters[i];
                    const clusterLeaves = this.clusterLeaves[cluster];
                    if (clusterLeaves != null) drawList.addItems(clusterLeaves);
                }
            }
        }
    }
}