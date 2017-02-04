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
            this.camera = new THREE.PerspectiveCamera(60, container.innerWidth() / container.innerHeight(), 1, 8192);
            this.camera.up.set(0, 0, 1);

            super.init(container);

            const ambient = new THREE.AmbientLight(0x7EABCF, 0.125);
            this.getScene().add(ambient);

            const directional = new THREE.DirectionalLight(0xFDF4D9);
            directional.position.set(3, -5, 7);
            this.getScene().add(directional);

            this.updateCameraAngles();
        }

        loadMap(url: string): void {
            if (this.map != null) {
                this.getScene().remove(this.map);
            }

            this.map = new Map(url);
            this.getScene().add(this.map);
        }

        private unitZ = new THREE.Vector3(0, 0, 1);
        private unitX = new THREE.Vector3(1, 0, 0);
        private tempQuat = new THREE.Quaternion();

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
    }
}
