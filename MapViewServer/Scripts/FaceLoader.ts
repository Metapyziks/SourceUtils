namespace SourceUtils {
    export interface IFaceLoadTarget {
        faceLoadPriority(): number;
        onLoadFaces(data: Api.Faces): void;
    }

    class FaceLoaderTask {
        leafIndex: number;
        target: IFaceLoadTarget;

        constructor(leafIndex: number, target: IFaceLoadTarget) {
            this.leafIndex = leafIndex;
            this.target = target;
        }
    }

    export class FaceLoader {
        private map: Map;
        private queue: FaceLoaderTask[] = [];
        private active: FaceLoaderTask[][] = [];

        maxConcurrentRequests = 2;
        maxLeavesPerRequest = 512;

        constructor(map: Map) {
            this.map = map;
        }

        loadFaces(leafIndex: number, target: IFaceLoadTarget): void {
            this.queue.push(new FaceLoaderTask(leafIndex, target));
            this.update();
        }

        private getNextTask(): FaceLoaderTask {
            let bestScore = Number.POSITIVE_INFINITY;
            let bestIndex = -1;

            for (let i = 0; i < this.queue.length; ++i)
            {
                const task = this.queue[i];
                const score = task.target.faceLoadPriority();
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

            const tasks: FaceLoaderTask[] = [];

            while (tasks.length < this.maxLeavesPerRequest && this.queue.length > 0 && query.length < 1536) {
                const next = this.getNextTask();
                if (next == null) break;
                if (query.length > 0) query += "+";
                query += next.leafIndex.toString();
                tasks.push(next);
            }

            if (tasks.length === 0) return;

            this.active.push(tasks);

            const url = this.map.info.leafFacesUrl
                .replace("{leaves}", query);

            $.getJSON(url, (data: Api.BspFacesResponse) => {
                for (let i = 0; i < data.leaves.length; ++i) {
                    const leafFaces = data.leaves[i];
                    for (let j = 0; j < tasks.length; ++j) {
                        const task = tasks[j];
                        if (task.leafIndex === leafFaces.index) {
                            task.target.onLoadFaces(leafFaces);
                            tasks.splice(j, 1);
                            break;
                        }
                    }
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