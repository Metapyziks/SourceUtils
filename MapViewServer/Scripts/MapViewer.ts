/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class MapViewer extends AppBase {
        private map: Map;

        private lookAngs = new THREE.Vector2();
        private lookQuat = new THREE.Quaternion(0, 0, 0, 1);

        constructor() {
            super();

            this.canLockPointer = true;
        }

        init(container: JQuery): void {
            this.camera = new THREE.PerspectiveCamera(75, container.innerWidth() / container.innerHeight(), 1, 8192);
            this.camera.up.set(0, 0, 1);

            super.init(container);

            this.getContext().clearColor(100 / 255, 149 / 255, 237 / 255, 1);

            this.updateCameraAngles();
        }

        loadMap(url: string): void {
            this.map = new Map(this, url);
        }

        onKeyDown(key: Key): void {
            super.onKeyDown(key);

            if (key === Key.F) {
                this.toggleFullscreen();
            }
        }

        private unitZ = new THREE.Vector3(0, 0, 1);
        private unitX = new THREE.Vector3(1, 0, 0);
        private tempQuat = new THREE.Quaternion();

        protected onUpdateCamera(): void {
            const camera = this.camera as THREE.PerspectiveCamera;

            camera.aspect = this.getWidth() / this.getHeight();
            camera.updateProjectionMatrix();
        }

        private updateCameraAngles(): void {
            if (this.lookAngs.y < -Math.PI * 0.5) this.lookAngs.y = -Math.PI * 0.5;
            if (this.lookAngs.y > Math.PI * 0.5) this.lookAngs.y = Math.PI * 0.5;

            this.lookQuat.setFromAxisAngle(this.unitZ, this.lookAngs.x);
            this.tempQuat.setFromAxisAngle(this.unitX, this.lookAngs.y + Math.PI * 0.5);
            this.lookQuat.multiply(this.tempQuat);

            this.camera.rotation.setFromQuaternion(this.lookQuat);
        }

        protected onMouseLook(delta: THREE.Vector2): void {
            super.onMouseLook(delta);

            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.updateCameraAngles();
        }

        protected onUpdateFrame(dt: number): void {
            super.onUpdateFrame(dt);

            const move = new THREE.Vector3();
            const moveSpeed = 512 * dt;

            if (this.isKeyDown(Key.W)) move.z -= moveSpeed;
            if (this.isKeyDown(Key.S)) move.z += moveSpeed;
            if (this.isKeyDown(Key.A)) move.x -= moveSpeed;
            if (this.isKeyDown(Key.D)) move.x += moveSpeed;

            if (move.lengthSq() > 0) {
                move.applyEuler(this.camera.rotation);
                this.camera.position.add(move);
            }

            this.map.updatePvs(this.camera.position);
        }

        protected onRenderFrame(dt: number): void {
            const gl = this.getContext();

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);

            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);

            this.map.shaderManager.setCurrentProgram(null);
            this.map.render(this.camera);
        }
    }
}
