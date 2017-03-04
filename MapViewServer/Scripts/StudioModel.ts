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

        getMeshHandles(): WorldMeshHandle[] {
            return this.handles;
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
            $.getJSON(this.info.trianglesUrl, (data: Api.IVtxResponse) => {
                this.indices = data;
                this.acquireMeshHandles();
            }).always(() => callback(false));
        }

        private acquireMeshHandles(): void {
            const meshData = new MeshData(this.vertices, this.indices);

            for (let i = 0; i < this.info.meshes.length && i < meshData.elements.length; ++i) {
                const mesh = this.info.meshes[i];
                const offset = mesh.vertexOffset;
                const element = meshData.elements[i];
                element.material = mesh.material;

                if (offset === 0) continue;

                for (let j = element.offset, jEnd = element.offset + element.count; j < jEnd; ++j) {
                    meshData.indices[j] += offset;
                }
            }

            this.handles = this.mdl.getMap().meshManager.addMeshData(meshData);

            for (let i = 0; i < this.handles.length; ++i) {
                this.handles[i].material = this.mdl.getMaterial(this.handles[i].materialIndex);
            }

            this.vertices = null;
            this.indices = null;
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
        private loaded: SmdModel[] = [];
        private meshLoadCallbacks: ((model: SmdModel) => void)[] = [];

        constructor(map: Map, url: string) {
            this.map = map;
            this.mdlUrl = url;
        }

        getMap(): Map { return this.map; }

        getMaterial(index: number): Material {
            return this.materials[index];
        }

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

                    if (next.getMeshHandles() != null) {
                        this.loaded.push(next);
                        this.dispatchMeshLoadEvent(next);
                    }
                }
                callback(this.toLoad.length > 0);
            });
        }

        private dispatchMeshLoadEvent(model: SmdModel): void {
            for (let i = 0; i < this.meshLoadCallbacks.length; ++i) {
                this.meshLoadCallbacks[i](model);
            }
        }

        addMeshLoadCallback(callback: (model: SmdModel) => void): void {
            for (let i = 0; i < this.loaded.length; ++i) {
                callback(this.loaded[i]);
            }

            this.meshLoadCallbacks.push(callback);
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