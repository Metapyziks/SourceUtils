namespace SourceUtils {
    export class SmdModel {
        private info: Api.ISmdModel;

        private mdl: StudioModel;

        private vertices: Api.IVvdResponse;
        private indices: Api.IVtxResponse;

        constructor(mdl: StudioModel, info: Api.ISmdModel) {
            this.mdl = mdl;
            this.info = info;
        }

        hasLoaded(): boolean {
            return this.indices != null && this.vertices != null;
        }

        private updateIndexOffsets(): void {
            for (let i = 0; i < this.info.meshes.length && i < this.indices.elements.length; ++i) {
                const mesh = this.info.meshes[i];
                const element = this.indices.elements[i];
                const offset = mesh.vertexOffset;
                element.material = mesh.material;

                if (offset === 0) continue;

                const indices = this.indices.indices as number[];

                for (let j = element.offset, jEnd = element.offset + element.count; j < jEnd; ++j) {
                    indices[j] += offset;
                }
            }
        }

        createMeshHandles(vertexColors?: HardwareVerts): WorldMeshHandle[] {
            const meshData = new MeshData(this.vertices, this.indices);

            for (let i = 0; i < this.info.meshes.length && i < meshData.elements.length; ++i) {
                const mesh = this.info.meshes[i];
                const offset = mesh.vertexOffset;

                if (vertexColors != null) {
                    const meshColors = Utils.decompress(vertexColors.getSamples(i));
                    if (meshColors != null) {
                        // TODO: make generic
                        const itemSize = 8;
                        const itemOffset = 5 + offset * itemSize;
                        const verts = meshData.vertices;

                        for (let j = 0, jEnd = meshColors.length / 3; j < jEnd; ++j) {
                            verts[j * itemSize + itemOffset + 0] = meshColors[j * 3 + 0];
                            verts[j * itemSize + itemOffset + 1] = meshColors[j * 3 + 1];
                            verts[j * itemSize + itemOffset + 2] = meshColors[j * 3 + 2];
                        }
                    }
                }

            }

            const handles = this.mdl.getMap().meshManager.addMeshData(meshData);

            for (let i = 0; i < handles.length; ++i) {
                handles[i].material = this.mdl.getMaterial(handles[i].materialIndex);
            }

            return handles;
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
                this.vertices.vertices = Utils.decompress(this.vertices.vertices);
                callback(true);
            }).fail(() => callback(false));
        }

        private loadIndices(callback: (requeue: boolean) => void): void {
            $.getJSON(this.info.trianglesUrl, (data: Api.IVtxResponse) => {
                this.indices = data;
                this.indices.indices = Utils.decompress(this.indices.indices);
                this.updateIndexOffsets();
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
        private loaded: SmdModel[] = [];
        private modelLoadCallbacks: ((model: SmdModel) => void)[] = [];

        constructor(map: Map, url: string) {
            this.map = map;
            this.mdlUrl = url;
        }

        getMap(): Map { return this.map; }

        hasLoadedModel(bodyPart: number, model: number): boolean {
            if (this.bodyParts == null) return false;
            return this.bodyParts[bodyPart].models[model].hasLoaded();
        }

        getModel(bodyPart: number, model: number): SmdModel {
            return this.bodyParts == null ? null : this.bodyParts[bodyPart].models[model];
        }

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

                    if (next.hasLoaded() != null) {
                        this.loaded.push(next);
                        this.dispatchModelLoadEvent(next);
                    }
                }
                callback(this.toLoad.length > 0);
            });
        }

        private dispatchModelLoadEvent(model: SmdModel): void {
            for (let i = 0; i < this.modelLoadCallbacks.length; ++i) {
                this.modelLoadCallbacks[i](model);
            }
        }

        addModelLoadCallback(callback: (model: SmdModel) => void): void {
            for (let i = 0; i < this.loaded.length; ++i) {
                callback(this.loaded[i]);
            }

            this.modelLoadCallbacks.push(callback);
        }

        private loadInfo(callback: (success: boolean) => void): void {
            $.getJSON(this.mdlUrl, (data: Api.IMdlResponse) => {
                this.info = data;
                this.materials = [];
                this.bodyParts = [];
                this.toLoad = [];

                for (let i = 0; i < data.materials.length; ++i) {
                    this.materials.push(data.materials[i] == null ? null : new Material(this.map, data.materials[i]));
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