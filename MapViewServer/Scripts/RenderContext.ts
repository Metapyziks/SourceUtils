namespace SourceUtils {
    export class RenderContext implements IStateLoggable {
        private map: Map;
        private camera: Camera;

        private projectionMatrix = new THREE.Matrix4();
        private identityMatrix = new THREE.Matrix4().identity();
        private viewMatrix = new THREE.Matrix4();

        private modelMatrixElems: Float32Array;

        private pvsRoot: VisLeaf;
        private drawList: DrawList;
        private commandBuffer: CommandBuffer;
        private commandBufferInvalid = true;

        private pvsOrigin = new THREE.Vector3();

        private refractFrameBuffer: FrameBuffer;

        pvsFollowsCamera = true;
        fogParams: Api.IFogParams;

        origin = new THREE.Vector3();
        near: number;
        far: number;

        time: number;

        constructor(map: Map, camera: Camera) {
            this.map = map;
            this.camera = camera;
            this.drawList = new DrawList(this);
            this.commandBuffer = new CommandBuffer(map.shaderManager.getContext());

            this.map.addDrawListInvalidationHandler((geom: boolean) => this.drawList.invalidate(geom));
        }

        getRefractFrameBuffer(): FrameBuffer {
            return this.refractFrameBuffer;
        }

        invalidate(): void {
            this.commandBufferInvalid = true;
        }

        getMap(): Map {
            return this.map;
        }

        getShaderManager(): ShaderManager {
            return this.map.shaderManager;
        }

        getLightmap(): Texture {
            return this.map.getLightmap();
        }

        getProjectionMatrix(): Float32Array {
            return this.projectionMatrix.elements;
        }

        getViewMatrix(): Float32Array {
            return this.viewMatrix.elements;
        }

        getModelMatrix(): Float32Array {
            return this.modelMatrixElems;
        }

        setModelTransform(model: Entity): void {
            if (model == null) {
                this.modelMatrixElems = this.identityMatrix.elements;
            } else {
                this.modelMatrixElems = model.getMatrixElements();
            }
        }

        setPvsOrigin(pos: THREE.Vector3 | Api.IVector3): void {
            this.pvsFollowsCamera = false;
            this.pvsOrigin.set(pos.x, pos.y, pos.z);
        }

        render(): void {
            this.camera.getPosition(this.origin);
            if (this.pvsFollowsCamera) this.pvsOrigin.set(this.origin.x, this.origin.y, this.origin.z);

            this.time = performance.now() * 0.001;

            const persp = this.camera as PerspectiveCamera;
            if (persp.getNear !== undefined) {
                this.near = persp.getNear();
                this.far = persp.getFar();
            }

            this.camera.getProjectionMatrix(this.projectionMatrix);
            this.camera.getInverseMatrix(this.viewMatrix);

            this.updatePvs();

            if (this.commandBufferInvalid) {
                this.commandBufferInvalid = false;

                this.commandBuffer.clear();
                this.drawList.appendToBuffer(this.commandBuffer, this);
            }

            this.commandBuffer.run(this);
        }

        bufferRefractTargetBegin(buf: CommandBuffer): void {
            const app = this.map.getApp();
            const width = app.getWidth();
            const height = app.getHeight();

            if (this.refractFrameBuffer === undefined) {
                this.refractFrameBuffer = new FrameBuffer(this.map.shaderManager.getContext(), width, height, true);
            }

            buf.bindFramebuffer(this.refractFrameBuffer, true);
        }

        bufferRefractTargetEnd(buf: CommandBuffer): void {
            buf.bindFramebuffer(null);
        }

        getClusterIndex(): number {
            return this.pvsRoot == null ? -1 : this.pvsRoot.cluster;
        }

        canSeeSky2D(): boolean {
            return this.pvsRoot == null || this.pvsRoot.cluster === -1 || this.pvsRoot.canSeeSky2D;
        }

        canSeeSky3D(): boolean {
            return this.pvsRoot == null || this.pvsRoot.cluster === -1 || this.pvsRoot.canSeeSky3D;
        }

        private replacePvs(pvs: VisLeaf[]): void {
            this.drawList.clear();
            this.commandBufferInvalid = true;

            if (pvs != null) {
                this.map.appendToDrawList(this.drawList, pvs);
            }
        }

        updatePvs(force?: boolean): void {
            const worldSpawn = this.map.getWorldSpawn();
            if (worldSpawn == null) return;

            const root = worldSpawn.findLeaf(this.pvsOrigin);
            if (root === this.pvsRoot && !force) return;

            this.pvsRoot = root;
            if (root == null || root.cluster === -1) {
                this.replacePvs(null);
                return;
            }

            this.map.getPvsArray(root,
                (pvs) => {
                    if (this.pvsRoot != null && this.pvsRoot === root) {
                        this.replacePvs(pvs);
                    }
                });
        }

        getDrawCallCount(): number {
            return this.drawList.getDrawCalls();
        }

        logState(writer: FormattedWriter): void {
            writer.beginBlock("origin");
            writer.writeProperty("x", this.origin.x);
            writer.writeProperty("y", this.origin.y);
            writer.writeProperty("z", this.origin.z);
            writer.endBlock();

            writer.writeProperty("cluster", this.getClusterIndex());

            writer.beginBlock("drawList");
            this.drawList.logState(writer);
            writer.endBlock();
        }
    }
}
