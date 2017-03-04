namespace SourceUtils {
    export class PropStatic extends Entity {
        private drawListItem: StudioModelDrawListItem;

        constructor(map: Map, url: string) {
            super();
            this.drawListItem = new StudioModelDrawListItem(map, url);
        }

        getDrawListItem(): DrawListItem {
            return this.drawListItem;
        }
    }
}
