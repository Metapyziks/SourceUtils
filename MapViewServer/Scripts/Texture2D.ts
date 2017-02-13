namespace SourceUtils {
    export class Texture2D {
        private context: WebGLRenderingContext;
        private handle: WebGLTexture;
        private highestLevel = Number.MIN_VALUE;
        private lowestLevel = Number.MAX_VALUE;

        constructor(gl: WebGLRenderingContext) {
            this.context = gl;
        }

        isLoaded(): boolean {
            return this.handle !== undefined;
        }

        protected getContext(): WebGLRenderingContext {
            return this.context;
        }

        getHandle(): WebGLTexture {
            this.onGetHandle();
            return this.handle;
        }

        getHighestMipLevel(): number
        {
            return this.highestLevel;
        }

        getLowestMipLevel(): number {
            return this.lowestLevel;
        }

        protected onGetHandle(): void {}

        loadLevel(url: string, mipLevel: number, callBack?: () => void): void {
            const image = new Image();
            image.src = url;
            image.onload = () => this.onLoad(image, mipLevel, callBack);
        }

        private setupTexParams()
        {
            const gl = this.context;

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            const anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
            if (anisoExt != null) {
                gl.texParameterf(gl.TEXTURE_2D, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, 4);
            }
        }

        private getOrCreateHandle(): WebGLTexture
        {
            const gl = this.context;

            let firstTime = false;
            if (this.handle === undefined)
            {
                this.handle = gl.createTexture();
                firstTime = true;
            }

            gl.bindTexture(gl.TEXTURE_2D, this.handle);
            if (firstTime) this.setupTexParams();

            return this.handle;
        }

        protected onLoad(image: HTMLImageElement, mipLevel: number, callBack?: () => void): void {
            const gl = this.context;

            this.getOrCreateHandle();

            gl.texImage2D(gl.TEXTURE_2D, mipLevel, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            if (mipLevel > this.highestLevel) {
                this.highestLevel = mipLevel;
            }

            if (mipLevel < this.lowestLevel) {
                this.lowestLevel = mipLevel;
                if (mipLevel !== 0) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }
            }

            if (callBack != null) callBack();
        }

        protected loadPixels(width: number, height: number, values: Uint8Array): void
        {
            const gl = this.context;

            this.getOrCreateHandle();

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
        }
    }

    export class Lightmap extends Texture2D {
        constructor(gl: WebGLRenderingContext, url: string) {
            super(gl);
            this.loadLevel(url, 0);
        }
    }

    export class BlankTexture extends Texture2D {
        constructor(gl: WebGLRenderingContext, color: THREE.Color) {
            super(gl);

            this.loadPixels(1, 1, new Uint8Array([Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), 255]));
        }
    }

    export class ErrorTexture extends Texture2D {
        constructor(gl: WebGLRenderingContext) {
            super(gl);

            const resolution = 64;
            const pixels = new Uint8Array(resolution * resolution * 4);

            for (let y = 0; y < resolution; ++y)
            for (let x = 0; x < resolution; ++x) {
                if (((x * 4 / resolution) & 1) === ((y * 4 / resolution) & 1)) {
                    pixels[(x + y * resolution) * 4 + 0] = 0xff;
                    pixels[(x + y * resolution) * 4 + 2] = 0xff;
                } else {
                    pixels[(x + y * resolution) * 4 + 0] = 0x00;
                    pixels[(x + y * resolution) * 4 + 2] = 0x00;
                }

                pixels[(x + y * resolution) * 4 + 1] = 0x00;
                pixels[(x + y * resolution) * 4 + 3] = 0xff;
            }

            this.loadPixels(resolution, resolution, pixels);
        }
    }

    export class ValveTexture extends Texture2D {
        private vtfUrl: string;
        private info: Api.VtfResponse;
        private nextLevel: number;
        private usesSinceLastLoad = 0;

        constructor(gl: WebGLRenderingContext, url: string) {
            super(gl);
            this.vtfUrl = url;
        }

        protected onGetHandle(): void {
            ++this.usesSinceLastLoad;
        }

        getUsesSinceLastLoad(): number {
            return this.usesSinceLastLoad;
        }

        loadNext(callback: (requeue: boolean) => void): void {
            this.usesSinceLastLoad = 0;

            if (this.info == null) {
                this.loadInfo(() => callback(true));
                return;
            }

            this.loadLevel(this.info.pngUrl.replace("{mipmap}", this.nextLevel.toString()), this.nextLevel,
                () => {
                    --this.nextLevel;
                    callback(this.nextLevel >= 0);
                });
        }

        protected onLoad(image: HTMLImageElement, mipLevel: number, callBack?: () => void): void {
            super.onLoad(image, mipLevel);

            if (this.getLowestMipLevel() === 0 && this.getHighestMipLevel() === this.info.mipmaps - 1 && this.info.width === this.info.height)
            {
                const gl = this.getContext();
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }

            if (callBack != null) callBack();
        }

        private loadInfo(callback?: () => void): void {
            $.getJSON(this.vtfUrl,
                (data: Api.VtfResponse) => {
                    this.info = data;
                    this.nextLevel = Math.max(0, data.mipmaps - 1);
                    if (callback != null) callback();
                });
        }
    }
}