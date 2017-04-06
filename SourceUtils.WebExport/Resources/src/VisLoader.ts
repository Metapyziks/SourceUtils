namespace SourceUtils {
    export interface IVisPage {
        values: number[][];
    }

    export class VisPage extends ResourcePage<IVisPage, number[]> {
        protected onGetValue(index: number): number[] {
            return this.page.values[index];
        }
    }

    export class VisLoader extends PagedLoader<VisPage, IVisPage, number[]> {
        protected onCreatePage(page: IPageInfo): VisPage {
            return new VisPage(page);
        }
    }
}