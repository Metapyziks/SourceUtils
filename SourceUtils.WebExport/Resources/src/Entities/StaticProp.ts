/// <reference path="PvsEntity.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface IStaticProp extends IPvsEntity {
            model: number;
        }

        export class StaticProp extends PvsEntity {
            readonly model: StudioModel;
            readonly drawListItem: Facepunch.WebGame.IDrawListItem;

            constructor(map: Map, info: IStaticProp) {
                super(map, info);

                this.model = map.viewer.studioModelLoader.loadModel(info.model);
                this.model.addUsage(this);
                this.model.addOnLoadCallback(model => {
                    // TODO: Duplicate handles, attach vertex lighting, set entity
                });
            }

            protected onPopulateDrawList(drawList: WebGame.DrawList, clusters: number[]): void {
                if (this.drawListItem != null) drawList.addItem(this.drawListItem);
            }
        }
    }
}