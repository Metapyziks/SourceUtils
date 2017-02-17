/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class MapViewer extends AppBase {
        private map: Map;

        logFrameTime = false;
        logDrawCalls = false;

        camera: PerspectiveCamera;

        private lookAngs = new THREE.Vector2();
        private lookQuat = new THREE.Quaternion(0, 0, 0, 1);

        private countedFrames = 0;
        private totalFrameTime = 0;

        private mainRenderContext: RenderContext;
        private skyRenderContext: RenderContext;
        private skyCamera: PerspectiveCamera;

        private spawned = false;

        constructor() {
            super();

            this.canLockPointer = true;
        }

        init(container: JQuery): void {
            this.camera = new PerspectiveCamera(75, container.innerWidth() / container.innerHeight(), 1, 8192);

            super.init(container);

            this.getContext().clearColor(100 / 255, 149 / 255, 237 / 255, 1);

            this.updateCameraAngles();
        }

        loadMap(url: string): void {
            this.map = new Map(this, url);
            this.mainRenderContext = new RenderContext(this.map, this.camera);
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
            this.camera.setAspect(this.getWidth() / this.getHeight());
            if (this.skyCamera != null) this.skyCamera.setAspect(this.camera.getAspect());
        }

        private updateCameraAngles(): void {
            if (this.lookAngs.y < -Math.PI * 0.5) this.lookAngs.y = -Math.PI * 0.5;
            if (this.lookAngs.y > Math.PI * 0.5) this.lookAngs.y = Math.PI * 0.5;

            this.lookQuat.setFromAxisAngle(this.unitZ, this.lookAngs.x);
            this.tempQuat.setFromAxisAngle(this.unitX, this.lookAngs.y + Math.PI * 0.5);
            this.lookQuat.multiply(this.tempQuat);

            this.camera.setRotation(this.lookQuat);
        }

        protected onMouseLook(delta: THREE.Vector2): void {
            super.onMouseLook(delta);

            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.updateCameraAngles();
        }

        protected onUpdateFrame(dt: number): void {
            super.onUpdateFrame(dt);

            if (!this.spawned) {
                if (this.map.info == null) return;
                this.spawned = true;

                this.camera.setPosition(this.map.info.playerStarts[0]);
                this.camera.translate(0, 0, 64);

                if (this.map.info.fog != null && this.map.info.fog.farZ !== -1) {
                    this.camera.setFar(this.map.info.fog.farZ);
                }

                if (this.map.info.skyCamera.enabled) {
                    this.skyCamera = new PerspectiveCamera(this.camera.getFov(), this.camera.getAspect(), this.camera.getNear(), this.camera.getFar());
                    this.skyRenderContext = new RenderContext(this.map, this.skyCamera);
                }
            }

            this.map.update();

            const move = new THREE.Vector3();
            const moveSpeed = 512 * dt;

            if (this.isKeyDown(Key.W)) move.z -= moveSpeed;
            if (this.isKeyDown(Key.S)) move.z += moveSpeed;
            if (this.isKeyDown(Key.A)) move.x -= moveSpeed;
            if (this.isKeyDown(Key.D)) move.x += moveSpeed;

            if (move.lengthSq() > 0) {
                this.camera.applyRotationTo(move);
                this.camera.translate(move);
            }
        }

        private skyCameraPos = new THREE.Vector3();

        protected onRenderFrame(dt: number): void {
            const gl = this.getContext();

            const t0 = performance.now();

            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);

            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);

            this.map.setSkyMaterialEnabled(true);

            if (this.skyRenderContext != null) {
                this.camera.getPosition(this.skyCameraPos);
                this.skyCameraPos.divideScalar(this.map.info.skyCamera.scale);
                this.skyCameraPos.add(this.map.info.skyCamera.origin as any);

                this.skyCamera.copyRotation(this.camera);
                this.skyCamera.setPosition(this.skyCameraPos);
                this.skyRenderContext.render();

                gl.clear(gl.DEPTH_BUFFER_BIT);

                this.map.setSkyMaterialEnabled(false);
            }

            if (this.mainRenderContext != null) {
                this.mainRenderContext.render();
            }

            const t1 = performance.now();

            if (this.logFrameTime) {
                this.totalFrameTime += (t1 - t0);
                this.countedFrames += 1;

                if (this.countedFrames > 100) {
                    const avgFrameTime = this.totalFrameTime / this.countedFrames;
                    console.log(`Frametime: ${avgFrameTime} ms (${1000 / avgFrameTime} FPS)`);
                    this.totalFrameTime = 0;
                    this.countedFrames = 0;
                }
            }
        }
    }
}
