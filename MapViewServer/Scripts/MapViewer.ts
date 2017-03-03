/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class MapViewer extends AppBase {
        private map: Map;

        debugPanel: JQuery;

        camera: PerspectiveCamera;

        private lookAngs = new THREE.Vector2();
        private lookQuat = new THREE.Quaternion(0, 0, 0, 1);

        private countedFrames = 0;
        private frameCountStart = 0;
        private totalRenderTime = 0;
        private lastAvgRenderTime = 0;
        private lastAvgFrameTime = 0;

        private debugPanelInvalid = false;
        private lastDebugPanel: JQuery;

        private mainRenderContext: RenderContext;
        private skyRenderContext: RenderContext;
        private skyCamera: PerspectiveCamera;

        private spawned = false;

        constructor() {
            super();

            this.canLockPointer = true;
            this.frameCountStart = performance.now();
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
                this.mainRenderContext.fogParams = this.map.info.fog;

                if (this.map.info.fog.fogEnabled && this.map.info.fog.farZ !== -1) {
                    this.camera.setFar(this.map.info.fog.farZ);
                }

                if (this.map.info.skyCamera.enabled) {
                    this.skyCamera = new PerspectiveCamera(this.camera.getFov(), this.camera.getAspect(), this.camera.getNear(), this.camera.getFar());
                    this.skyRenderContext = new RenderContext(this.map, this.skyCamera);
                    this.skyRenderContext.fogParams = this.map.info.skyCamera;
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
                this.invalidateDebugPanel();
            }

            if (this.debugPanelInvalid) {
                this.debugPanelInvalid = false;
                this.updateDebugPanel();
            }
        }

        invalidateDebugPanel(): void {
            this.debugPanelInvalid = true;
        }

        private initDebugPanel(): void {
            this.debugPanel
                .html('<span class="debug-label">Render time:</span>&nbsp;<span class="debug-value" id="debug-render-time"></span><br/>'
                + '<span class="debug-label">Frame time:</span>&nbsp;<span class="debug-value" id="debug-frame-time"></span><br/>'
                + '<span class="debug-label">Frame rate:</span>&nbsp;<span class="debug-value" id="debug-frame-rate"></span><br/>'
                + '<span class="debug-label">Draw calls:</span>&nbsp;<span class="debug-value" id="debug-draw-calls"></span><br/>'
                + '<span class="debug-label">Camera pos:</span>&nbsp;<span class="debug-value" id="debug-camera-pos"></span>');
        }

        private updateDebugPanel(): void {
            if (this.debugPanel == null) return;

            if (this.lastDebugPanel !== this.debugPanel) {
                this.lastDebugPanel = this.debugPanel;
                this.initDebugPanel();
            }

            let drawCalls = this.mainRenderContext.getDrawCallCount();
            if (this.skyRenderContext != null) {
                drawCalls += this.skyRenderContext.getDrawCallCount();
            }

            const cameraPos = new THREE.Vector3();
            this.camera.getPosition(cameraPos);

            this.debugPanel.find("#debug-render-time").text(`${this.lastAvgRenderTime.toPrecision(5)} ms`);
            this.debugPanel.find("#debug-frame-time").text(`${this.lastAvgFrameTime.toPrecision(5)} ms`);
            this.debugPanel.find("#debug-frame-rate").text(`${(1000 / this.lastAvgFrameTime).toPrecision(5)} fps`);
            this.debugPanel.find("#debug-draw-calls").text(`${drawCalls}`);
            this.debugPanel.find("#debug-camera-pos").text(`${Math.round(cameraPos.x)}, ${Math.round(cameraPos.y)}, ${Math.round(cameraPos.z)}`);
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


            if (this.skyRenderContext != null && this.mainRenderContext.canSeeSky3D()) {
                this.map.setSkyMaterialEnabled(true);

                this.camera.getPosition(this.skyCameraPos);
                this.skyCameraPos.divideScalar(this.map.info.skyCamera.scale);
                this.skyCameraPos.add(this.map.info.skyCamera.origin as any);

                this.skyCamera.copyRotation(this.camera);
                this.skyCamera.setPosition(this.skyCameraPos);
                this.skyRenderContext.render();

                gl.clear(gl.DEPTH_BUFFER_BIT);

                this.map.setSkyMaterialEnabled(false);
            } else if (this.mainRenderContext.canSeeSky2D()) {
                this.map.setSkyMaterialEnabled(true);
            }

            if (this.mainRenderContext != null) {
                this.mainRenderContext.render();
            }

            gl.finish();

            const t1 = performance.now();
            
            this.totalRenderTime += (t1 - t0);
            this.countedFrames += 1;

            if (this.countedFrames > 100) {
                this.lastAvgRenderTime = this.totalRenderTime / this.countedFrames;
                this.lastAvgFrameTime = (t1 - this.frameCountStart) / this.countedFrames;
                this.frameCountStart = t1;
                this.invalidateDebugPanel();
                this.totalRenderTime = 0;
                this.countedFrames = 0;
            }
        }
    }
}
