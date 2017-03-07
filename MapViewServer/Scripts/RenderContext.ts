namespace SourceUtils {
    export class RenderContext implements IStateLoggable {
        private map: Map;
        private camera: Camera;

        private projectionMatrix = new THREE.Matrix4();
        private modelMatrix = new THREE.Matrix4();
        private viewMatrix = new THREE.Matrix4();
        private modelViewMatrix = new THREE.Matrix4();
        private modelViewInvalid = true;

        private pvsRoot: VisLeaf;
        private drawList: DrawList;

        private pvsOrigin = new THREE.Vector3();

        pvsFollowsCamera = true;
        fogParams: Api.IFogParams;

        origin = new THREE.Vector3();
        near: number;
        far: number;

        constructor(map: Map, camera: Camera) {
            this.map = map;
            this.camera = camera;
            this.drawList = new DrawList(map);

            this.map.addDrawListInvalidationHandler(() => this.drawList.invalidate());
        }

        getProjectionMatrix(): Float32Array {
            return this.projectionMatrix.elements;
        }

        getModelViewMatrix(): Float32Array {
            if (this.modelViewInvalid) {
                this.modelViewInvalid = false;
                this.modelViewMatrix.multiplyMatrices(this.viewMatrix, this.modelMatrix);
            }

            return this.modelViewMatrix.elements;
        }

        setModelTransform(model: Entity): void {
            if (model == null) {
                this.modelMatrix.identity();
            } else {
                model.getMatrix(this.modelMatrix);
            }
            this.modelViewInvalid = true;
        }

        setPvsOrigin(pos: THREE.Vector3 | Api.IVector3): void {
            this.pvsFollowsCamera = false;
            this.pvsOrigin.set(pos.x, pos.y, pos.z);
        }

        render(): void {
            this.camera.getPosition(this.origin);
            if (this.pvsFollowsCamera) this.pvsOrigin.set(this.origin.x, this.origin.y, this.origin.z);

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
            if (pvs != null) this.map.appendToDrawList(this.drawList, pvs);
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
