namespace SourceUtils
{
    export class RenderContext
    {
        private modelViewMatrix = new THREE.Matrix4();

        origin = new THREE.Vector3();
        near: number;
        far: number;
        projectionMatrix = new THREE.Matrix4();

        getModelViewMatrix(): THREE.Matrix4
        {
            // TODO: invalidation
            return this.modelViewMatrix;
        }

        setup(camera: THREE.Camera): void {
            const perspCamera = camera as THREE.PerspectiveCamera;

            this.origin.copy(camera.position);
            this.near = perspCamera.near;
            this.far = perspCamera.far;

            this.projectionMatrix.copy(camera.projectionMatrix);

            camera.updateMatrixWorld(false);
        }
    }

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

        private renderHandle(handle: WorldMeshHandle, context: RenderContext): void {
            let changedProgram = false;

            if (this.lastMaterialIndex !== handle.materialIndex) {
                this.lastMaterialIndex = handle.materialIndex;
                this.lastMaterial = this.map.getMaterial(handle.materialIndex);

                if (this.lastMaterial == null) {
                    this.canRender = false;
                    return;
                }

                if (this.lastProgram !== this.lastMaterial.getProgram()) {
                    if (this.lastProgram != null) this.lastProgram.cleanupPostRender(this.map, context);

                    this.lastProgram = this.lastMaterial.getProgram();
                    this.lastProgram.prepareForRendering(this.map, context);
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
            return a.compareTo(b);
        }

        private buildHandleList(): void {
            this.handles = [];

            const loader = this.map.faceLoader;

            for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                const handles = this.items[i].getMeshHandles(loader);
                if (handles == null) continue;

                for (let j = 0, jEnd = handles.length; j < jEnd; ++j)
                {
                    const handle = handles[j];
                    if (handle.count === 0) continue;
                    if (handle.material == null) {
                        if ((handle.material = this.map.getMaterial(handle.materialIndex)) == null) continue;
                    }

                    this.handles.push(handle);
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
                last.materialIndex = next.materialIndex;
                last.offset = next.offset;
                last.count = next.count;
            }

            if ((this.map.getApp() as MapViewer).logDrawCalls) console.log(`Draw calls: ${this.merged.length}`);
        }

        render(context: RenderContext): void {
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
    }
}