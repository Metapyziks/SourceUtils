namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class ModelBaseMaterial extends BaseMaterial {
            basetexture: WebGame.Texture = null;
            alphaTest = false;
            translucent = false;
            alpha = 1;
            fogEnabled = true;
            emission = false;
            emissionTint = new Facepunch.Vector3(0, 0, 0);
        }

        export abstract class ModelBase<TMaterial extends ModelBaseMaterial> extends BaseShaderProgram<TMaterial> {
            readonly uProjection = this.addUniform("uProjection", WebGame.UniformMatrix4);
            readonly uView = this.addUniform("uView", WebGame.UniformMatrix4);
            readonly uModel = this.addUniform("uModel", WebGame.UniformMatrix4);

            readonly uBaseTexture = this.addUniform("uBaseTexture", WebGame.UniformSampler);

            readonly uAlphaTest = this.addUniform("uAlphaTest", WebGame.Uniform1F);
            readonly uTranslucent = this.addUniform("uTranslucent", WebGame.Uniform1F);
            readonly uAlpha = this.addUniform("uAlpha", WebGame.Uniform1F);

            readonly uFogParams = this.addUniform("uFogParams", WebGame.Uniform4F);
            readonly uFogColor = this.addUniform("uFogColor", WebGame.Uniform3F);
            readonly uFogEnabled = this.addUniform("uFogEnabled", WebGame.Uniform1I);

            readonly uEmission = this.addUniform("uEmission", WebGame.Uniform1I);
            readonly uEmissionTint = this.addUniform("uEmissionTint", WebGame.Uniform3F);

            constructor(context: WebGLRenderingContext, ctor: { new(): TMaterial }) {
                super(context, ctor);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute vec3 aPosition;
                    attribute vec2 aTextureCoord;

                    varying vec2 vTextureCoord;
                    varying float vDepth;

                    uniform mat4 ${this.uProjection};
                    uniform mat4 ${this.uView};
                    uniform mat4 ${this.uModel};

                    uniform mediump int ${this.uEmission};

                    void ModelBase_main()
                    {
                        vec4 viewPos = ${this.uView} * ${this.uModel} * vec4(aPosition, 1.0);

                        gl_Position = ${this.uProjection} * viewPos;

                        vTextureCoord = aTextureCoord;
                        vDepth = -viewPos.z;
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    varying vec2 vTextureCoord;
                    varying float vDepth;

                    uniform sampler2D ${this.uBaseTexture};

                    uniform float ${this.uAlphaTest};   // [0, 1]
                    uniform float ${this.uTranslucent}; // [0, 1]
                    uniform float ${this.uAlpha};       // [0..1]

                    uniform vec4 ${this.uFogParams};
                    uniform vec3 ${this.uFogColor};
                    uniform int ${this.uFogEnabled};

                    uniform int ${this.uEmission};
                    uniform vec3 ${this.uEmissionTint};

                    vec3 ApplyFog(vec3 inColor)
                    {
                        if (${this.uFogEnabled} == 0) return inColor;

                        float fogDensity = ${this.uFogParams}.x + ${this.uFogParams}.y * vDepth;
                        fogDensity = min(max(fogDensity, ${this.uFogParams}.z), ${this.uFogParams}.w);
                        return mix(inColor, ${this.uFogColor}, fogDensity);
                    }

                    vec4 ModelBase_main()
                    {
                        vec4 sample = texture2D(${this.uBaseTexture}, vTextureCoord);
                        if (sample.a <= ${this.uAlphaTest} - 0.5) discard;

                        float alpha = mix(1.0, ${this.uAlpha} * sample.a, ${this.uTranslucent});

                        if (${this.uEmission} != 0)
                        {
                            sample.rgb += ${this.uEmissionTint};
                        }

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

                this.uFogParams.bufferParameter(buf, WebGame.Fog.fogInfoParam);
                this.uFogColor.bufferParameter(buf, WebGame.Fog.fogColorParam);
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

                this.uFogEnabled.bufferValue(buf, props.fogEnabled ? 1 : 0);

                this.uEmission.bufferValue(buf, props.emission ? 1 : 0);
                if (props.emission) {
                    this.uEmissionTint.bufferValue(buf, props.emissionTint.x, props.emissionTint.y, props.emissionTint.z);
                }

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