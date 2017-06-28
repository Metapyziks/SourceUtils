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

                this.drawable.isStatic = false;

                this.model = map.viewer.studioModelLoader.loadModel(info.model);
                this.model.addUsage(this);
                this.model.addOnLoadCallback(model => {
                    const handles: WebGame.MeshHandle[] = [];
                    model.getMeshHandles(0, handles);
                    this.drawable.addMeshHandles(handles);
                });
            }
        }
    }
}