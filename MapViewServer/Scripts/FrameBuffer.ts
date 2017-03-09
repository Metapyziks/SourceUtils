namespace SourceUtils {
    export class FrameBuffer {
        private context: WebGLRenderingContext;
        private frameBuffer: WebGLFramebuffer;

        private width: number;
        private height: number;

        private frameTexture: RenderTexture;
        private depthTexture: RenderTexture;

        private static nextPowerOf2(val: number): number {
            let po2 = 1;
            while (po2 < val) po2 <<= 1;
            return po2;
        }

        constructor(gl: WebGLRenderingContext, width: number, height: number, depthTexture: boolean) {
            this.context = gl;

            this.frameTexture = new RenderTexture(gl, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE);

            if (depthTexture) {
                this.depthTexture = new RenderTexture(gl, 256, 256, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT);
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

            const po2Width = FrameBuffer.nextPowerOf2(width);
            const po2Height = FrameBuffer.nextPowerOf2(height);

            this.frameTexture.resize(po2Width, po2Height);

            if (this.depthTexture !== undefined) {
                this.depthTexture.resize(po2Width, po2Height);
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