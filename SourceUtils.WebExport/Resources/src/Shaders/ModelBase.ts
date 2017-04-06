namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class ModelBaseMaterial extends BaseMaterial {
            basetexture: WebGame.Texture = null;
            alphaTest = false;
            translucent = false;
            alpha = 1;
        }

        export abstract class ModelBase<TMaterial extends ModelBaseMaterial> extends BaseShaderProgram<TMaterial> {
            readonly uProjection = this.addUniform("uProjection", WebGame.UniformMatrix4);
            readonly uView = this.addUniform("uView", WebGame.UniformMatrix4);
            readonly uModel = this.addUniform("uModel", WebGame.UniformMatrix4);

            readonly uBaseTexture = this.addUniform("uBaseTexture", WebGame.UniformSampler);

            readonly uAlphaTest = this.addUniform("uAlphaTest", WebGame.Uniform1F);
            readonly uTranslucent = this.addUniform("uTranslucent", WebGame.Uniform1F);
            readonly uAlpha = this.addUniform("uAlpha", WebGame.Uniform1F);

            constructor(context: WebGLRenderingContext, ctor: { new(): TMaterial }) {
                super(context, ctor);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute vec3 aPosition;
                    attribute vec2 aTextureCoord;

                    varying vec2 vTextureCoord;

                    uniform mat4 uProjection;
                    uniform mat4 uView;
                    uniform mat4 uModel;

                    void ModelBase_main()
                    {
                        vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);

                        gl_Position = uProjection * viewPos;

                        vTextureCoord = aTextureCoord;
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    varying vec2 vTextureCoord;

                    uniform sampler2D uBaseTexture;

                    uniform float uAlphaTest;   // [0, 1]
                    uniform float uTranslucent; // [0, 1]
                    uniform float uAlpha;       // [0..1]

                    vec4 ModelBase_main()
                    {
                        vec4 sample = texture2D(uBaseTexture, vTextureCoord);
                        if (sample.a <= uAlphaTest - 0.5) discard;

                        float alpha = mix(1.0, uAlpha * sample.a, uTranslucent);

                        return vec4(sample.rgb, alpha);
                    }`);

                this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);

                this.uBaseTexture.setDefault(WebGame.TextureUtils.getErrorTexture(context));
            }

            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void {
                super.bufferSetup(buf);

                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
            }

            bufferModelMatrix(buf: Facepunch.WebGame.CommandBuffer, value: Float32Array): void {
                super.bufferModelMatrix(buf, value);

                this.uModel.bufferValue(buf, false, value);
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: TMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uBaseTexture.bufferValue(buf, props.basetexture);

                this.uAlphaTest.bufferValue(buf, props.alphaTest ? 1 : 0);
                this.uTranslucent.bufferValue(buf, props.translucent ? 1 : 0);
                this.uAlpha.bufferValue(buf, props.alpha);

                const gl = this.context;

                buf.enable(gl.DEPTH_TEST);

                if (props.translucent) {
                    buf.depthMask(false);
                    buf.enable(gl.BLEND);
                    buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                } else {
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                }
            }
        }
    }
}