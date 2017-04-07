/// <reference path="../js/facepunch.webgame.d.ts"/>
/// <reference path="../js/jquery.d.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export class MapViewer extends WebGame.Game {
        mainCamera: Entities.Camera;

        readonly map = new Map(this);
        readonly leafGeometryLoader = this.addLoader(new LeafGeometryLoader(this));
        readonly dispGeometryLoader = this.addLoader(new DispGeometryLoader(this));
        readonly mapMaterialLoader = this.addLoader(new MapMaterialLoader(this));
        readonly bspModelLoader = this.addLoader(new BspModelLoader(this));
        readonly visLoader = this.addLoader(new VisLoader());

        private time = 0;
        private frameCount = 0;
        private lastProfileTime: number;
        private lastDrawCalls: number;

        loadMap(url: string): void {
            this.map.load(url);
        }

        protected onInitialize(): void {
            this.canLockPointer = true;

            this.mainCamera = new Entities.Camera(this, 75);

            this.lastProfileTime = performance.now();

            super.onInitialize();
        }

        protected onResize(): void {
            super.onResize();

            this.mainCamera.setAspect(this.getWidth() / this.getHeight());
        }

        private readonly lookAngs = new Facepunch.Vector2();
        private readonly tempQuat = new Facepunch.Quaternion();
        private readonly lookQuat = new Facepunch.Quaternion();

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

            if (this.isPointerLocked()) {
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
            } else {
                this.time += dt;

                const ang = this.time * Math.PI / 15;
                const height = Math.sin(this.time * Math.PI / 4) * 96 + 256;
                const radius = 512;

                this.lookAngs.set(ang, Math.atan2(128 - height, radius));
                this.updateCameraAngles();

                this.mainCamera.setPosition(Math.sin(-ang) * -radius, Math.cos(-ang) * -radius, height);
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

                this.lastProfileTime = time;
                this.frameCount = 0;
            }
        }

        populateDrawList(drawList: WebGame.DrawList, camera: WebGame.Camera): void {
            let leaf: BspLeaf = null;
            if ((camera as Entities.Camera).getLeaf !== undefined) {
                leaf = (camera as Entities.Camera).getLeaf();
            }

            this.map.populateDrawList(drawList, leaf);
        }

        populateCommandBufferParameters(buf: WebGame.CommandBuffer): void {
            super.populateCommandBufferParameters(buf);

            this.map.populateCommandBufferParameters(buf);
        }
    }
}