namespace SourceUtils
{
    export class Camera extends Entity {
        private projectionInvalid = true;
        private projectionMatrix = new Matrix4();
        private drawList: DrawList;

        getProjectionMatrix(target: Matrix4): void {
            if (this.projectionInvalid) {
                this.projectionInvalid = false;
                this.onUpdateProjectionMatrix(this.projectionMatrix);
            }

            target.copy(this.projectionMatrix);
        }

        protected invalidateProjectionMatrix(): void {
            this.projectionInvalid = true;
        }

        protected onUpdateProjectionMatrix(matrix: Matrix4): void {
            throw "Method 'onUpdateProjectionMatrix' not implemented.";
        }
    }

    export class PerspectiveCamera extends Camera {
        private fov: number;
        private aspect: number;
        private near: number;
        private far: number;

        constructor(fov: number, aspect: number, near: number, far: number) {
            super();

            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
        }

        setFov(value: number): void { this.fov = value; this.invalidateProjectionMatrix(); }
        getFov(): number { return this.fov; }

        setAspect(value: number): void { this.aspect = value; this.invalidateProjectionMatrix(); }
        getAspect(): number { return this.aspect; }

        setNear(value: number): void { this.near = value; this.invalidateProjectionMatrix(); }
        getNear(): number { return this.near; }

        setFar(value: number): void { this.far = value; this.invalidateProjectionMatrix(); }
        getFar(): number { return this.far; }

        protected onUpdateProjectionMatrix(matrix: Matrix4): void {
            const deg2Rad = Math.PI / 180;
            matrix.setPerspective(deg2Rad * this.fov, this.aspect, this.near, this.far);
        }
    }
}