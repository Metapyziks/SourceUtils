namespace SourceUtils {
    export class Texture2D {
        private context: WebGLRenderingContext;
        private handle: WebGLTexture;

        constructor(gl: WebGLRenderingContext, url: string) {
            this.context = gl;
            this.load(url);
        }

        isLoaded(): boolean {
            return this.handle !== undefined;
        }

        getHandle(): WebGLTexture {
            return this.handle;
        }

        private load(url: string): void {
            const image = new Image();
            image.src = url;
            image.onload = () => this.onLoad(image);
        }

        private onLoad(image: HTMLImageElement): void {
            const gl = this.context;

            if (this.handle === undefined) this.handle = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, this.handle);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }
    }
}