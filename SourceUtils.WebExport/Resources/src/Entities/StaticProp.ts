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

            private readonly info: IStaticProp;

            private lighting: (number[][] | BspLeaf);
            private albedoModulation?: number;

            constructor(map: Map, info: IStaticProp) {
                super(map, info);

                this.info = info;
                this.albedoModulation = info.albedoModulation;

                if (this.info.vertLighting !== undefined) {
                    this.map.viewer.vertLightingLoader.load(this.info.vertLighting, value => {
                        this.lighting = value;
                        this.checkLoaded();
                    });
                } else {
                    // TODO: lighting offset
                    this.map.getLeafAt(this.info.origin, leaf => {
                        if (leaf == null) {
                            this.lighting = null;
                            this.checkLoaded();
                        } else {
                            leaf.getAmbientCube(null, null, success => {
                                this.lighting = leaf;
                                this.checkLoaded();
                            });
                        }
                    });
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