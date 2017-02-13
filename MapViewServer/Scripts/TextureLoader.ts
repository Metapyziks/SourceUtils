
namespace SourceUtils {
    export class TextureLoader {
        maxConcurrentRequests = 2;

        private context: WebGLRenderingContext;

        private queue: ValveTexture[] = [];
        private active = 0;

        constructor(gl: WebGLRenderingContext) {
            this.context = gl;
        }

        load(url: string): ValveTexture {
            const vtf = new ValveTexture(this.context, url);
            this.queue.push(vtf);
            this.update();
            return vtf;
        }

        getNextToLoad(): ValveTexture {
            if (this.queue.length <= 0 || this.active >= this.maxConcurrentRequests) return null;

            let bestIndex = -1;
            let bestScore = 0;
            let bestMip = Number.MAX_VALUE;

            for (var i = 0, iEnd = this.queue.length; i < iEnd; ++i) {
                const item = this.queue[i];
                const mipLevel = item.getLowestMipLevel();
                if (mipLevel > bestMip) continue;

                const score = item.getUsesSinceLastLoad();
                if (score > bestScore || mipLevel > bestMip) {
                    bestIndex = i;
                    bestScore = score;
                    bestMip = mipLevel;
                }
            }

            if (bestIndex === -1) return null;

            return this.queue.splice(bestIndex, 1)[0];
        }

        update(): void {
            let next: ValveTexture;
            while ((next = this.getNextToLoad()) != null) {
                ++this.active;

                const nextCopy = next;
                next.loadNext(requeue => {
                    --this.active;
                    if (requeue) this.queue.push(nextCopy);
                    this.update();
                });
            }
        }
    }
}
