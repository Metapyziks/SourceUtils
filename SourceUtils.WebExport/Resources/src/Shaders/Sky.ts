namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class SkyMaterial extends BaseMaterial {
            faceft: WebGame.Texture = null;
            facebk: WebGame.Texture = null;
            facedn: WebGame.Texture = null;
            faceup: WebGame.Texture = null;
            facert: WebGame.Texture = null;
            facelf: WebGame.Texture = null;
        }

        export class Sky extends BaseShaderProgram<SkyMaterial> {


            readonly uProjection = this.addUniform("uProjection", WebGame.UniformMatrix4);
            readonly uView = this.addUniform("uView", WebGame.UniformMatrix4);

            readonly uFaceFront = this.addUniform("uFaceFront", WebGame.UniformSampler);
            readonly uFaceBack = this.addUniform("uFaceBack", WebGame.UniformSampler);
            readonly uFaceDown = this.addUniform("uFaceDown", WebGame.UniformSampler);
            readonly uFaceUp = this.addUniform("uFaceUp", WebGame.UniformSampler);
            readonly uFaceRight = this.addUniform("uFaceRight", WebGame.UniformSampler);
            readonly uFaceLeft = this.addUniform("uFaceLeft", WebGame.UniformSampler);

            constructor(context: WebGLRenderingContext) {
                super(context, SkyMaterial);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute vec3 aPosition;
                    attribute float aFace;

                    varying float vFace;
                    varying vec2 vTextureCoord;

                    uniform mat4 uProjection;
                    uniform mat4 uView;

                    vec2 GetFaceUv()
                    {
                        switch (int(round(aFace))) {
                            case 0: // Front
                                return aPosition.xz;
                            case 1: // Back
                                return aPosition.xz * vec2(-1.0, 1.0);
                            case 2: // Down
                                return aPosition.xy;
                            case 3: // Up
                                return aPosition.xy * vec2(-1.0, 1.0);
                            case 4: // Right
                                return aPosition.yz;
                            case 5: // Left
                                return aPosition.yz * vec2(-1.0, 1.0);
                            default:
                                return vec2(0.0, 0.0);
                        }
                    }

                    void main()
                    {
                        vec4 viewPos = uView * vec4(aPosition, 0.0);

                        gl_Position = uProjection * viewPos;

                        vFace = round(aFace);
                        vTextureCoord = GetFaceUv();
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    varying float vFace;
                    varying vec2 vTextureCoord;

                    uniform sampler2D uFaceFront;
                    uniform sampler2D uFaceBack;
                    uniform sampler2D uFaceDown;
                    uniform sampler2D uFaceUp;
                    uniform sampler2D uFaceRight;
                    uniform sampler2D uFaceLeft;

                    vec4 GetFaceSample()
                    {
                        switch (int(vFace)) {
                            case 0: // Front
                                return texture2D(uFaceFront, vTextureCoord);
                            case 1: // Back
                                return aPosition.xz * vec2(-1.0, 1.0);
                            case 2: // Down
                                return aPosition.xy;
                            case 3: // Up
                                return aPosition.xy * vec2(-1.0, 1.0);
                            case 4: // Right
                                return aPosition.yz;
                            case 5: // Left
                                return aPosition.yz * vec2(-1.0, 1.0);
                            default:
                                return vec4(0.0, 0.0, 0.0, 0.0);
                        }
                    }

                    void main()
                    {
                        gl_FragColor = GetFaceSample();
                    }`);

                this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                this.addAttribute("aFace", WebGame.VertexAttribute.alpha);

                this.uFaceFront.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceBack.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceDown.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceUp.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceRight.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uFaceLeft.setDefault(WebGame.TextureUtils.getErrorTexture(context));
            }

            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void {
                super.bufferSetup(buf);

                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);

                const gl = this.context;

                buf.depthMask(false);
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: SkyMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uFaceFront.set(props.faceft);
                this.uFaceBack.set(props.facebk);
                this.uFaceDown.set(props.facedn);
                this.uFaceUp.set(props.faceup);
                this.uFaceRight.set(props.facert);
                this.uFaceLeft.set(props.facelf);
            }
        }
    }
}