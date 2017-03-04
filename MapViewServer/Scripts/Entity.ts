/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class Entity
    {
        private static nextSortIndex = 0;

        private sortIndex: number;

        private position = new THREE.Vector3();
        private rotation = new THREE.Quaternion(0, 0, 0, 1);
        private scale = new THREE.Vector3(1, 1, 1);

        private matrix = new THREE.Matrix4();
        private matrixInvalid = true;

        private inverseMatrix = new THREE.Matrix4();
        private inverseMatrixInvalid = true;

        constructor() {
            this.sortIndex = Entity.nextSortIndex++;
        }

        compareTo(other: Entity): number {
            if (other == null) return 1;
            return this.sortIndex - other.sortIndex;
        }

        private invalidateMatrices(): void {
            this.matrixInvalid = true;
            this.inverseMatrixInvalid = true;
        }

        getMatrix(target?: THREE.Matrix4): void {
            if (this.matrixInvalid) {
                this.matrixInvalid = false;
                this.matrix.compose(this.position, this.rotation, this.scale);
            }

            if (target != null) target.copy(this.matrix);
        }

        getInverseMatrix(target?: THREE.Matrix4): void {
            if (this.inverseMatrixInvalid) {
                this.inverseMatrixInvalid = false;
                this.getMatrix();
                this.inverseMatrix.getInverse(this.matrix);
            }

            if (target != null) target.copy(this.inverseMatrix);
        }

        setPosition(value: THREE.Vector3 | Api.IVector3): void;
        setPosition(x: number, y: number, z: number): void;
        setPosition(valueOrX: THREE.Vector3 | Api.IVector3 | number, y?: number, z?: number): void
        {
            if (y !== undefined) {
                const x = valueOrX as number;
                this.position.set(x, y, z);
            } else {
                const value = valueOrX as (THREE.Vector3 | Api.IVector3);
                this.position.set(value.x, value.y, value.z);
            }
            this.invalidateMatrices();
        }

        getPosition(target: THREE.Vector3): void {
            target.copy(this.position);
        }

        translate(value: THREE.Vector3): void;
        translate(x: number, y: number, z: number): void;
        translate(valueOrX: THREE.Vector3 | number, y?: number, z?: number): void {
            if (typeof valueOrX === "number") {
                this.position.x += valueOrX;
                this.position.y += y;
                this.position.z += z;
            } else {
                this.position.add(valueOrX);
            }
            this.invalidateMatrices();
        }

        setRotation(value: THREE.Quaternion): void {
            this.rotation.copy(value);
            this.invalidateMatrices();
        }

        copyRotation(other: Entity): void {
            this.setRotation(other.rotation);
        }

        applyRotationTo(vector: THREE.Vector3): void {
            vector.applyQuaternion(this.rotation);
        }

        setScale(value: THREE.Vector3 | Api.IVector3 | number): void
        {
            if (typeof value === "number") {
                this.scale.set(value, value, value);
            } else {
                this.scale.set(value.x, value.y, value.z);
            }
            this.invalidateMatrices();
        }
    }
}
