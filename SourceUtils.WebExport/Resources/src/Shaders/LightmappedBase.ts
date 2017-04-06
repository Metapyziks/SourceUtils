/// <reference path="ModelBase.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class LightmappedBaseMaterial extends ModelBaseMaterial {

        }

        export abstract class LightmappedBase<TMaterial extends LightmappedBaseMaterial> extends ModelBase<TMaterial> {
            readonly uLightmap = this.addUniform("uLightmap", WebGame.UniformSampler);
            readonly uLightmapParams = this.addUniform("uLightmapParams", WebGame.Uniform4F);

            constructor(context: WebGLRenderingContext, ctor: { new(): TMaterial }) {
                super(context, ctor);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute vec2 aLightmapCoord;

                    varying vec2 vLightmapCoord;

                    void LightmappedBase_main()
                    {
                        ModelBase_main();

                        vLightmapCoord = aLightmapCoord;
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    varying vec2 vLightmapCoord;

                    uniform sampler2D uLightmap;
                    uniform vec4 uLightmapParams;

                    vec3 DecompressLightmapSample(vec4 sample)
                    {
                        float exp = sample.a * 255.0 - 128.0;
                        return sample.rgb * pow(2.0, exp);
                    }

                    vec3 ApplyLightmap(vec3 inColor)
                    {
                        const float gamma = 0.5;

                        vec2 size = uLightmapParams.xy;
                        vec2 invSize = uLightmapParams.zw;
                        vec2 scaledCoord = vLightmapCoord * size;
                        vec2 minCoord = floor(scaledCoord);
                        vec2 maxCoord = minCoord + vec2(1.0, 1.0);
                        vec2 delta = scaledCoord - minCoord;

                        minCoord *= invSize;
                        maxCoord *= invSize;

                        vec3 sampleA = DecompressLightmapSample(texture2D(uLightmap, vec2(minCoord.x, minCoord.y)));
                        vec3 sampleB = DecompressLightmapSample(texture2D(uLightmap, vec2(maxCoord.x, minCoord.y)));
                        vec3 sampleC = DecompressLightmapSample(texture2D(uLightmap, vec2(minCoord.x, maxCoord.y)));
                        vec3 sampleD = DecompressLightmapSample(texture2D(uLightmap, vec2(maxCoord.x, maxCoord.y)));

                        vec3 sample = mix(mix(sampleA, sampleB, delta.x), mix(sampleC, sampleD, delta.x), delta.y);

                        return inColor * pow(sample, vec3(gamma, gamma, gamma));
                    }`);

                this.addAttribute("aLightmapCoord", WebGame.VertexAttribute.uv2);

                this.uLightmap.setDefault(WebGame.TextureUtils.getWhiteTexture(context));
            }

            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void {
                super.bufferSetup(buf);

                this.uLightmap.bufferParameter(buf, Map.lightmapParam);
                this.uLightmapParams.bufferParameter(buf, Map.lightmapInfoParam);
            }
        }
    }
}