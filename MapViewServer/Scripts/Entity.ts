/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class Entity
    {
        private static nextSortIndex = 0;

        private sortIndex: number;

        private position = new Vector3();
        private rotation = new Quaternion().setIdentity();
        private scale = new Vector3(1, 1, 1);

        private matrix = new Matrix4();
        private matrixInvalid = true;

        private inverseMatrix = new Matrix4();
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

        getMatrix(target?: Matrix4): void {
            if (this.matrixInvalid) {
                this.matrixInvalid = false;
                this.matrix.setRotation(this.rotation);
                this.matrix.scale(this.scale);
                this.matrix.translate(this.position);
            }

            if (target != null) target.copy(this.matrix);
        }

        getMatrixElements(): Float32Array {
            this.getMatrix();
            return this.matrix.elements;
        }

        getInverseMatrix(target?: Matrix4): void {
            if (this.inverseMatrixInvalid) {
                this.inverseMatrixInvalid = false;
                this.getMatrix();
                this.inverseMatrix.setInverse(this.matrix);
            }

            if (target != null) target.copy(this.inverseMatrix);
        }

        setPosition(value: Vector3 | Api.IVector3): void;
        setPosition(x: number, y: number, z: number): void;
        setPosition(valueOrX: Vector3 | Api.IVector3 | number, y?: number, z?: number): void
        {
            if (y !== undefined) {
                const x = valueOrX as number;
                this.position.set(x, y, z);
            } else {
                const value = valueOrX as (Vector3 | Api.IVector3);
                this.position.set(value.x, value.y, value.z);
            }
            this.invalidateMatrices();
        }

        getPosition(target: Vector3 | Api.IVector3): void {
            target.x = this.position.x;
            target.y = this.position.y;
            target.z = this.position.z;
        }

        getDistanceToBounds(bounds: Box3): number {
            return bounds.distanceToPoint(this.position);
        }

        translate(value: Vector3): void;
        translate(x: number, y: number, z: number): void;
        translate(valueOrX: Vector3 | number, y?: number, z?: number): void {
            if (typeof valueOrX === "number") {
                this.position.x += valueOrX;
                this.position.y += y;
                this.position.z += z;
            } else {
                this.position.add(valueOrX);
            }
            this.invalidateMatrices();
        }

        setRotation(value: Quaternion): void {
            this.rotation.copy(value);
            this.invalidateMatrices();
        }

        private static tempEuler = new Euler(0, 0, 0, AxisOrder.Zyx);

        setAngles(value: Vector3 | Api.IVector3): void;
        setAngles(pitch: number, yaw: number, roll: number): void;
        setAngles(valueOrPitch: Vector3 | Api.IVector3 | number, yaw?: number, roll?: number): void {
            let pitch: number;
            if (typeof valueOrPitch === "number") {
                pitch = valueOrPitch;
            } else {
                pitch = valueOrPitch.x;
                yaw = valueOrPitch.y;
                roll = valueOrPitch.z;
            }

            Entity.tempEuler.x = roll * Math.PI / 180;
            Entity.tempEuler.y = pitch * Math.PI / 180;
            Entity.tempEuler.z = yaw * Math.PI / 180;

            this.rotation.setEuler(Entity.tempEuler);
        }

        copyRotation(other: Entity): void {
            this.setRotation(other.rotation);
        }

        applyRotationTo(vector: Vector3): void {
            vector.applyQuaternion(this.rotation);
        }

        setScale(value: Vector3 | Api.IVector3 | number): void
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
