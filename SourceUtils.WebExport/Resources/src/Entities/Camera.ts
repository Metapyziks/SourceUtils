namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface ISkyCamera extends IEntity {
            scale: number;
        }

        export class Camera extends WebGame.PerspectiveCamera {
            readonly viewer: MapViewer;

            private leaf: BspLeaf;
            private leafInvalid = true;

            render3DSky = true;

            constructor(viewer: MapViewer, fov: number) {
                super(viewer, fov, viewer.getWidth() / viewer.getHeight(), 1, 8192);

                this.viewer = viewer;
            }

            protected onChangePosition(): void {
                this.invalidateMatrices();
                this.leafInvalid = true;
            }

            protected onGetLeaf(): BspLeaf {
                const temp = Facepunch.Vector3.pool.create();
                const leaf = this.viewer.map.getLeafAt(this.getPosition(temp));
                temp.release();
                return leaf;
            }

            getLeaf(): BspLeaf {
                if (this.leafInvalid) {
                    this.leafInvalid = false;
                    const leaf = this.onGetLeaf();

                    if (this.leaf !== leaf) {
                        this.leaf = leaf;
                        this.invalidateGeometry();
                    }
                }

                return this.leaf;
            }

            render(): void {
                const leaf = this.getLeaf();

                if (this.render3DSky && leaf != null && (leaf.flags & LeafFlags.Sky) !== 0) {
                    const skyCamera = this.viewer.map.skyCamera;
                    if (skyCamera != null) {
                        skyCamera.renderRelativeTo(this);
                    }
                }

                super.render();
            }
        }

        export class SkyCamera extends Camera {
            private readonly origin: Facepunch.Vector3;
            private readonly skyScale: number;

            constructor(viewer: MapViewer, info: ISkyCamera) {
                super(viewer, 60);

                this.render3DSky = false;

                this.origin = new Facepunch.Vector3().copy(info.origin);
                this.skyScale = 1 / info.scale;
            }

            protected onChangePosition(): void {
                this.invalidateMatrices();
            }

            protected onGetLeaf(): BspLeaf {
                return this.viewer.map.getLeafAt(this.origin);
            }

            renderRelativeTo(camera: Camera): void {
                const temp = Facepunch.Vector3.pool.create();

                camera.getPosition(temp);
                temp.multiplyScalar(this.skyScale);
                temp.add(this.origin);

                this.setPosition(temp);
                temp.release();

                this.setFov(camera.getFov());
                this.setAspect(camera.getAspect());
                this.copyRotation(camera);

                super.render();

                const gl = this.viewer.context;

                gl.depthMask(true);
                gl.clear(gl.DEPTH_BUFFER_BIT);
            }
        }
    }
}