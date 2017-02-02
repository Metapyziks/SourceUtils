/// <reference path="AppBase.ts"/>

namespace SourceUtils
{
    export class BspModel extends Entity
    {
        private map: Map;
        private info: Api.BspModelResponse;
        private index: number;

        constructor(map: Map, index: number) {
            super();

            this.map = map;
            this.index = index;

            this.loadInfo(this.map.info.modelUrl.replace("{index}", "0"));
        }

        private loadInfo(url: string) {
            
        }
    }

    export class Map extends Entity {
        info: Api.BspIndexResponse;

        private models: BspModel[];

        constructor(url: string) {
            super();

            this.loadInfo(url);
        }

        private loadInfo(url: string): void {
            $.getJSON(url, (data: Api.BspIndexResponse) => {
                this.info = data;
                this.models = new Array<BspModel>(data.numModels);
                this.add(this.models[0] = new BspModel(this, 0));
            });
        }
    }
}