namespace SourceUtils
{
    export class RenderContext
    {
        private map: Map;
        private camera: Camera;

        private projectionMatrix = new THREE.Matrix4();
        private modelMatrix = new THREE.Matrix4();
        private viewMatrix = new THREE.Matrix4();
        private modelViewMatrix = new THREE.Matrix4();
        private modelViewInvalid = true;

        private pvsRoot: VisLeaf;
        private drawList: DrawList;

        fogParams: Api.FogParams;

        origin = new THREE.Vector3();
        near: number;
        far: number;

        constructor(map: Map, camera: Camera) {
            this.map = map;
            this.camera = camera;
            this.drawList = new DrawList(map);
        }

        getProjectionMatrix(): Float32Array {
            return this.projectionMatrix.elements;
        }

        getModelViewMatrix(): Float32Array
        {
            if (this.modelViewInvalid) {
                this.modelViewInvalid = false;
                this.modelViewMatrix.multiplyMatrices(this.viewMatrix, this.modelMatrix);
            }

            return this.modelViewMatrix.elements;
        }

        setModelTransform(model: Entity): void
        {
            if (model == null) {
                this.modelMatrix.identity();
            } else {
                model.getMatrix(this.modelMatrix);
            }
            this.modelViewInvalid = true;
        }

        render(): void
        {
            this.camera.getPosition(this.origin);

            const persp = this.camera as PerspectiveCamera;
            if (persp.getNear !== undefined) {
                this.near = persp.getNear();
                this.far = persp.getFar();
            }

            this.camera.getProjectionMatrix(this.projectionMatrix);
            this.camera.getInverseMatrix(this.viewMatrix);
            this.modelViewInvalid = true;

            this.map.shaderManager.setCurrentProgram(null);

            this.updatePvs();
            this.drawList.render(this);
        }

        private replacePvs(pvs: VisLeaf[]): void
        {
            this.drawList.clear();
            if (pvs != null) this.map.appendToDrawList(this.drawList, pvs);
        }

        updatePvs(force?: boolean): void
        {
            const worldSpawn = this.map.getWorldSpawn();
            if (worldSpawn == null) return;

            const root = worldSpawn.findLeaf(this.origin);
            if (root === this.pvsRoot && !force) return;

            this.pvsRoot = root;
            if (root == null || root.cluster === -1)
            {
                this.replacePvs(null);
                return;
            }

            this.map.getPvsArray(root, (pvs) => {
                if (this.pvsRoot != null && this.pvsRoot === root) {
                    this.replacePvs(pvs);
                }
            });
        }

        getDrawCallCount(): number {
            return this.drawList.getDrawCalls();
        }
    }

    export class DrawList {
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

        updateItem(item: DrawListItem): void {
            this.handles = null;
        }

        private renderHandle(handle: WorldMeshHandle, context: RenderContext): void {
            let changedProgram = false;
            let changedTransform = false;

            if (this.lastParent !== handle.parent) {
                this.lastParent = handle.parent;
                context.setModelTransform(this.lastParent);
                changedTransform = true;
            }

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

                last.parent = next.parent;
                last.group = next.group;
                last.drawMode = next.drawMode;
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
    }
}