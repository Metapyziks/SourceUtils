/// <reference path="PvsEntity.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface IStaticProp extends IPvsEntity {
            model: number;
        }

        export class StaticProp extends PvsEntity {
            readonly model: StudioModel;

            constructor(map: Map, info: IStaticProp) {
                super(map, info);

                this.model = map.viewer.studioModelLoader.loadModel(info.model);
                this.model.addUsage(this);
                this.model.addOnLoadCallback(model => {
                    this.drawable.addMeshHandles(model.createMeshHandles(0, this.getMatrix()));
                });
            }
        }
    }
}