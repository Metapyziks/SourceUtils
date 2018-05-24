/// <reference path="LightmappedBase.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class WorldTwoTextureBlendMaterial extends LightmappedBaseMaterial {
            detail: WebGame.Texture = null;
            detailScale: number = 1;
        }

        export class WorldTwoTextureBlend extends LightmappedBase<WorldTwoTextureBlendMaterial> {
            readonly uDetail = this.addUniform("uDetail", WebGame.UniformSampler);
            readonly uDetailScale = this.addUniform("uDetailScale", WebGame.Uniform1F);

            constructor(context: WebGLRenderingContext) {
                super(context, WorldTwoTextureBlendMaterial);
                
                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    void main()
                    {
                        LightmappedBase_main();
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    uniform sampler2D uDetail;
                    uniform float uDetailScale;

                    void main()
                    {
                        vec3 base = texture2D(uBaseTexture, vTextureCoord).rgb;
                        vec4 detail = texture2D(uDetail, vTextureCoord * uDetailScale);

                        vec3 blendedSample = mix(base.rgb, detail.rgb, detail.a);
                        vec3 lightmapped = ApplyLightmap(blendedSample);

                        gl_FragColor = vec4(ApplyFog(lightmapped), 1.0);
                    }`);

                this.uDetail.setDefault(WebGame.TextureUtils.getTranslucentTexture(gl));

                this.compile();
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: WorldTwoTextureBlendMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uDetail.bufferValue(buf, props.detail);
                this.uDetailScale.bufferValue(buf, props.detailScale);
            }
        }
    }
}