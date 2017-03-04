namespace SourceUtils {
    export interface IFaceLoadTarget {
        faceLoadPriority(map: Map): number;
        onLoadFaces(handles: WorldMeshHandle[]): void;
        getApiQueryToken(): string;
    }

    export class MeshData {
        components: Api.MeshComponent;
        elements: Api.IElement[];
        vertices: Float32Array;
        indices: Uint16Array;

        constructor(faces: Api.IFaces);
        constructor(vertData: Api.IVertexContainer, indexData: Api.IIndicesContainer);
        constructor(facesOrVertData: Api.IFaces | Api.IVertexContainer, indexData?: Api.IIndicesContainer) {
            const vertData = facesOrVertData as Api.IVertexContainer;

            if (indexData == null) {
                indexData = facesOrVertData as Api.IFaces;
            }

            this.components = vertData.components;
            this.elements = indexData.elements;
            this.vertices = Utils.decompressFloat32Array(vertData.vertices);
            this.indices = Utils.decompressUint16Array(indexData.indices);
        }
    }

    export class FaceLoader implements ILoader {
        private map: Map;
        private queue: IFaceLoadTarget[] = [];
        private active: IFaceLoadTarget[][] = [];

        maxConcurrentRequests = 4;
        maxLeavesPerRequest = 512;

        constructor(map: Map) {
            this.map = map;
        }

        loadFaces(target: IFaceLoadTarget): void {
            this.queue.push(target);
            this.update();
        }

        private getNextTask(): IFaceLoadTarget {
            let bestScore = Number.POSITIVE_INFINITY;
            let bestIndex = -1;

            for (let i = 0; i < this.queue.length; ++i)
            {
                const task = this.queue[i];
                const score = task.faceLoadPriority(this.map);
                if (bestIndex > -1 && score >= bestScore) continue;

                bestScore = score;
                bestIndex = i;
            }

            if (bestIndex === -1) return null;

            const result = this.queue[bestIndex];
            this.queue.splice(bestIndex, 1);

            return result;
        }

        update(): void {
            if (this.queue.length <= 0 || this.active.length >= this.maxConcurrentRequests) return;

            let query = "";

            const tasks: IFaceLoadTarget[] = [];

            while (tasks.length < this.maxLeavesPerRequest && this.queue.length > 0 && query.length < 1536) {
                const next = this.getNextTask();
                if (next == null) break;
                if (query.length > 0) query += "+";
                query += next.getApiQueryToken();
                tasks.push(next);
            }

            if (tasks.length === 0) return;

            this.active.push(tasks);

            const url = this.map.info.facesUrl
                .replace("{tokens}", query);

            $.getJSON(url, (data: Api.IBspFacesResponse) => {
                for (let i = 0; i < data.facesList.length; ++i) {
                    const faces = data.facesList[i];
                    const task = tasks[i];
                    const handles = this.map.meshManager.addMeshData(new MeshData(faces));
                    task.onLoadFaces(handles);
                }
            }).fail(() => {
                const rangesStr = query.replace("+", ", ");
                console.log(`Failed to load leaf faces [${rangesStr}].`);
            }).always(() => {
                const index = this.active.indexOf(tasks);
                this.active.splice(index, 1);
                this.update();
            });
        }
    }
}