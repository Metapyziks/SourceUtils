﻿namespace SourceUtils {
    export class DrawList {
        private map: Map;

        private items: DrawListItem[] = [];
        private handles: WorldMeshHandle[] = [];
        private merged: WorldMeshHandle[] = [];

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
        }

        getDrawCalls(): number {
            return this.items.length;
        }

        addItem(item: DrawListItem): void {
            this.items.push(item);
            this.updateItem(item);
            item.onAddToDrawList(this);
        }

        updateItem(item: DrawListItem): void {
            this.handles = null;
        }

        private renderHandle(handle: WorldMeshHandle, camera: THREE.Camera): void {
            let changedProgram = false;

            if (this.lastMaterialIndex !== handle.material) {
                this.lastMaterialIndex = handle.material;
                this.lastMaterial = this.map.getMaterial(handle.material);

                if (this.lastMaterial == null) {
                    this.canRender = false;
                    return;
                }

                if (this.lastProgram !== this.lastMaterial.getProgram()) {
                    this.lastProgram = this.lastMaterial.getProgram();
                    this.lastProgram.prepareForRendering(this.map, camera);
                    changedProgram = true;
                }

                this.canRender = this.lastProgram.isCompiled() && this.lastMaterial.prepareForRendering();
            }

            if (!this.canRender) return;

            if (this.lastGroup !== handle.group || changedProgram) {
                this.lastGroup = handle.group;
                this.lastGroup.prepareForRendering(this.lastMaterial.getProgram());
            }

            this.lastGroup.renderElements(handle.drawMode, handle.offset, handle.count);
        }

        private static compareHandles(a: WorldMeshHandle, b: WorldMeshHandle): number {
            const idComp = a.group.getId() - b.group.getId();
            if (idComp !== 0) return idComp;
            const matComp = a.material - b.material;
            return matComp !== 0 ? matComp : a.offset - b.offset;
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

                last.group = next.group;
                last.drawMode = next.drawMode;
                last.material = next.material;
                last.offset = next.offset;
                last.count = next.count;
            }

            if ((this.map.getApp() as MapViewer).logDrawCalls) console.log(`Draw calls: ${this.merged.length}`);
        }

        render(camera: THREE.Camera): void {
            this.lastGroup = undefined;
            this.lastProgram = undefined;
            this.lastMaterial = undefined;
            this.lastMaterialIndex = undefined;
            this.lastIndex = undefined;

            if (this.handles == null) this.buildHandleList();

            for (let i = 0, iEnd = this.merged.length; i < iEnd; ++i) {
                this.renderHandle(this.merged[i], camera);
            }
        }
    }
}