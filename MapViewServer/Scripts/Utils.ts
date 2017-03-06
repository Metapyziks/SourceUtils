/// <reference path="typings/lz-string/lz-string.d.ts"/>

namespace SourceUtils {
    export class Utils {
        static decompressFloat32Array(value: string | number[]): Float32Array {
            return new Float32Array(Utils.decompress(value));
        }

        static decompressUint16Array(value: string | number[]): Uint16Array
        {
            return new Uint16Array(Utils.decompress(value));
        }

        static decompressUint32Array(value: string | number[]): Uint32Array {
            return new Uint32Array(Utils.decompress(value));
        }

        static decompress<T>(value: string | T): T {
            if (value == null) return null;
            return typeof value === "string"
                ? JSON.parse(LZString.decompressFromBase64(value))
                : value as T;
        }
    }
}