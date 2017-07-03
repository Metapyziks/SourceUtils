/// <reference path="../js/facepunch.webgame.d.ts"/>
/// <reference path="../js/jquery.d.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export class MapViewer extends WebGame.Game {
        mainCamera: Entities.Camera;

        readonly map = new Map(this);
        readonly visLoader = this.addLoader(new VisLoader());
        readonly bspModelLoader = this.addLoader(new BspModelLoader(this));
        readonly mapMaterialLoader = this.addLoader(new MapMaterialLoader(this));
        readonly leafGeometryLoader = this.addLoader(new LeafGeometryLoader(this));
        readonly dispGeometryLoader = this.addLoader(new DispGeometryLoader(this));
        readonly studioModelLoader = this.addLoader(new StudioModelLoader(this));
        readonly vertLightingLoader = this.addLoader(new VertexLightingLoader(this));

        private time = 0;
        private frameCount = 0;
        private lastProfileTime: number;
        private lastDrawCalls: number;
        private allLoaded = false;

        loadMap(url: string): void {
            this.map.load(url);
        }

        protected onInitialize(): void {
            this.canLockPointer = true;

            this.mainCamera = new Entities.Camera(this, 75);

            this.lastProfileTime = performance.now();

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

        protected onDeviceRotate(deltaAngles: Facepunch.Vector3): void {
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

            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.updateCameraAngles();
        }

        private toggleFullscreen(): void {
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

        protected onKeyDown(key: WebGame.Key): void {
            super.onKeyDown(key);

            if (key === WebGame.Key.F) {
                this.toggleFullscreen();
            }
        }

        private readonly move = new Facepunch.Vector3();

        protected onUpdateFrame(dt: number): void {
            super.onUpdateFrame(dt);

            if (!this.isPointerLocked()) return;

            this.move.set(0, 0, 0);
            const moveSpeed = 512 * dt;

            if (this.isKeyDown(WebGame.Key.W)) this.move.z -= moveSpeed;
            if (this.isKeyDown(WebGame.Key.S)) this.move.z += moveSpeed;
            if (this.isKeyDown(WebGame.Key.A)) this.move.x -= moveSpeed;
            if (this.isKeyDown(WebGame.Key.D)) this.move.x += moveSpeed;

            if (this.move.lengthSq() > 0) {
                this.mainCamera.applyRotationTo(this.move);
                this.mainCamera.translate(this.move);
            }
        }

        protected onRenderFrame(dt: number): void {
            super.onRenderFrame(dt);

            const gl = this.context;

            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.cullFace(gl.FRONT);

            this.mainCamera.render();

            const drawCalls = this.mainCamera.getDrawCalls();
            if (drawCalls !== this.lastDrawCalls) {
                this.lastDrawCalls = drawCalls;
                $("#debug-drawcalls").text(drawCalls);
            }

            ++this.frameCount;
            const time = performance.now();

            if (time - this.lastProfileTime >= 500) {

                const timeDiff = (time - this.lastProfileTime) / 1000;
                const frameTime = (timeDiff * 1000 / this.frameCount).toPrecision(4);
                const frameRate = (this.frameCount / timeDiff).toPrecision(4);

                $("#debug-frametime").text(frameTime);
                $("#debug-framerate").text(frameRate);

                if (!this.allLoaded) {
                    const visLoaded = this.visLoader.getLoadProgress();
                    const bspLoaded = this.bspModelLoader.getLoadProgress();
                    const lightmapLoaded = this.map.getLightmapLoadProgress();
                    const materialsLoaded = this.mapMaterialLoader.getLoadProgress();

                    const geomLoaded = this.leafGeometryLoader.getLoadProgress() * 0.5
                        + this.dispGeometryLoader.getLoadProgress() * 0.5;

                    const propsLoaded = this.vertLightingLoader.getLoadProgress() * 0.25
                        + this.studioModelLoader.getLoadProgress() * 0.75;

                    $("#debug-visloaded").text((visLoaded * 100).toPrecision(3));
                    $("#debug-bsploaded").text((bspLoaded * 100).toPrecision(3));
                    $("#debug-geomloaded").text((geomLoaded * 100).toPrecision(3));
                    $("#debug-propsloaded").text((propsLoaded * 100).toPrecision(3));
                    $("#debug-lightmaploaded").text((lightmapLoaded * 100).toPrecision(3));
                    $("#debug-materialsloaded").text((materialsLoaded * 100).toPrecision(3));

                    if (visLoaded * bspLoaded * lightmapLoaded * materialsLoaded * geomLoaded * propsLoaded === 1) {
                        this.allLoaded = true;
                        $("#debug-loading").hide();
                    }
                }

                this.lastProfileTime = time;
                this.frameCount = 0;
            }
        }

        populateDrawList(drawList: WebGame.DrawList, camera: WebGame.Camera): void {
            let leaf: BspLeaf = null;
            let sky2D = false;
            if ((camera as Entities.Camera).getLeaf !== undefined) {
                const mapCamera = camera as Entities.Camera;
                leaf = mapCamera.getLeaf();
            }

            this.map.populateDrawList(drawList, leaf);
        }

        populateCommandBufferParameters(buf: WebGame.CommandBuffer): void {
            super.populateCommandBufferParameters(buf);

            this.map.populateCommandBufferParameters(buf);
        }
    }
}