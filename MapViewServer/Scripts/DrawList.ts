namespace SourceUtils {
    export class DrawList implements IStateLoggable
    {
        private context: RenderContext;
        private map: Map;

        private items: DrawListItem[] = [];
        private handles: WorldMeshHandle[] = [];
        private merged: WorldMeshHandle[] = [];

        private lastParent: Entity;
        private lastGroup: WorldMeshGroup;
        private lastVertexOffset: number;
        private lastProgram: ShaderProgram;
        private lastMaterialIndex: number;
        private lastMaterial: Material;
        private lastIndex: number;
        private canRender: boolean;

        constructor(context: RenderContext) {
            this.context = context;
            this.map = context.getMap();
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

        invalidate(geom: boolean): void {
            if (this.isBuildingList) return;
            if (geom) this.handles = null;
            this.context.invalidate();
        }

        updateItem(item: DrawListItem): void {
            this.invalidate(true);
        }

        private bufferHandle(buf: CommandBuffer, handle: WorldMeshHandle, context: RenderContext): void {
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

                if (this.lastProgram !== this.lastMaterial.getProgram())
                {
                    if (this.lastProgram !== undefined) {
                        this.lastProgram.bufferDisableMeshComponents(buf);
                    }

                    this.lastProgram = this.lastMaterial.getProgram();

                    changedProgram = true;
                    changedTransform = true;
                }

                this.canRender = this.lastProgram.isCompiled() && this.lastMaterial.enabled;
            }

            if (!this.canRender) return;

            if (changedProgram) {
                this.lastProgram.bufferSetup(buf, context);
            }

            if (changedMaterial) {
                this.lastProgram.bufferMaterial(buf, this.lastMaterial);
            }

            if (changedTransform) {
                this.lastProgram.bufferModelMatrix(buf, context.getModelMatrix());
            }

            if (this.lastGroup !== handle.group || changedProgram) {
                this.lastGroup = handle.group;
                this.lastVertexOffset = undefined;
                this.lastGroup.bufferBindBuffers(buf, this.lastProgram);
            }

            if (this.lastVertexOffset !== handle.vertexOffset) {
                this.lastVertexOffset = handle.vertexOffset;
                this.lastGroup.bufferAttribPointers(buf, this.lastProgram, this.lastVertexOffset);
            }

            this.lastGroup.bufferRenderElements(buf, handle.drawMode, handle.indexOffset, handle.indexCount);
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
                    if (handle.indexCount === 0) continue;
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
                last.vertexOffset = next.vertexOffset;
                last.indexOffset = next.indexOffset;
                last.indexCount = next.indexCount;
            }

            (this.map.getApp() as MapViewer).invalidateDebugPanel();
        }

        appendToBuffer(buf: CommandBuffer, context: RenderContext): void {
            this.lastParent = undefined;
            this.lastGroup = undefined;
            this.lastVertexOffset = undefined;
            this.lastProgram = undefined;
            this.lastMaterial = undefined;
            this.lastMaterialIndex = undefined;
            this.lastIndex = undefined;

            if (this.handles == null) this.buildHandleList();

            context.getShaderManager().resetUniformCache();

            for (let i = 0, iEnd = this.merged.length; i < iEnd; ++i) {
                this.bufferHandle(buf, this.merged[i], context);
            }

            if (this.lastProgram !== undefined) {
                this.lastProgram.bufferDisableMeshComponents(buf);
            }
        }

        logState(writer: FormattedWriter): void {
            writer.writeProperty("itemCount", this.items.length);
            writer.writeProperty("handleCount", this.handles.length);
            writer.writeProperty("mergedCount", this.merged.length);
        }
    }
}