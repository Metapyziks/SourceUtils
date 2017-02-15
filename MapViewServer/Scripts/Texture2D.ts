namespace SourceUtils {
    export class Texture {
        private target: number;
        private context: WebGLRenderingContext;
        private handle: WebGLTexture;
        private highestLevel = Number.MIN_VALUE;
        private lowestLevel = Number.MAX_VALUE;

        constructor(gl: WebGLRenderingContext, target: number) {
            this.context = gl;
            this.target = target;
        }

        isLoaded(): boolean {
            return this.getHandle() !== undefined;
        }

        protected getContext(): WebGLRenderingContext {
            return this.context;
        }

        getHandle(): WebGLTexture {
            this.onGetHandle();
            return this.handle;
        }

        getHighestMipLevel(): number {
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

        protected setupTexParams(target: number) {
            const gl = this.context;

            gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            const anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
            if (anisoExt != null) {
                gl.texParameterf(target, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, 4);
            }
        }

        protected getOrCreateHandle(): WebGLTexture {
            const gl = this.context;

            let firstTime = false;
            if (this.handle === undefined) {
                this.handle = gl.createTexture();
                firstTime = true;
            }

            gl.bindTexture(this.target, this.handle);
            if (firstTime) this.setupTexParams(this.target);

            return this.handle;
        }

        protected onLoad(image: HTMLImageElement, mipLevel: number, callBack?: () => void): void {
            const gl = this.context;

            this.getOrCreateHandle();

            gl.texImage2D(this.target, mipLevel, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            if (mipLevel > this.highestLevel) {
                this.highestLevel = mipLevel;
            }

            if (mipLevel < this.lowestLevel) {
                this.lowestLevel = mipLevel;
                if (mipLevel !== 0) {
                    gl.texImage2D(this.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }
            }

            if (callBack != null) callBack();
        }

        protected loadPixels(width: number, height: number, values: Uint8Array): void {
            const gl = this.context;

            this.getOrCreateHandle();

            gl.texImage2D(this.target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
        }
    }

    export class Lightmap extends Texture {
        constructor(gl: WebGLRenderingContext, url: string) {
            super(gl, gl.TEXTURE_2D);
            this.loadLevel(url, 0);
        }
    }

    export class BlankTexture extends Texture {
        constructor(gl: WebGLRenderingContext, color: THREE.Color) {
            super(gl, gl.TEXTURE_2D);

            this.loadPixels(1,
                1,
                new Uint8Array([Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), 255]));
        }
    }

    export class ErrorTexture extends Texture {
        constructor(gl: WebGLRenderingContext) {
            super(gl, gl.TEXTURE_2D);

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

    export class ValveTexture extends Texture {
        private usesSinceLastLoad = 0;

        constructor(gl: WebGLRenderingContext, target: number) {
            super(gl, target);
        }

        protected onGetHandle(): void {
            ++this.usesSinceLastLoad;
        }

        getUsesSinceLastLoad(): number {
            return this.usesSinceLastLoad;
        }

        loadNext(callback: (requeue: boolean) => void): void {
            this.usesSinceLastLoad = 0;
        }
    }

    export class ValveTexture2D extends ValveTexture {
        private vtfUrl: string;
        private info: Api.VtfResponse;
        private nextLevel: number;

        constructor(gl: WebGLRenderingContext, url: string) {
            super(gl, gl.TEXTURE_2D);
            this.vtfUrl = url;
        }

        loadNext(callback: (requeue: boolean) => void): void {
            super.loadNext(null);

            if (this.info == null) {
                this.loadInfo(() => callback(true));
                return;
            }

            this.loadLevel(this.info.pngUrl.replace("{mipmap}", this.nextLevel.toString()),
                this.nextLevel,
                () => {
                    --this.nextLevel;
                    callback(this.nextLevel >= 0);
                });
        }

        private loadInfo(callback?: () => void): void {
            $.getJSON(this.vtfUrl,
                (data: Api.VtfResponse) => {
                    this.info = data;
                    this.nextLevel = Math.max(0, data.mipmaps - 1);
                }).always(() => {
                if (callback != null) callback();
            });
        }

        protected onLoad(image: HTMLImageElement, mipLevel: number, callBack?: () => void): void {
            super.onLoad(image, mipLevel);

            if (this.getLowestMipLevel() === 0 &&
                this.getHighestMipLevel() === this.info.mipmaps - 1 &&
                this.info.width === this.info.height) {
                const gl = this.getContext();
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }

            if (callBack != null) callBack();
        }
    }

    export class ValveTextureCube extends ValveTexture {
        private vtfUrls: string[];
        private infos: Api.VtfResponse[] = [];
        private loadedInfo = false;
        private faceSize: number;
        private nextFace = 0;

        constructor(gl: WebGLRenderingContext, urls: string[]) {
            super(gl, gl.TEXTURE_CUBE_MAP);
            this.vtfUrls = urls;
        }

        isLoaded(): boolean { return super.isLoaded() && this.loadedInfo && this.nextFace >= 6; }

        loadNext(callback: (requeue: boolean) => void): void {
            super.loadNext(null);

            if (!this.loadedInfo) {
                this.loadInfo(this.nextFace, success => callback(success));
                return;
            }

            this.loadLevel(this.infos[this.nextFace].pngUrl.replace("{mipmap}", "0"),
                this.nextFace,
                () => {
                    ++this.nextFace;
                    callback(this.nextFace < 6);
                });
        }

        private loadInfo(face: number, callback?: (success: boolean) => void): void {
            $.getJSON(this.vtfUrls[face],
                (data: Api.VtfResponse) => {
                    this.infos[face] = data;
                    this.nextFace++;

                    if (this.nextFace >= 6) {
                        this.nextFace = 0;
                        this.faceSize = this.infos[0].width;
                        this.loadedInfo = true;
                    }
                    if (callback != null) callback(true);
                }).fail(() => {
                    if (callback != null) callback(false);
                });
        }

        setupTexParams(target: number): void {
            const gl = this.getContext();

            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        protected onLoad(image: HTMLImageElement, face: number, callBack?: () => void): void {
            const gl = this.getContext();

            this.getOrCreateHandle();

            const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + face;

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

            if (image.width === image.height && image.width === this.faceSize) {
                console.log(image.width);
                gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            } else if (image.height > image.width) {
                console.warn(`Cubemap texture has height > width (${this.infos[face].pngUrl}).`);
            } else {
                gl.texImage2D(target, 0, gl.RGBA, this.faceSize, this.faceSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

                // Ignore bottom face
                if (face !== 2) {
                    gl.texSubImage2D(target, 0, 0, this.faceSize - image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }
            }

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

            if (callBack != null) callBack();
        }
    }
}