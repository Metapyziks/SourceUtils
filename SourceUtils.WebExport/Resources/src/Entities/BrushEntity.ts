/// <reference path="PvsEntity.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface IBrushEntity extends IPvsEntity {
            model: number;
        }

        export class BrushEntity extends PvsEntity {
            readonly model: BspModel;

            constructor(map: Map, info: IBrushEntity) {
                super(map, info);

                this.model = map.viewer.bspModelLoader.loadModel(info.model);
                this.model.addUsage(this);
                this.model.addOnLoadCallback(model => {
                    const leaves = model.getLeaves();
                    for (let i = 0, iEnd = leaves.length; i < iEnd; ++i) {
                        leaves[i].entity = this;
                    }
                });
            }

            protected onPopulateDrawList(drawList: WebGame.DrawList, clusters: number[]): void {
                const leaves = this.model.getLeaves();
                if (leaves != null) drawList.addItems(leaves);
            }
        }
    }
}