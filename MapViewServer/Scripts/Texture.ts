namespace SourceUtils {
    export class Texture
    {
        private static nextSortIndex = 0;

        private sortIndex: number;

        private target: number;
        private context: WebGLRenderingContext;
        private handle: WebGLTexture;
        private highestLevel = Number.MIN_VALUE;
        private lowestLevel = Number.MAX_VALUE;

        width: number;
        height: number;

        protected allowAnisotropicFiltering = true;

        protected wrapS: number;
        protected wrapT: number;
        protected minFilter: number;
        protected magFilter: number;

        constructor(gl: WebGLRenderingContext, target: number) {
            this.sortIndex = Texture.nextSortIndex++;

            this.context = gl;
            this.target = target;

            this.wrapS = gl.REPEAT;
            this.wrapT = gl.REPEAT;

            this.minFilter = gl.LINEAR;
            this.magFilter = gl.LINEAR;
        }

        compareTo(other: Texture): number {
            return this.sortIndex - other.sortIndex;
        }

        getTarget(): number {
            return this.target;
        }

        protected setTarget(target: number): void {
            if (this.handle != null) {
                throw new Error("Cannot set target of a texture that is already loaded.");
            }

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

            gl.texParameteri(target, gl.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, this.wrapT);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, this.magFilter);

            if (this.allowAnisotropicFiltering && this.minFilter !== gl.NEAREST) {
                const anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
                if (anisoExt != null) {
                    gl.texParameterf(target, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, 4);
                }
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

        private onLoadSingle(image: HTMLImageElement, minX: number, minY: number, width: number, height: number, target: number, mipLevel: number): void {
            const gl = this.context;

            gl.texImage2D(target, mipLevel, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            if (mipLevel > this.highestLevel) {
                this.highestLevel = mipLevel;
            }

            if (mipLevel < this.lowestLevel) {
                this.lowestLevel = mipLevel;
                if (mipLevel !== 0) {
                    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                } else {
                    this.width = image.width;
                    this.height = image.height;
                }
            }
        }

        protected onLoad(image: HTMLImageElement, mipLevel: number, callBack?: () => void): void {
            this.getOrCreateHandle();

            if (image.height === (this.height >> mipLevel) * 6 && this.target === this.context.TEXTURE_CUBE_MAP) {
                const faceHeight = image.height / 6;

                for (let face = 0; face < 6; ++face) {
                    this.onLoadSingle(image, 0, faceHeight * face, image.width, faceHeight, this.context.TEXTURE_CUBE_MAP_POSITIVE_X + face, mipLevel);
                }
            } else {
                this.onLoadSingle(image, 0, 0, image.width, image.height, this.target, mipLevel);
            }

            if (callBack != null) callBack();
        }

        protected loadPixels(width: number, height: number, values: Uint8Array, target?: number): void {
            const gl = this.context;

            this.getOrCreateHandle();

            this.width = width;
            this.height = height;

            if (target === undefined) {
                target = this.target;
            }

            gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
        }

        dispose(): void {
            if (this.handle !== undefined) {
                this.context.deleteTexture(this.handle);
                this.handle = undefined;
            }
        }
    }

    export class RenderTexture extends Texture
    {
        private format: number;
        private type: number;

        constructor(gl: WebGLRenderingContext, width: number, height: number, format: number, type: number) {
            super(gl, gl.TEXTURE_2D);

            this.format = format;
            this.type = type;

            this.wrapS = gl.CLAMP_TO_EDGE;
            this.wrapT = gl.CLAMP_TO_EDGE;
            this.minFilter = gl.NEAREST;
            this.magFilter = gl.NEAREST;

            this.allowAnisotropicFiltering = false;

            this.resize(width, height);
        }

        resize(width: number, height: number): void {
            if (this.width === width && this.height === height) return;

            const gl = this.getContext();

            this.width = width;
            this.height = height;

            this.getOrCreateHandle();

            gl.texImage2D(this.getTarget(), 0, this.format, this.width, this.height, 0, this.format, this.type, null);
            gl.bindTexture(this.getTarget(), null);
        }
    }

    export class Lightmap extends Texture {
        constructor(gl: WebGLRenderingContext, url: string) {
            super(gl, gl.TEXTURE_2D);

            this.minFilter = gl.NEAREST;
            this.magFilter = gl.NEAREST;

            this.loadLevel(url, 0);
        }
    }

    export class BlankTexture2D extends Texture {
        constructor(gl: WebGLRenderingContext, r: number, g: number, b: number, a?: number) {
            super(gl, gl.TEXTURE_2D);

            if (a === undefined) a = 1.0;
            this.loadPixels(1, 1, new Uint8Array([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255)]));
        }
    }

    export class BlankTextureCube extends Texture
    {
        constructor(gl: WebGLRenderingContext, r: number, g: number, b: number, a?: number)
        {
            super(gl, gl.TEXTURE_CUBE_MAP);

            this.wrapS = gl.CLAMP_TO_EDGE;
            this.wrapT = gl.CLAMP_TO_EDGE;
            this.allowAnisotropicFiltering = false;

            const pixels = new Uint8Array([
                Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255)
            ]);

            this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
            this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
            this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
            this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_POSITIVE_X);
            this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
            this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
        }
    }

    export class ErrorTexture2D extends Texture {
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

    export class ValveTexture extends Texture implements ILoadable<ValveTexture> {
        shouldLoadBefore(other: ValveTexture): boolean {
            if (this.usesSinceLastLoad === 0) return false;
            if (other == null) return true;
            const mipCompare = this.getLowestMipLevel() - other.getLowestMipLevel();
            if (mipCompare !== 0) return mipCompare > 0;
            const scoreCompare = this.usesSinceLastLoad - other.getUsesSinceLastLoad();
            return scoreCompare > 0;
        }

        private usesSinceLastLoad = 0;
        private wasLoaded = false;

        constructor(gl: WebGLRenderingContext, target: number) {
            super(gl, target);
        }

        protected onGetHandle(): void {
            ++this.usesSinceLastLoad;
        }

        firstTimeLoaded(): boolean {
            if (this.wasLoaded || !this.isLoaded()) return false;
            this.wasLoaded = true;
            return true;
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
        private info: Api.IVtfResponse;
        private nextLevel: number;

        constructor(gl: WebGLRenderingContext, url: string) {
            super(gl, gl.TEXTURE_2D);
            this.vtfUrl = url;
        }

        loadNext(callback: (requeue: boolean) => void): void {
            super.loadNext(null);

            if (this.info == null) {
                this.loadInfo(() => callback(this.info != null));
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
                (data: Api.IVtfResponse) => {
                    this.info = data;
                    this.nextLevel = Math.max(0, data.mipmaps - 1);

                    if (this.info.faces === 6) {
                        this.setTarget(this.getContext().TEXTURE_CUBE_MAP);
                    } else if (this.info.frames > 1) {
                        // TODO
                    }
                }).always(() => {
                if (callback != null) callback();
            });
        }

        protected onLoad(image: HTMLImageElement, mipLevel: number, callBack?: () => void): void {
            super.onLoad(image, mipLevel);

            if (this.getLowestMipLevel() === 0 &&
                this.getHighestMipLevel() === this.info.mipmaps - 1) {
                const gl = this.getContext();
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }

            if (callBack != null) callBack();
        }
    }

    export class ValveTextureCube extends ValveTexture {
        private vtfUrls: string[];
        private infos: Api.IVtfResponse[] = [];
        private loadedInfo = false;
        private faceSize: number;
        private nextFace = 0;

        constructor(gl: WebGLRenderingContext, urls: string[]) {
            super(gl, gl.TEXTURE_CUBE_MAP);

            this.vtfUrls = urls;
            this.wrapS = gl.CLAMP_TO_EDGE;
            this.wrapT = gl.CLAMP_TO_EDGE;
            this.allowAnisotropicFiltering = false;
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
                (data: Api.IVtfResponse) => {
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

        protected onLoad(image: HTMLImageElement, face: number, callBack?: () => void): void {
            const gl = this.getContext();

            this.getOrCreateHandle();

            const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + face;

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

            if (image.width === image.height && image.width === this.faceSize) {
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