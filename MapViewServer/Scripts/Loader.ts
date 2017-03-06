namespace SourceUtils {
    export interface ILoadable<TLoadable> {
        shouldLoadBefore(other: TLoadable): boolean;
        loadNext(callback: (requeue: boolean) => void): void;
    }

    export interface ILoader {
        update(requestQuota: number): number;
    }

    export abstract class Loader<TLoadable extends ILoadable<TLoadable>> implements ILoader {
        private queue: TLoadable[] = [];
        private loaded: { [url: string]: TLoadable } = {};
        private active = 0;

        load(url: string): TLoadable {
            let loaded = this.loaded[url];
            if (loaded != null) return loaded;

            loaded = this.onCreateItem(url);
            this.loaded[url] = loaded;

            this.enqueueItem(loaded);
            return loaded;
        }

        protected enqueueItem(item: TLoadable): void {
            this.queue.push(item);
        }

        protected abstract onCreateItem(url: string): TLoadable;

        private getNextToLoad(): TLoadable {
            if (this.queue.length <= 0) return null;

            let bestIndex = 0;
            let bestItem = this.queue[0];

            for (var i = 1, iEnd = this.queue.length; i < iEnd; ++i) {
                const item = this.queue[i];
                if (!item.shouldLoadBefore(bestItem)) continue;

                bestIndex = i;
                bestItem = item;
            }

            return this.queue.splice(bestIndex, 1)[0];
        }

        update(requestQuota: number): number {
            let next: TLoadable;
            while (this.active < requestQuota && (next = this.getNextToLoad()) != null) {
                ++this.active;

                const nextCopy = next;
                next.loadNext(requeue => {
                    --this.active;
                    if (requeue) this.queue.push(nextCopy);
                });
            }

            return this.active;
        }
    }
}