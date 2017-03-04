namespace SourceUtils {
    export class SmdModel {
        private info: Api.ISmdModel;

        private mdl: StudioModel;

        private vertices: Api.IVvdResponse;
        private indices: Api.IVtxResponse;

        private handles: WorldMeshHandle[];

        constructor(mdl: StudioModel, info: Api.ISmdModel) {
            this.mdl = mdl;
            this.info = info;
        }

        loadNext(callback: (requeue: boolean) => void): void {
            if (this.vertices == null) {
                this.loadVertices(callback);
            } else if (this.indices == null) {
                this.loadIndices(callback);
            } else {
                callback(false);
            }
        }

        private loadVertices(callback: (requeue: boolean) => void): void {
            $.getJSON(this.info.verticesUrl, (data: Api.IVvdResponse) => {
                this.vertices = data;
                callback(true);
            }).fail(() => callback(false));
        }

        private loadIndices(callback: (requeue: boolean) => void): void {
            $.getJSON(this.info.verticesUrl, (data: Api.IVtxResponse) => {
                this.indices = data;
                this.handles = this.mdl.getMap().meshManager.addMeshData(new MeshData(this.vertices, this.indices));
                this.vertices = null;
                this.indices = null;
            }).always(() => callback(false));
        }
    }

    export class SmdBodyPart {
        name: string;
        models: SmdModel[];

        constructor(mdl: StudioModel, info: Api.ISmdBodyPart) {
            this.name = info.name;
            this.models = [];

            for (let i = 0; i < info.models.length; ++i) {
                this.models.push(new SmdModel(mdl, info.models[i]));
            }
        }
    }

    export class StudioModel implements ILoadable<StudioModel> {
        private map: Map;
        private mdlUrl: string;
        private info: Api.IMdlResponse;
        private materials: Material[];
        private bodyParts: SmdBodyPart[];
        private toLoad: SmdModel[];

        constructor(map: Map, url: string) {
            this.map = map;
            this.mdlUrl = url;
        }

        getMap(): Map { return this.map; }

        shouldLoadBefore(other: StudioModel): boolean {
            return true;
        }

        loadNext(callback: (requeue: boolean) => void): void {
            if (this.info == null) {
                this.loadInfo(callback);
                return;
            }

            if (this.toLoad.length === 0) {
                callback(false);
                return;
            }

            const next = this.toLoad[0];
            next.loadNext(requeue2 => {
                if (!requeue2) {
                    this.toLoad.splice(0, 1);
                }
                callback(this.toLoad.length > 0);
            });
        }

        private loadInfo(callback: (success: boolean) => void): void {
            $.getJSON(this.mdlUrl, (data: Api.IMdlResponse) => {
                this.info = data;
                this.materials = [];
                this.bodyParts = [];
                this.toLoad = [];

                for (let i = 0; i < data.materials.length; ++i) {
                    this.materials.push(new Material(this.map, data.materials[i]));
                }

                for (let i = 0; i < data.bodyParts.length; ++i) {
                    const bodyPart = new SmdBodyPart(this, data.bodyParts[i]);
                    this.bodyParts.push(bodyPart);

                    for (let j = 0; j < bodyPart.models.length; ++j) {
                        this.toLoad.push(bodyPart.models[j]);
                    }
                }

                callback(true);
            }).fail(() => callback(false));
        }
    }
}