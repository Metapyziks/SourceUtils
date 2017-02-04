namespace SourceUtils {
    export interface IFaceLoadTarget {
        faceLoadPriority(): number;
        onLoadFaces(data: Api.BspFacesResponse): void;
    }

    class FaceLoaderTask {
        first: number;
        count: number;
        target: IFaceLoadTarget;

        constructor(first: number, count: number, target: IFaceLoadTarget) {
            this.first = first;
            this.count = count;
            this.target = target;
        }
    }

    export class FaceLoader {
        private map: Map;
        private queue: FaceLoaderTask[] = [];
        private active: FaceLoaderTask[] = [];

        maxConcurrentRequests = 4;

        constructor(map: Map) {
            this.map = map;
        }

        loadFaces(first: number, count: number, target: IFaceLoadTarget): void {
            this.queue.push(new FaceLoaderTask(first, count, target));
            this.update();
        }

        update(): void {
            while (this.queue.length > 0 && this.active.length < this.maxConcurrentRequests) {
                let bestScore = Number.POSITIVE_INFINITY;
                let bestIndex = -1;

                for (let i = 0; i < this.queue.length; ++i) {
                    const task = this.queue[i];
                    const score = task.target.faceLoadPriority();
                    if (bestIndex > -1 && score >= bestScore) continue;

                    bestScore = score;
                    bestIndex = i;
                }

                if (bestIndex === -1) return;

                const next = this.queue[bestIndex];
                this.queue.splice(bestIndex, 1);

                this.active.push(next);

                const url = this.map.info.facesUrl
                    .replace("{from}", next.first.toString())
                    .replace("{count}", next.count.toString());

                $.getJSON(url,
                    (data: Api.BspFacesResponse) => {
                        next.target.onLoadFaces(data);
                    }).fail(() => {
                    console.log(`Failed to load faces ${next.first}-${next.first + next.count}`);
                }).always(() => {
                    const index = this.active.indexOf(next);
                    this.active.splice(index, 1);
                    this.update();
                });
            }
        }
    }
}