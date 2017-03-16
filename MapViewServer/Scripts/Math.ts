namespace SourceUtils
{
    export class Vector2 {
        x: number;
        y: number;

        constructor(x?: number, y?: number) {
            this.x = x || 0;
            this.y = y || 0;
        }

        set(x: number, y: number): this {
            this.x = x;
            this.y = y;
            return this;
        }

        sub(vec: Vector2): this {
            this.x -= vec.x;
            this.y -= vec.y;
            return this;
        }

        multiplyScalar(val: number): this {
            this.x *= val;
            this.y *= val;
            return this;
        }

        copy(vec: Vector2): this {
            this.x = vec.x;
            this.y = vec.y;
            return this;
        }
    }

    export class Vector3 {
        x: number;
        y: number;
        z: number;

        constructor(x?: number, y?: number, z?: number) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }

        length(): number {
            const x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        }

        lengthSq(): number {
            const x = this.x, y = this.y, z = this.z;
            return x * x + y * y + z * z;
        }

        set(x: number, y: number, z: number): this {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        }

        add(vec: Vector3): this {
            this.x += vec.x;
            this.y += vec.y;
            this.z += vec.z;
            return this;
        }

        multiplyScalar(val: number): this
        {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            return this;
        }

        dot(vec: Vector3): number {
            return this.x * vec.x + this.y * vec.y + this.z * vec.z;
        }

        copy(vec: Vector3): this {
            this.x = vec.x;
            this.y = vec.y;
            this.z = vec.z;
            return this;
        }

        applyQuaternion(quat: Quaternion): this {
            // From https://github.com/mrdoob/three.js

            const x = this.x, y = this.y, z = this.z;
            const qx = quat.x, qy = quat.y, qz = quat.z, qw = quat.w;

            // calculate quat * vector

            const ix = qw * x + qy * z - qz * y;
            const iy = qw * y + qz * x - qx * z;
            const iz = qw * z + qx * y - qy * x;
            const iw = - qx * x - qy * y - qz * z;

            // calculate result * inverse quat

            this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
            this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
            this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

            return this;
        }

        setNormal(vec: Vector3): this {
            const len = 1 / vec.length();
            this.x = vec.x * len;
            this.y = vec.y * len;
            this.z = vec.z * len;
            return this;
        }
    }

    export class Vector4 {
        x: number;
        y: number;
        z: number;
        w: number;

        constructor(x?: number, y?: number, z?: number, w?: number) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = w || 0;
        }

        applyMatrix4(mat: Matrix4): this {
            const x = this.x, y = this.y, z = this.z, w = this.w;
            const m = mat.elements;

            this.x = m[0x0] * x + m[0x4] * y + m[0x8] * z + m[0xc] * w;
            this.y = m[0x1] * x + m[0x5] * y + m[0x9] * z + m[0xd] * w;
            this.z = m[0x2] * x + m[0x6] * y + m[0xa] * z + m[0xe] * w;
            this.w = m[0x3] * x + m[0x7] * y + m[0xb] * z + m[0xf] * w;

            return this;
        }
    }

    export class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;

        constructor(x?: number, y?: number, z?: number, w?: number) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = w || 0;
        }

        copy(quat: Quaternion): this {
            this.x = quat.x;
            this.y = quat.y;
            this.z = quat.z;
            this.w = quat.w;
            return this;
        }

        setIdentity(): this {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
            return this;
        }

        setAxisAngle(axis: Vector3, angle: number): this {
            // From https://github.com/mrdoob/three.js

            const halfAngle = angle * 0.5, s = Math.sin(halfAngle);

            this.x = axis.x * s;
            this.y = axis.y * s;
            this.z = axis.z * s;
            this.w = Math.cos(halfAngle);

            return this;
        }

        multiply(quat: Quaternion): this {
            // From https://github.com/mrdoob/three.js

            const qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
            const qbx = quat.x, qby = quat.y, qbz = quat.z, qbw = quat.w;

            this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
            this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
            this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
            this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

            return this;
        }

        setEuler(euler: Euler): this {
            // From https://github.com/mrdoob/three.js

            const x = euler.x;
            const y = euler.y;
            const z = euler.z;
            const order = euler.order;

            const cos = Math.cos;
            const sin = Math.sin;

            const c1 = cos(x * 0.5);
            const c2 = cos(y * 0.5);
            const c3 = cos(z * 0.5);

            const s1 = sin(x * 0.5);
            const s2 = sin(y * 0.5);
            const s3 = sin(z * 0.5);

            this.x = s1 * c2 * c3 + c1 * s2 * s3 * ((order & 1) !== 0 ? 1 : -1);
            this.y = c1 * s2 * c3 + s1 * c2 * s3 * ((order & 2) !== 0 ? 1 : -1);
            this.z = c1 * c2 * s3 + s1 * s2 * c3 * ((order & 4) !== 0 ? 1 : -1);
            this.w = c1 * c2 * c3 + s1 * s2 * s3 * ((order & 8) !== 0 ? 1 : -1);

            return this;
        }
    }

    export enum AxisOrder {
        Xyz = 0x5, // 1010
        Xzy = 0xc, // 0011
        Yxz = 0x9, // 1001
        Yzx = 0x3, // 1100
        Zxy = 0x6, // 0110
        Zyx = 0xa  // 0101
    }

    export class Euler {
        x: number;
        y: number;
        z: number;
        order: AxisOrder;

        constructor(x?: number, y?: number, z?: number, order?: AxisOrder) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.order = order || AxisOrder.Xyz;
        }
    }

    export class Plane {
        normal = new Vector3();
        distance: number;

        constructor(normal: Vector3, distance: number) {
            this.normal.setNormal(normal);
            this.distance = distance;
        }
    }

    export class Box3 {
        min = new Vector3();
        max = new Vector3();

        constructor(min?: Vector3, max?: Vector3) {
            if (min !== undefined) this.min.copy(min);
            if (max !== undefined) this.max.copy(max);
        }

        copy(box: Box3): this {
            this.min.copy(box.min);
            this.max.copy(box.max);
            return this;
        }

        distanceToPoint(vec: Vector3): number {
            const minX = Math.max(0, this.min.x - vec.x, vec.x - this.max.x);
            const minY = Math.max(0, this.min.y - vec.y, vec.y - this.max.y);
            const minZ = Math.max(0, this.min.z - vec.z, vec.z - this.max.z);
            return Math.sqrt(minX * minX + minY * minY + minZ * minZ);
        }
    }

    export class Matrix4 {
        elements: Float32Array = new Float32Array(4 * 4);

        setIdentity(): this {
            const m = this.elements;
            m[0x0] = 1; m[0x1] = 0; m[0x2] = 0; m[0x3] = 0;
            m[0x4] = 0; m[0x5] = 1; m[0x6] = 0; m[0x7] = 0;
            m[0x8] = 0; m[0x9] = 0; m[0xa] = 1; m[0xb] = 0;
            m[0xc] = 0; m[0xd] = 0; m[0xe] = 0; m[0xf] = 1;
            return this;
        }

        copy(mat: Matrix4): this {
            const m = mat.elements;
            const n = this.elements;

            for (let i = 0; i < 16; ++i) n[i] = m[i];

            return this;
        }

        setRotation(rotation: Quaternion): this {
            const m = this.elements;

            // From https://github.com/mrdoob/three.js

            const x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
            const x2 = x + x, y2 = y + y, z2 = z + z;
            const xx = x * x2, xy = x * y2, xz = x * z2;
            const yy = y * y2, yz = y * z2, zz = z * z2;
            const wx = w * x2, wy = w * y2, wz = w * z2;

            m[0] = 1 - (yy + zz);
            m[4] = xy - wz;
            m[8] = xz + wy;

            m[1] = xy + wz;
            m[5] = 1 - (xx + zz);
            m[9] = yz - wx;

            m[2] = xz - wy;
            m[6] = yz + wx;
            m[10] = 1 - (xx + yy);

            m[3] = 0;
            m[7] = 0;
            m[11] = 0;

            m[12] = 0;
            m[13] = 0;
            m[14] = 0;
            m[15] = 1;

            return this;
        }

        scale(vec: Vector3): this {
            const m = this.elements;
            const x = vec.x, y = vec.y, z = vec.z;

            m[0x0] *= x; m[0x1] *= x; m[0x2] *= x; m[0x3] *= x;
            m[0x4] *= y; m[0x5] *= y; m[0x6] *= y; m[0x7] *= y;
            m[0x8] *= z; m[0x9] *= z; m[0xa] *= z; m[0xb] *= z;

            return this;
        }

        translate(vec: Vector3): this {
            const m = this.elements;

            m[0xc] += vec.x;
            m[0xd] += vec.y;
            m[0xe] += vec.z;

            return this;
        }

        setPerspective(fov: number, aspect: number, near: number, far: number): this {
            const top = near * Math.tan(0.5 * fov),
                height = 2 * top,
                width = aspect * height,
                left = - 0.5 * width,
                right = left + width,
                bottom = -top;

            // From https://github.com/mrdoob/three.js

            const m = this.elements;
            const x = 2 * near / width;
            const y = 2 * near / height;

            const a = (right + left) / (right - left);
            const b = (top + bottom) / (top - bottom);
            const c = - (far + near) / (far - near);
            const d = - 2 * far * near / (far - near);

            m[0x0] = x; m[0x4] = 0; m[0x8] = a;  m[0xc] = 0;
            m[0x1] = 0; m[0x5] = y; m[0x9] = b;  m[0xd] = 0;
            m[0x2] = 0; m[0x6] = 0; m[0xa] = c;  m[0xe] = d;
            m[0x3] = 0; m[0x7] = 0; m[0xb] = -1; m[0xf] = 0;

            return this;
        }

        setInverse(from: Matrix4): this {
            const m = from.elements;
            const inv = this.elements;

            // From http://stackoverflow.com/a/1148405

            inv[0] = m[5] * m[10] * m[15] -
                m[5] * m[11] * m[14] -
                m[9] * m[6] * m[15] +
                m[9] * m[7] * m[14] +
                m[13] * m[6] * m[11] -
                m[13] * m[7] * m[10];

            inv[4] = -m[4] * m[10] * m[15] +
                m[4] * m[11] * m[14] +
                m[8] * m[6] * m[15] -
                m[8] * m[7] * m[14] -
                m[12] * m[6] * m[11] +
                m[12] * m[7] * m[10];

            inv[8] = m[4] * m[9] * m[15] -
                m[4] * m[11] * m[13] -
                m[8] * m[5] * m[15] +
                m[8] * m[7] * m[13] +
                m[12] * m[5] * m[11] -
                m[12] * m[7] * m[9];

            inv[12] = -m[4] * m[9] * m[14] +
                m[4] * m[10] * m[13] +
                m[8] * m[5] * m[14] -
                m[8] * m[6] * m[13] -
                m[12] * m[5] * m[10] +
                m[12] * m[6] * m[9];

            inv[1] = -m[1] * m[10] * m[15] +
                m[1] * m[11] * m[14] +
                m[9] * m[2] * m[15] -
                m[9] * m[3] * m[14] -
                m[13] * m[2] * m[11] +
                m[13] * m[3] * m[10];

            inv[5] = m[0] * m[10] * m[15] -
                m[0] * m[11] * m[14] -
                m[8] * m[2] * m[15] +
                m[8] * m[3] * m[14] +
                m[12] * m[2] * m[11] -
                m[12] * m[3] * m[10];

            inv[9] = -m[0] * m[9] * m[15] +
                m[0] * m[11] * m[13] +
                m[8] * m[1] * m[15] -
                m[8] * m[3] * m[13] -
                m[12] * m[1] * m[11] +
                m[12] * m[3] * m[9];

            inv[13] = m[0] * m[9] * m[14] -
                m[0] * m[10] * m[13] -
                m[8] * m[1] * m[14] +
                m[8] * m[2] * m[13] +
                m[12] * m[1] * m[10] -
                m[12] * m[2] * m[9];

            inv[2] = m[1] * m[6] * m[15] -
                m[1] * m[7] * m[14] -
                m[5] * m[2] * m[15] +
                m[5] * m[3] * m[14] +
                m[13] * m[2] * m[7] -
                m[13] * m[3] * m[6];

            inv[6] = -m[0] * m[6] * m[15] +
                m[0] * m[7] * m[14] +
                m[4] * m[2] * m[15] -
                m[4] * m[3] * m[14] -
                m[12] * m[2] * m[7] +
                m[12] * m[3] * m[6];

            inv[10] = m[0] * m[5] * m[15] -
                m[0] * m[7] * m[13] -
                m[4] * m[1] * m[15] +
                m[4] * m[3] * m[13] +
                m[12] * m[1] * m[7] -
                m[12] * m[3] * m[5];

            inv[14] = -m[0] * m[5] * m[14] +
                m[0] * m[6] * m[13] +
                m[4] * m[1] * m[14] -
                m[4] * m[2] * m[13] -
                m[12] * m[1] * m[6] +
                m[12] * m[2] * m[5];

            inv[3] = -m[1] * m[6] * m[11] +
                m[1] * m[7] * m[10] +
                m[5] * m[2] * m[11] -
                m[5] * m[3] * m[10] -
                m[9] * m[2] * m[7] +
                m[9] * m[3] * m[6];

            inv[7] = m[0] * m[6] * m[11] -
                m[0] * m[7] * m[10] -
                m[4] * m[2] * m[11] +
                m[4] * m[3] * m[10] +
                m[8] * m[2] * m[7] -
                m[8] * m[3] * m[6];

            inv[11] = -m[0] * m[5] * m[11] +
                m[0] * m[7] * m[9] +
                m[4] * m[1] * m[11] -
                m[4] * m[3] * m[9] -
                m[8] * m[1] * m[7] +
                m[8] * m[3] * m[5];

            inv[15] = m[0] * m[5] * m[10] -
                m[0] * m[6] * m[9] -
                m[4] * m[1] * m[10] +
                m[4] * m[2] * m[9] +
                m[8] * m[1] * m[6] -
                m[8] * m[2] * m[5];

            let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

            if (det === 0) throw new Error("Matrix is not invertible.");

            det = 1.0 / det;

            for (let i = 0; i < 16; ++i) inv[i] *= det;
            return this;
        }
    }
}