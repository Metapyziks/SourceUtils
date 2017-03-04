namespace SourceUtils {
    export class StudioModelLoader extends Loader<StudioModel> {
        private map: Map;

        constructor(map: Map) {
            super();
            this.map = map;
        }

        protected onCreateItem(url: string): StudioModel {
            return new StudioModel(this.map, url);
        }
    }
}
