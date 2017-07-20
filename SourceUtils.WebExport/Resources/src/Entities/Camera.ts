namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface ISkyCamera extends IEnvFogController {
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
                    const leaf = this.onGetLeaf();
                    this.leafInvalid = leaf !== undefined;

                    if (this.leaf !== leaf) {
                        this.leaf = leaf;
                        this.invalidateGeometry();
                    }
                }

                return this.leaf;
            }

            protected onPopulateDrawList(drawList: Facepunch.WebGame.DrawList): void {
                this.viewer.map.populateDrawList(drawList, this.getLeaf());
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

                if (info.fogEnabled) {
                    this.fog.start = info.fogStart;
                    this.fog.end = info.fogEnd;
                    this.fog.maxDensity = info.fogMaxDensity;
                    this.fog.color.set(info.fogColor.r, info.fogColor.g, info.fogColor.b);

                    if (info.farZ !== 0) this.setFar(info.farZ);
                }
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

        export class ShadowCamera extends WebGame.OrthographicCamera {
            readonly viewer: MapViewer;

            private readonly targetCamera: Camera;

            constructor(viewer: MapViewer, targetCamera: Camera) {
                super(viewer, 1, 1, 0, 1);

                this.viewer = viewer;
                this.targetCamera = targetCamera;
            }

            protected onPopulateDrawList(drawList: Facepunch.WebGame.DrawList): void {
                this.viewer.map.populateDrawList(drawList, this.targetCamera.getLeaf());
            }

            private addToFrustrumBounds(invLight: Facepunch.Quaternion, vec: Facepunch.Vector4, bounds: Facepunch.Box3): void {
                vec.applyMatrix4(this.targetCamera.getMatrix());
                vec.applyQuaternion(invLight);
            }

            private getFrustumBounds(lightRotation: Facepunch.Quaternion, near: number, far: number, bounds: Facepunch.Box3): void {
                bounds.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                bounds.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

                const yScale = Math.tan(this.targetCamera.getFov() * 0.5);
                const xScale = yScale * this.targetCamera.getAspect();

                const xNear = xScale * near;
                const yNear = yScale * near;

                const xFar = xScale * far;
                const yFar = yScale * far;

                const vec = Facepunch.Vector4.pool.create();
                const invLight = Facepunch.Quaternion.pool.create();

                invLight.setInverse(lightRotation);

                this.addToFrustrumBounds(invLight, vec.set( xNear,  yNear, near, 1), bounds);
                this.addToFrustrumBounds(invLight, vec.set(-xNear,  yNear, near, 1), bounds);
                this.addToFrustrumBounds(invLight, vec.set( xNear, -yNear, near, 1), bounds);
                this.addToFrustrumBounds(invLight, vec.set(-xNear, -yNear, near, 1), bounds);
                
                this.addToFrustrumBounds(invLight, vec.set( xFar,  yFar, far, 1), bounds);
                this.addToFrustrumBounds(invLight, vec.set(-xFar,  yFar, far, 1), bounds);
                this.addToFrustrumBounds(invLight, vec.set( xFar, -yFar, far, 1), bounds);
                this.addToFrustrumBounds(invLight, vec.set(-xFar, -yFar, far, 1), bounds);

                vec.release();
                invLight.release();
            }

            renderShadows(lightRotation: Facepunch.Quaternion, near: number, far: number): void {
                const bounds = Facepunch.Box3.pool.create();

                this.getFrustumBounds(lightRotation, near, far, bounds);

                bounds.release();
            }
        }
    }
}