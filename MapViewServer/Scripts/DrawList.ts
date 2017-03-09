namespace SourceUtils {
    export class DrawList implements IStateLoggable
    {
        private context: RenderContext;
        private map: Map;

        private items: DrawListItem[] = [];
        private invalid: boolean;
        private opaque: WorldMeshHandle[] = [];
        private translucent: WorldMeshHandle[] = [];

        private lastParent: Entity;
        private lastGroup: WorldMeshGroup;
        private lastVertexOffset: number;
        private lastProgram: ShaderProgram;
        private lastMaterialIndex: number;
        private lastMaterial: Material;
        private lastIndex: number;
        private canRender: boolean;

        private hasRefraction: boolean;

        constructor(context: RenderContext) {
            this.context = context;
            this.map = context.getMap();
        }

        clear(): void {
            for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                this.items[i].onRemoveFromDrawList(this);
            }

            this.items = [];
            this.opaque = [];
            this.translucent = [];
        }

        getDrawCalls(): number {
            return this.opaque.length + this.translucent.length;
        }

        addItem(item: DrawListItem): void {
            this.items.push(item);
            this.updateItem(item);
            item.onAddToDrawList(this);
        }

        private isBuildingList: boolean = false;

        invalidate(geom: boolean): void {
            if (this.isBuildingList) return;
            if (geom) this.invalid = true;
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
            this.opaque = [];
            this.translucent = [];
            this.hasRefraction = false;

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

                    if (handle.material.properties.translucent || handle.material.properties.refract) {
                        if (handle.material.properties.refract) this.hasRefraction = true;
                        this.translucent.push(handle);
                    } else this.opaque.push(handle);
                }
            }

            this.isBuildingList = false;

            this.opaque.sort(DrawList.compareHandles);
            this.translucent.sort(DrawList.compareHandles);

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

            if (this.invalid) this.buildHandleList();

            context.getShaderManager().resetUniformCache();

            if (this.hasRefraction) context.bufferRefractTargetBegin(buf);

            for (let i = 0, iEnd = this.opaque.length; i < iEnd; ++i) {
                this.bufferHandle(buf, this.opaque[i], context);
            }

            if (this.hasRefraction) context.bufferRefractTargetEnd(buf);

            for (let i = 0, iEnd = this.translucent.length; i < iEnd; ++i) {
                this.bufferHandle(buf, this.translucent[i], context);
            }

            if (this.lastProgram !== undefined) {
                this.lastProgram.bufferDisableMeshComponents(buf);
            }
        }

        logState(writer: FormattedWriter): void {
            writer.writeProperty("itemCount", this.items.length);
            writer.writeProperty("opaqueCount", this.opaque.length);
            writer.writeProperty("translucentCount", this.translucent.length);
            writer.writeProperty("hasRefraction", this.hasRefraction);
        }
    }
}