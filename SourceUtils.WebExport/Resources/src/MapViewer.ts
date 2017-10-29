/// <reference path="../js/facepunch.webgame.d.ts"/>
/// <reference path="../js/jquery.d.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export enum CameraMode {
        Fixed = 0,
        CanLook = 1,
        CanMove = 2,
        FreeCam = CanLook | CanMove
    }

    export class MapViewer extends WebGame.Game {
        mainCamera: Entities.Camera;
        debugPanel: HTMLElement;

        readonly map = new Map(this);
        readonly visLoader = this.addLoader(new VisLoader());
        readonly bspModelLoader = this.addLoader(new BspModelLoader(this));
        readonly mapMaterialLoader = this.addLoader(new MapMaterialLoader(this));
        readonly leafGeometryLoader = this.addLoader(new LeafGeometryLoader(this));
        readonly dispGeometryLoader = this.addLoader(new DispGeometryLoader(this));
        readonly studioModelLoader = this.addLoader(new StudioModelLoader(this));
        readonly vertLightingLoader = this.addLoader(new VertexLightingLoader(this));

        private debugPanelVisible: boolean;

        cameraMode = CameraMode.Fixed;
        showDebugPanel = false;

        totalLoadProgress = 0;

        avgFrameTime: number;
        avgFrameRate: number;

        constructor(container: HTMLElement) {
            super(container);

            container.classList.add("map-viewer");
        }

        loadMap(url: string): void {
            this.map.load(url);
        }

        protected onInitialize(): void {
            this.canLockPointer = true;

            this.mainCamera = new Entities.Camera(this, 75);

            const deltaAngles = new Facepunch.Vector3();
            let lastRotationSampleTime = new Date().getTime() / 1000;

            const deviceRotate = (x: number, y: number, z: number, period: number, toRadians: number) => {
                x *= toRadians / period;
                y *= toRadians / period;
                z *= toRadians / period;

                const sampleTime = new Date().getTime() / 1000;
                const deltaTime = sampleTime - lastRotationSampleTime;
                lastRotationSampleTime = sampleTime;

                deltaAngles.x = x * deltaTime;
                deltaAngles.y = y * deltaTime;
                deltaAngles.z = z * deltaTime;

                this.onDeviceRotate(deltaAngles);
            };

            const wind: any = window;
            if (wind.DeviceMotionEvent) {
                window.addEventListener("devicemotion",
                    evnt => {
                        const rate = evnt.rotationRate;
                        deviceRotate(rate.beta, rate.gamma, rate.alpha, 1.0, 1.0);
                    },
                    true);
            }

            super.onInitialize();
        }

        protected onCreateDebugPanel(): HTMLElement {
            const panel = document.createElement("div");
            panel.classList.add("side-panel");
            panel.innerHTML = `
                <span class="label">Frame time:</span>&nbsp;<span id="debug-frametime">0</span>&nbsp;ms<br/>
                <span class="label">Frame rate:</span>&nbsp;<span id="debug-framerate">0</span>&nbsp;fps<br />
                <span class="label">Draw calls:</span>&nbsp;<span id="debug-drawcalls">0</span><br />
                <div id="debug-loading">
                    <span class="label">Map loaded:</span>&nbsp;<span id="debug-loadpercent">0</span>%<br />
                </div>`;

            this.container.appendChild(panel);
            return panel;
        }

        protected onDeviceRotate(deltaAngles: Facepunch.Vector3): void {
            if ((this.cameraMode & CameraMode.CanLook) === 0) return;
            if (window.innerWidth > window.innerHeight) {
                this.lookAngs.x += deltaAngles.z;
                this.lookAngs.y -= deltaAngles.x;
            } else {
                this.lookAngs.x += deltaAngles.x;
                this.lookAngs.y += deltaAngles.z;
            }
            this.updateCameraAngles();
        }

        protected onResize(): void {
            super.onResize();

            this.mainCamera.setAspect(this.getWidth() / this.getHeight());
        }

        private readonly lookAngs = new Facepunch.Vector2();
        private readonly tempQuat = new Facepunch.Quaternion();
        private readonly lookQuat = new Facepunch.Quaternion();

        setCameraAngles(yaw: number, pitch: number): void {
            this.lookAngs.x = yaw;
            this.lookAngs.y = pitch;
            this.updateCameraAngles();
        }

        private updateCameraAngles(): void {
            if (this.lookAngs.y < -Math.PI * 0.5) this.lookAngs.y = -Math.PI * 0.5;
            if (this.lookAngs.y > Math.PI * 0.5) this.lookAngs.y = Math.PI * 0.5;

            this.lookQuat.setAxisAngle(Facepunch.Vector3.unitZ, this.lookAngs.x);
            this.tempQuat.setAxisAngle(Facepunch.Vector3.unitX, this.lookAngs.y + Math.PI * 0.5);
            this.lookQuat.multiply(this.tempQuat);

            this.mainCamera.setRotation(this.lookQuat);
        }

        protected onMouseLook(delta: Facepunch.Vector2): void {
            super.onMouseLook(delta);

            if ((this.cameraMode & CameraMode.CanLook) === 0) return;

            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.updateCameraAngles();
        }

        toggleFullscreen(): void {
            const container = this.container;
            const cont = container as any;
            const doc = document as any;

            if (document.fullscreenElement === container || document.webkitFullscreenElement === container || doc.mozFullScreenElement === container) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
            } else if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (cont.mozRequestFullScreen) {
                cont.mozRequestFullScreen();
            }
        }

        protected onKeyDown(key: WebGame.Key): boolean {
            super.onKeyDown(key);

            switch (key) {
                case WebGame.Key.F:
                    this.toggleFullscreen();
                    return true;
                case WebGame.Key.W:
                case WebGame.Key.A:
                case WebGame.Key.S:
                case WebGame.Key.D:
                case WebGame.Key.Shift:
                    return this.isPointerLocked() && (this.cameraMode & CameraMode.CanMove) !== 0;
                default:
                    return false;
            }
        }

        private readonly move = new Facepunch.Vector3();

        private lastProfileTime: number;
        private frameCount = 0;
        private lastDrawCalls: number;
        private allLoaded = false;

        protected onSetDebugText(id: string, value: string): void {
            const elem = document.getElementById(id);
            if (elem != null) {
                elem.innerText = value;
            }

            if (id === "debug-loadpercent" && parseInt(value) >= 100) {
                const loading = document.getElementById("debug-loading");
                if (loading != null) {
                    loading.style.display = "none";
                }
            }
        }

        protected onUpdateFrame(dt: number): void {
            super.onUpdateFrame(dt);

            if (this.showDebugPanel !== this.debugPanelVisible) {
                this.debugPanelVisible = this.showDebugPanel;

                if (this.showDebugPanel && this.debugPanel === undefined) {
                    this.debugPanel = this.onCreateDebugPanel();
                }

                if (this.debugPanel != null) {
                    if (this.showDebugPanel) this.debugPanel.style.display = null;
                    else this.debugPanel.style.display = "none";
                }
            }

            if ((this.cameraMode & CameraMode.CanMove) !== 0 && this.isPointerLocked()) {
                this.move.set(0, 0, 0);
                const moveSpeed = 512 * dt * (this.isKeyDown(WebGame.Key.Shift) ? 4 : 1);

                if (this.isKeyDown(WebGame.Key.W)) this.move.z -= moveSpeed;
                if (this.isKeyDown(WebGame.Key.S)) this.move.z += moveSpeed;
                if (this.isKeyDown(WebGame.Key.A)) this.move.x -= moveSpeed;
                if (this.isKeyDown(WebGame.Key.D)) this.move.x += moveSpeed;

                if (this.move.lengthSq() > 0) {
                    this.mainCamera.applyRotationTo(this.move);
                    this.mainCamera.translate(this.move);
                }
            }

            const drawCalls = this.mainCamera.getDrawCalls();
            if (drawCalls !== this.lastDrawCalls && this.showDebugPanel) {
                this.lastDrawCalls = drawCalls;
                this.onSetDebugText("debug-drawcalls", drawCalls.toString());
            }

            ++this.frameCount;
            const time = performance.now();

            if (this.lastProfileTime === undefined) {
                this.lastProfileTime = time;
            } else if (time - this.lastProfileTime >= 500) {
                const timeDiff = (time - this.lastProfileTime) / 1000;
                this.avgFrameTime = timeDiff * 1000 / this.frameCount;
                this.avgFrameRate = this.frameCount / timeDiff;

                if (this.showDebugPanel) {
                    this.onSetDebugText("debug-frametime", this.avgFrameTime.toPrecision(4));
                    this.onSetDebugText("debug-framerate", this.avgFrameRate.toPrecision(4));
                }

                if (!this.allLoaded) {
                    const visLoaded = this.visLoader.getLoadProgress();
                    const bspLoaded = this.bspModelLoader.getLoadProgress();
                    const lightmapLoaded = this.map.getLightmapLoadProgress();
                    const materialsLoaded = this.mapMaterialLoader.getLoadProgress();

                    const geomLoaded = this.leafGeometryLoader.getLoadProgress() * 0.5
                        + this.dispGeometryLoader.getLoadProgress() * 0.5;

                    const propsLoaded = this.vertLightingLoader.getLoadProgress() * 0.25
                        + this.studioModelLoader.getLoadProgress() * 0.75;

                    this.totalLoadProgress = (visLoaded + bspLoaded + lightmapLoaded + materialsLoaded + geomLoaded + propsLoaded) / 6;

                    if (this.showDebugPanel) {
                        this.onSetDebugText("debug-loadpercent", (this.totalLoadProgress * 100).toPrecision(3));
                    }

                    if (this.totalLoadProgress >= 1) {
                        this.allLoaded = true;
                    }
                }

                this.lastProfileTime = time;
                this.frameCount = 0;
            }
        }

        protected onRenderFrame(dt: number): void {
            super.onRenderFrame(dt);

            const gl = this.context;

            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.depthFunc(gl.LEQUAL);
            gl.cullFace(gl.FRONT);

            this.mainCamera.render();
        }

        populateCommandBufferParameters(buf: WebGame.CommandBuffer): void {
            super.populateCommandBufferParameters(buf);

            this.map.populateCommandBufferParameters(buf);
        }
    }
}