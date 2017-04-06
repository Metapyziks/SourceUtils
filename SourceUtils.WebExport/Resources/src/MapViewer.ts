/// <reference path="../js/facepunch.webgame.d.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export class MapViewer extends WebGame.Game {
        private mainCamera: WebGame.PerspectiveCamera;
        private mainCameraLeaf: BspLeaf;
        private mainRenderContext: WebGame.RenderContext;

        readonly map = new Map(this);
        readonly leafGeometryLoader = this.addLoader(new LeafGeometryLoader(this));
        readonly bspModelLoader = this.addLoader(new BspModelLoader(this));
        readonly visLoader = this.addLoader(new VisLoader());

        private time = 0;

        loadMap(url: string): void {
            this.map.load(url);
        }

        protected onInitialize(): void {

            this.canLockPointer = true;

            this.mainCamera = new WebGame.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 1, 8192);
            this.mainRenderContext = new WebGame.RenderContext(this);

            super.onInitialize();

            const gl = this.context;

            gl.clearColor(0.675, 0.75, 0.5, 1.0);
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

            const leaf = this.map.getLeafAt(this.mainCamera.getPosition(this.move));

            if (leaf !== this.mainCameraLeaf) {
                this.mainCameraLeaf = leaf;
                this.mainRenderContext.invalidate();
            }
        }

        protected onRenderFrame(dt: number): void {
            super.onRenderFrame(dt);

            const gl = this.context;

            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.cullFace(gl.FRONT);

            this.mainRenderContext.render(this.mainCamera);
        }

        populateDrawList(drawList: WebGame.DrawList, camera: WebGame.Camera): void {
            this.map.populateDrawList(drawList, this.mainCameraLeaf);
        }

        populateCommandBufferParameters(buf: WebGame.CommandBuffer): void {
            super.populateCommandBufferParameters(buf);

            this.map.populateCommandBufferParameters(buf);
        }
    }
}