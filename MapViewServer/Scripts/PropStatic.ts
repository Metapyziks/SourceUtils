namespace SourceUtils {
    export class PropStatic extends Entity
    {
        private info: Api.IStaticProp;
        private drawListItem: StudioModelDrawListItem;

        clusters: number[] = [];

        constructor(map: Map, info: Api.IStaticProp) {
            super();

            this.setPosition(info.origin);
            this.setAngles(info.angles);

            this.info = info;
            if ((info.flags & Api.StaticPropFlags.NoDraw) !== 0 || typeof info.model !== "string") return;

            this.clusters = info.clusters;

            this.drawListItem = new StudioModelDrawListItem(map, info.model as string);
            this.drawListItem.parent = this;
        }

        getDrawListItem(): DrawListItem {
            return this.drawListItem;
        }
    }
}
