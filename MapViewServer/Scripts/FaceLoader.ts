namespace SourceUtils {
    export interface IFaceLoadTarget {
        faceLoadPriority(): number;
        onLoadFaces(data: Api.FacesRange): void;
    }

    class FaceLoaderTask {
        from: number;
        count: number;
        target: IFaceLoadTarget;

        constructor(from: number, count: number, target: IFaceLoadTarget) {
            this.from = from;
            this.count = count;
            this.target = target;
        }

        toString(): string {
            return this.count === 1 ? this.from.toString() : `${this.from}.${this.count}`;
        }
    }

    export class FaceLoader {
        private map: Map;
        private queue: FaceLoaderTask[] = [];
        private active: FaceLoaderTask[][] = [];

        maxConcurrentRequests = 2;
        idealFacesPerRequest = 512;

        constructor(map: Map) {
            this.map = map;
        }

        loadFaces(first: number, count: number, target: IFaceLoadTarget): void {
            this.queue.push(new FaceLoaderTask(first, count, target));
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

            let ranges = "";
            let totalFaces = 0;

            let tasks: FaceLoaderTask[] = [];

            while (totalFaces < this.idealFacesPerRequest && this.queue.length > 0 && ranges.length < 1536) {
                let next = this.getNextTask();
                if (next == null) break;
                if (ranges.length > 0) ranges += "+";
                ranges += next.toString();
                totalFaces += next.count;
                tasks.push(next);
            }

            if (tasks.length === 0) return;

            this.active.push(tasks);

            const url = this.map.info.facesUrl
                .replace("{ranges}", ranges);

            $.getJSON(url, (data: Api.BspFacesResponse) => {
                for (let i = 0; i < data.ranges.length; ++i) {
                    const range = data.ranges[i];
                    for (let j = 0; j < tasks.length; ++j) {
                        const task = tasks[j];
                        if (task.from === range.from && task.count === range.count) {
                            task.target.onLoadFaces(range);
                            tasks.splice(j, 1);
                            break;
                        }
                    }
                }
            }).fail(() => {
                const rangesStr = ranges.replace("+", ", ");
                console.log(`Failed to load faces [${rangesStr}].`);
            }).always(() => {
                const index = this.active.indexOf(tasks);
                this.active.splice(index, 1);
                this.update();
            });
        }
    }
}