namespace SourceUtils {
    export interface IProgramAttributes {
        position: number;
        normal: number;
    }

    export class DrawList {
        private map: Map;

        private items: DrawListItem[] = [];
        private handles: WorldMeshHandle[] = [];

        private lastGroup: WorldMeshGroup;
        private lastIndex: number;

        constructor(map: Map) {
            this.map = map;
        }

        clear(): void
        {
            for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                this.items[i].onRemoveFromDrawList(this);
            }

            this.items = [];
            this.handles = [];
        }

        addItem(item: DrawListItem): void {
            this.items.push(item);
            this.updateItem(item);
            item.onAddToDrawList(this);
        }

        updateItem(item: DrawListItem): void {
            this.handles = null;
        }

        private renderHandle(handle: WorldMeshHandle, attribs: IProgramAttributes): void {
            if (this.lastGroup !== handle.group) {
                this.lastGroup = handle.group;
                this.lastGroup.prepareForRendering(attribs);
            }

            this.lastGroup.renderElements(handle.drawMode, handle.offset, handle.count);
        }

        private buildHandleList(): void {
            this.handles = [];

            const loader = this.map.faceLoader;

            for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                const handles = this.items[i].getMeshHandles(loader);
                if (handles == null) continue;

                for (let j = 0, jEnd = handles.length; j < jEnd; ++j) {
                    if (handles[j].count === 0) continue;
                    this.handles.push(handles[j]);
                }
            }
        }

        render(attribs: IProgramAttributes): void {
            this.lastGroup = undefined;
            this.lastIndex = undefined;

            if (this.handles == null) this.buildHandleList();

            for (let i = 0, iEnd = this.handles.length; i < iEnd; ++i) {
                this.renderHandle(this.handles[i], attribs);
            }
        }

        debugPrint(): void {
            console.log(`DrawCalls: ${this.handles == null ? 0 : this.handles.length}`);
        }
    }
}