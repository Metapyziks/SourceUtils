namespace SourceUtils {
    export class FrameBuffer {
        private context: WebGLRenderingContext;
        private frameBuffer: WebGLFramebuffer;

        private width: number;
        private height: number;

        private frameTexture: RenderTexture;
        private depthTexture: RenderTexture;

        constructor(gl: WebGLRenderingContext, width: number, height: number, depthTexture: boolean) {
            this.context = gl;

            this.frameTexture = new RenderTexture(gl, width, height, gl.RGBA, gl.UNSIGNED_BYTE);

            if (depthTexture) {
                this.depthTexture = new RenderTexture(gl, width, height, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
            }

            this.frameBuffer = gl.createFramebuffer();

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                this.frameTexture.getHandle(),
                0);

            if (this.depthTexture !== undefined) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER,
                    gl.DEPTH_ATTACHMENT,
                    gl.TEXTURE_2D,
                    this.depthTexture.getHandle(),
                    0);
            }

            const state = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            if (state !== gl.FRAMEBUFFER_COMPLETE) {
                throw new Error(`Unexpected framebuffer state: ${state}.`);
            }

            this.resize(width, height);
        }

        getColorTexture(): RenderTexture { return this.frameTexture; }
        getDepthTexture(): RenderTexture { return this.depthTexture; }

        dispose(): void {
            if (this.frameBuffer !== undefined) {
                this.context.deleteFramebuffer(this.frameBuffer);
                this.frameBuffer = undefined;
            }

            if (this.frameTexture !== undefined) {
                this.frameTexture.dispose();
                this.frameTexture = undefined;
            }

            if (this.depthTexture !== undefined) {
                this.depthTexture.dispose();
                this.depthTexture = undefined;
            }
        }

        resize(width: number, height: number): void {
            if (this.width === width && this.height === height) return;

            this.width = width;
            this.height = height;

            this.frameTexture.resize(width, height);

            if (this.depthTexture !== undefined) {
                this.depthTexture.resize(width, height);
            }
        }

        getHandle(): WebGLFramebuffer {
            return this.frameBuffer;
        }

        begin(): void {
            const gl = this.context;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        }

        end(): void {
            const gl = this.context;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
}