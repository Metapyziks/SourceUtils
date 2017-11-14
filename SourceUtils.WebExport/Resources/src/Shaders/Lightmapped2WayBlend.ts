/// <reference path="LightmappedBase.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class Lightmapped2WayBlendMaterial extends LightmappedBaseMaterial {
            basetexture2: WebGame.Texture = null;
            blendModulateTexture: WebGame.Texture = null;
        }

        export class Lightmapped2WayBlend extends LightmappedBase<Lightmapped2WayBlendMaterial> {
            readonly uBaseTexture2 = this.addUniform("uBaseTexture2", WebGame.UniformSampler);
            readonly uBlendModulateTexture = this.addUniform("uBlendModulateTexture", WebGame.UniformSampler);

            readonly uBlendModulate = this.addUniform("uBlendModulate", WebGame.Uniform1I);

            constructor(context: WebGLRenderingContext) {
                super(context, Lightmapped2WayBlendMaterial);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute float aAlpha;

                    varying float vAlpha;

                    void main()
                    {
                        LightmappedBase_main();

                        vAlpha = aAlpha;
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    varying float vAlpha;

                    uniform sampler2D uBaseTexture2;
                    uniform sampler2D uBlendModulateTexture;

                    uniform int uBlendModulate; // [0, 1]

                    void main()
                    {
                        vec3 sample0 = texture2D(uBaseTexture, vTextureCoord).rgb;
                        vec3 sample1 = texture2D(uBaseTexture2, vTextureCoord).rgb;

                        float blend;
                        if (uBlendModulate != 0) {
                            vec3 blendSample = texture2D(uBlendModulateTexture, vTextureCoord).rga;

                            float blendMin = max(0.0, blendSample.y - blendSample.x * 0.5);
                            float blendMax = min(1.0, blendSample.y + blendSample.x * 0.5);

                            blend = max(0.0, min(1.0, (vAlpha - blendMin) / max(0.0, blendMax - blendMin)));
                        } else {
                            blend = max(0.0, min(1.0, vAlpha));
                        }

                        vec3 blendedSample = mix(sample0, sample1, blend);
                        vec3 lightmapped = ApplyLightmap(blendedSample);

                        gl_FragColor = vec4(ApplyFog(lightmapped), 1.0);
                    }`);

                this.addAttribute("aAlpha", WebGame.VertexAttribute.alpha);

                this.uBaseTexture2.setDefault(WebGame.TextureUtils.getErrorTexture(gl));
                this.uBlendModulateTexture.setDefault(WebGame.TextureUtils.getTranslucentTexture(gl));

                this.compile();
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: Lightmapped2WayBlendMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uBaseTexture2.bufferValue(buf, props.basetexture2);
                this.uBlendModulateTexture.bufferValue(buf, props.blendModulateTexture);

                this.uBlendModulate.bufferValue(buf, props.blendModulateTexture != null ? 1 : 0);
            }
        }
    }
}