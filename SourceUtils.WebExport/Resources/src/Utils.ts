namespace SourceUtils {
    export class ColorConversion {
        private static lastScreenGamma: number;
        private static linearToScreenGammaTable: number[];

        private static exponentTable: number[];

        public static initialize(screenGamma: number): void {
            if (this.exponentTable == null) {
                const table = this.exponentTable = new Array<number>(256);
                for (let i = 0; i < 256; ++i) {
                    table[i] = Math.pow(2.0, i - 128);
                }
            }

            if (this.lastScreenGamma !== screenGamma) {
                this.lastScreenGamma = screenGamma;

                const g = 1.0 / screenGamma;

                const table = this.linearToScreenGammaTable = new Array<number>(1024);
                for (let i = 0; i < 1024; ++i) {
                    const f = i / 1023;
                    const inf = Math.floor(255 * Math.pow(f, g));
                    table[i] = inf < 0 ? 0 : inf > 255 ? 255 : inf;
                }
            }
        }

        public static rgbExp32ToVector3(rgbExp: number, out: Facepunch.IVector3): Facepunch.IVector3 {
            if (out == null) out = new Facepunch.Vector3();

            const r = (rgbExp >> 0) & 0xff;
            const g = (rgbExp >> 8) & 0xff;
            const b = (rgbExp >> 16) & 0xff;
            const exp = (rgbExp >> 24) & 0xff;

            const mul = this.exponentTable[exp];

            out.x = r * mul;
            out.y = g * mul;
            out.z = b * mul;

            return out;
        }

        public static linearToScreenGamma(f: number): number {
            let index = Math.floor(f * 1023);
            if (index < 0) index = 0;
            else if (index > 1023) index = 1023;

            return this.linearToScreenGammaTable[index];
        }
    }

    ColorConversion.initialize(2.2);
}
