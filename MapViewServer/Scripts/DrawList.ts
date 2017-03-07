namespace SourceUtils {
    export class DrawList implements IStateLoggable {
        private map: Map;

        private items: DrawListItem[] = [];
        private handles: WorldMeshHandle[] = [];
        private merged: WorldMeshHandle[] = [];

        private lastParent: Entity;
        private lastGroup: WorldMeshGroup;
        private lastProgram: ShaderProgram;
        private lastMaterialIndex: number;
        private lastMaterial: Material;
        private lastIndex: number;
        private canRender: boolean;

        constructor(map: Map) {
            this.map = map;
        }

        clear(): void {
            for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                this.items[i].onRemoveFromDrawList(this);
            }

            this.items = [];
            this.handles = [];
            this.merged = [];
        }

        getDrawCalls(): number {
            return this.merged == null ? 0 : this.merged.length;
        }

        addItem(item: DrawListItem): void {
            this.items.push(item);
            this.updateItem(item);
            item.onAddToDrawList(this);
        }

        private isBuildingList: boolean = false;

        invalidate(): void {
            if (this.isBuildingList) return;
            this.handles = null;
        }

        updateItem(item: DrawListItem): void {
            this.invalidate();
        }

        private renderHandle(handle: WorldMeshHandle, context: RenderContext): void {
            let changedMaterial = false;
            let changedProgram = false;
            let changedTransform = false;

            if (this.lastParent !== handle.parent) {
                this.lastParent = handle.parent;
                context.setModelTransform(this.lastParent);
                changedTransform = true;
            }

            if (handle.materialIndex !== undefined && this.lastMaterialIndex !== handle.materialIndex) {
                changedMaterial = true;
                this.lastMaterialIndex = handle.materialIndex;
                this.lastMaterial = this.map.getMaterial(handle.materialIndex);
            } else if (handle.materialIndex === undefined && this.lastMaterial !== handle.material) {
                changedMaterial = true;
                this.lastMaterialIndex = undefined;
                this.lastMaterial = handle.material;
            }

            if (changedMaterial) {
                if (this.lastMaterial == null) {
                    this.canRender = false;
                    return;
                }

                if (this.lastProgram !== this.lastMaterial.getProgram()) {
                    if (this.lastProgram != null) this.lastProgram.cleanupPostRender(this.map, context);

                    this.lastProgram = this.lastMaterial.getProgram();
                    this.lastProgram.prepareForRendering(this.map, context);
                    changedProgram = true;
                    changedTransform = true;
                }

                this.canRender = this.lastProgram.isCompiled() && this.lastMaterial.prepareForRendering();
            }

            if (!this.canRender) return;

            if (changedTransform) {
                this.lastProgram.changeModelTransform(context);
            }

            if (this.lastGroup !== handle.group || changedProgram) {
                this.lastGroup = handle.group;
                this.lastGroup.prepareForRendering(this.lastProgram);
            }

            this.lastGroup.renderElements(handle.drawMode, handle.offset, handle.count);
        }

        private static compareHandles(a: WorldMeshHandle, b: WorldMeshHandle): number {
            return a.compareTo(b);
        }

        private buildHandleList(): void {
            this.handles = [];
            this.isBuildingList = true;

            for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                const handles = this.items[i].getMeshHandles();
                if (handles == null) continue;

                for (let j = 0, jEnd = handles.length; j < jEnd; ++j) {
                    const handle = handles[j];
                    if (handle.count === 0) continue;
                    if (handle.material == null) {
                        if ((handle.material = this.map.getMaterial(handle.materialIndex)) == null) continue;
                    }

                    this.handles.push(handle);
                }
            }

            this.isBuildingList = false;

            this.handles.sort(DrawList.compareHandles);

            this.merged = [];

            let last: WorldMeshHandle = null;

            for (let i = 0, iEnd = this.handles.length; i < iEnd; ++i) {
                const next = this.handles[i];

                if (last != null && last.canMerge(next)) {
                    last.merge(next);
                    continue;
                }

                last = new WorldMeshHandle();
                this.merged.push(last);

                last.parent = next.parent;
                last.group = next.group;
                last.drawMode = next.drawMode;
                last.material = next.material;
                last.materialIndex = next.materialIndex;
                last.offset = next.offset;
                last.count = next.count;
            }

            (this.map.getApp() as MapViewer).invalidateDebugPanel();
        }

        render(context: RenderContext): void {
            this.lastParent = undefined;
            this.lastGroup = undefined;
            this.lastProgram = undefined;
            this.lastMaterial = undefined;
            this.lastMaterialIndex = undefined;
            this.lastIndex = undefined;

            if (this.handles == null) this.buildHandleList();

            for (let i = 0, iEnd = this.merged.length; i < iEnd; ++i) {
                this.renderHandle(this.merged[i], context);
            }

            if (this.lastProgram != null) this.lastProgram.cleanupPostRender(this.map, context);
        }

        logState(writer: FormattedWriter): void {
            writer.writeProperty("itemCount", this.items.length);
            writer.writeProperty("handleCount", this.handles.length);
            writer.writeProperty("mergedCount", this.merged.length);
        }
    }
}