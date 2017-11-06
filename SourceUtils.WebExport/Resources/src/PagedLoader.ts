namespace SourceUtils {
    export interface IPageRequest<TValue, TPage> {
        index: number;
        callback: (payload: TValue, page: TPage) => void;
    }

    export abstract class ResourcePage<TPayload, TValue> {
        readonly first: number;
        readonly count: number;
        readonly url: string;

        private readonly values: TValue[];

        private toLoad: IPageRequest<TValue, ResourcePage<TPayload, TValue>>[] = [];

        protected page: TPayload;

        constructor(info: IPageInfo) {
            this.first = info.first;
            this.count = info.count;
            this.url = info.url;
            this.values = new Array<TValue>(info.count);
        }

        getLoadPriority(): number {
            return this.toLoad.length;
        }

        getValue(index: number): TValue {
            index -= this.first;
            let value = this.values[index];
            if (value === undefined) {
                this.values[index] = value = this.onGetValue(index);
            }

            return value;
        }

        protected abstract onGetValue(index: number): TValue;

        load(index: number, callback: (payload: TValue, page: ResourcePage<TPayload, TValue>) => void): TValue {
            if (this.page != null) {
                const value = this.getValue(index);
                callback(value, this);
                return value;
            }

            this.toLoad.push({ index: index, callback: callback });
        }

        onLoadValues(page: TPayload): void {
            this.page = page;

            for (let i = 0, iEnd = this.toLoad.length; i < iEnd; ++i) {
                const request = this.toLoad[i];
                request.callback(this.getValue(request.index), this);
            }

            this.toLoad = null;
        }
    }

    export abstract class PagedLoader<TPayload, TValue, TPage extends ResourcePage<TPayload, TValue>> implements Facepunch.ILoader {

        private pages: TPage[];

        private readonly toLoad: TPage[] = [];

        private active = 0;
        private loadProgress = 0;

        protected abstract onCreatePage(page: IPageInfo): TPage;

        throwIfNotFound = true;

        getLoadProgress(): number {
            return this.pages == null ? 0 : this.loadProgress / this.pages.length;
        }

        load(index: number, callback: (payload: TValue, page: TPage) => void): TValue {
            if (this.pages == null) {
                throw new Error("Page layout not loaded.");
            }

            for (let i = 0, iEnd = this.pages.length; i < iEnd; ++i) {
                const page = this.pages[i];
                if (index >= page.first && index < page.first + page.count) {
                    return page.load(index, callback);
                }
            }

            if (this.throwIfNotFound) {
                throw new Error(`Unable to find page for index ${index}.`);
            }
        }

        setPageLayout(pages: IPageInfo[]): void {
            if (this.pages != null) {
                throw new Error("Changing page layout not implemented.");
            }

            this.pages = new Array<TPage>(pages.length);

            for (let i = 0, iEnd = pages.length; i < iEnd; ++i) {
                this.pages[i] = this.onCreatePage(pages[i]);
                this.toLoad.push(this.pages[i]);
            }
        }

        private getNextToLoad(): TPage {
            let bestScore = 0;
            let bestIndex = -1;

            for (let i = 0; i < this.toLoad.length; ++i) {
                const page = this.toLoad[i];
                const score = page.getLoadPriority();
                if (score > bestScore) {
                    bestIndex = i;
                    bestScore = score;
                }
            }

            if (bestIndex === -1) return null;

            return this.toLoad.splice(bestIndex, 1)[0];
        }

        update(requestQuota: number): number {
            while (this.active < requestQuota) {
                const next = this.getNextToLoad();
                if (next == null) break;

                let lastProgress = 0;

                ++this.active;
                Facepunch.Http.getJson<TPayload>(next.url, page => {
                    --this.active;
                    this.loadProgress += 1 - lastProgress;
                    lastProgress = 1;
                    next.onLoadValues(page);
                }, error => {
                    --this.active;
                    console.warn(error);
                }, (loaded, total) => {
                    if (total !== undefined) {
                        const progress = loaded / total;
                        this.loadProgress += (progress - lastProgress);
                        lastProgress = progress;
                    }
                });
            }

            return this.active;
        }
    }
}