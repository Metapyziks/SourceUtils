namespace SourceUtils {
    export class PropStatic extends Entity {
        private drawListItem: StudioModelDrawListItem;

        clusters: number[] = [];

        constructor(map: Map, url: string) {
            super();
            this.drawListItem = new StudioModelDrawListItem(map, url);
            this.drawListItem.parent = this;
        }

        getDrawListItem(): DrawListItem {
            return this.drawListItem;
        }
    }
}
