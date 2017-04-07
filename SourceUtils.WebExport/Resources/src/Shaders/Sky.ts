namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class SkyMaterial extends BaseMaterial {
            facePosX: WebGame.Texture = null;
            faceNegX: WebGame.Texture = null;
            facePosY: WebGame.Texture = null;
            faceNegY: WebGame.Texture = null;
            facePosZ: WebGame.Texture = null;
            faceNegZ: WebGame.Texture = null;
            hdrCompressed = false;
            aspect = 1;
        }

        export class Sky extends BaseShaderProgram<SkyMaterial> {
            readonly uProjection = this.addUniform("uProjection", WebGame.UniformMatrix4);
            readonly uView = this.addUniform("uView", WebGame.UniformMatrix4);

            readonly uFacePosX = this.addUniform("uFacePosX", WebGame.UniformSampler);
            readonly uFaceNegX = this.addUniform("uFaceNegX", WebGame.UniformSampler);
            readonly uFacePosY = this.addUniform("uFacePosY", WebGame.UniformSampler);
            readonly uFaceNegY = this.addUniform("uFaceNegY", WebGame.UniformSampler);
            readonly uFacePosZ = this.addUniform("uFacePosZ", WebGame.UniformSampler);
            readonly uFaceNegZ = this.addUniform("uFaceNegZ", WebGame.UniformSampler);

            readonly uAspect = this.addUniform("uAspect", WebGame.Uniform1F);
            readonly uHdrCompressed = this.addUniform("uHdrCompressed", WebGame.Uniform1I);

            constructor(context: WebGLRenderingContext) {
                super(context, SkyMaterial);

                this.sortOrder = -1000;

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute vec2 aTextureCoord;
                    attribute float aFace;

                    varying float vFace;
                    varying vec2 vTextureCoord;

                    uniform mat4 uProjection;
                    uniform mat4 uView;

                    uniform float uAspect;

                    vec3 GetPosition()
                    {
                        vec2 pos = aTextureCoord - vec2(0.5, 0.5);
                        int face = int(aFace + 0.5);
                        if (face == 0) return vec3( 0.5, -pos.x, -pos.y);
                        if (face == 1) return vec3(-0.5, pos.x, -pos.y);
                        if (face == 2) return vec3( pos.x, 0.5, -pos.y);
                        if (face == 3) return vec3(-pos.x, -0.5, -pos.y);
                        if (face == 4) return vec3( pos.y,-pos.x, 0.5);
                        if (face == 5) return vec3( pos.y, pos.x, -0.5);
                        return vec3(0.0, 0.0, 0.0);
                    }

                    void main()
                    {
                        vec4 viewPos = uView * vec4(GetPosition() * 128.0, 0.0);

                        gl_Position = uProjection * vec4(viewPos.xyz, 1.0);

                        vFace = aFace;
                        vTextureCoord = aTextureCoord * vec2(1.0, mix(1.0, uAspect, float(aFace < 3.5)));
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    varying float vFace;
                    varying vec2 vTextureCoord;

                    uniform sampler2D uFacePosX;
                    uniform sampler2D uFaceNegX;
                    uniform sampler2D uFacePosY;
                    uniform sampler2D uFaceNegY;
                    uniform sampler2D uFacePosZ;
                    uniform sampler2D uFaceNegZ;

                    uniform int uHdrCompressed;

                    vec4 GetFaceSample()
                    {
                        int face = int(vFace + 0.5);
                        if (face == 0) return texture2D(uFacePosX, vTextureCoord);
                        if (face == 1) return texture2D(uFaceNegX, vTextureCoord);
                        if (face == 2) return texture2D(uFacePosY, vTextureCoord);
                        if (face == 3) return texture2D(uFaceNegY, vTextureCoord);
                        if (face == 4) return texture2D(uFacePosZ, vTextureCoord);
                        if (face == 5) return texture2D(uFaceNegZ, vTextureCoord);
                        return vec4(0.0, 0.0, 0.0, 1.0);
                    }

                    vec3 DecompressHdr(vec4 sample)
                    {
                        return sample.rgb * sample.a * 2.0;
                    }

                    void main()
                    {
                        vec4 sample = GetFaceSample();

                        if (uHdrCompressed != 0) {
                            gl_FragColor = vec4(DecompressHdr(sample), 1.0);
                        } else {
                            gl_FragColor = vec4(sample.rgb, 1.0);
                        }
                    }`);

                this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                this.addAttribute("aFace", WebGame.VertexAttribute.alpha);

                this.uFacePosX.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceNegX.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFacePosY.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceNegY.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFacePosZ.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceNegZ.setDefault(WebGame.TextureUtils.getErrorTexture(context));

                this.compile();
            }

            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void {
                super.bufferSetup(buf);

                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);

                buf.depthMask(false);
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: SkyMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uFacePosX.bufferValue(buf, props.facePosX);
                this.uFaceNegX.bufferValue(buf, props.faceNegX);
                this.uFacePosY.bufferValue(buf, props.facePosY);
                this.uFaceNegY.bufferValue(buf, props.faceNegY);
                this.uFacePosZ.bufferValue(buf, props.facePosZ);
                this.uFaceNegZ.bufferValue(buf, props.faceNegZ);

                this.uAspect.bufferValue(buf, props.aspect);
                this.uHdrCompressed.bufferValue(buf, props.hdrCompressed ? 1 : 0);
            }
        }
    }
}