/// <reference path="PvsEntity.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface IStaticProp extends IPvsEntity {
            model: number;
            vertLighting?: number;
            albedoModulation?: number;
        }

        export class StaticProp extends PvsEntity {
            readonly model: StudioModel;
            private lighting: number[][];
            private albedoModulation?: number;

            constructor(map: Map, info: IStaticProp) {
                super(map, info);

                this.albedoModulation = info.albedoModulation;

                if (info.vertLighting !== undefined) {
                    map.viewer.vertLightingLoader.load(info.vertLighting, value => {
                        this.lighting = value;
                        this.checkLoaded();
                    });
                } else {
                    this.lighting = null;
                }

                this.model = map.viewer.studioModelLoader.loadModel(info.model);
                this.model.addUsage(this);
                this.model.addOnLoadCallback(model => {
                    this.checkLoaded();
                });
            }

            private checkLoaded(): void {
                if (!this.model.isLoaded()) return;
                if (this.lighting === undefined) return;

                this.drawable.addMeshHandles(this.model.createMeshHandles(0, this.getMatrix(), this.lighting, this.albedoModulation));
            }
        }
    }
}