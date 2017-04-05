namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class BaseMaterial {
            cullFace = true;
        }

        export class BaseShaderProgram<TMaterial extends BaseMaterial> extends WebGame.ShaderProgram {
            private readonly materialCtor: { new (): TMaterial };

            constructor(context: WebGLRenderingContext, ctor: { new (): TMaterial }) {
                super(context);

                this.materialCtor = ctor;
            }

            createMaterialProperties(): any {
                return new this.materialCtor();
            }

            bufferMaterial(buf: WebGame.CommandBuffer, material: WebGame.Material): void {
                this.bufferMaterialProps(buf, material.properties as TMaterial);
            }

            bufferMaterialProps(buf: WebGame.CommandBuffer, props: TMaterial): void {
                const gl = this.context;

                if (props.cullFace) {
                    buf.enable(gl.CULL_FACE);
                } else {
                    buf.disable(gl.CULL_FACE);
                }
            }
        }

        export class LightmappedGenericMaterial extends BaseMaterial {
            basetexture: WebGame.Texture = null;
        }

        export class LightmappedGeneric extends BaseShaderProgram<LightmappedGenericMaterial> {
            static readonly vertSource = `
                attribute vec3 aPosition;
                attribute vec2 aTextureCoord;
                attribute vec2 aLightmapCoord;

                varying vec2 vTextureCoord;
                varying vec2 vLightmapCoord;

                uniform mat4 uProjection;
                uniform mat4 uView;
                uniform mat4 uModel;

                void main()
                {
                    vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);

                    gl_Position = uProjection * viewPos;

                    vTextureCoord = aTextureCoord;
                    vLightmapCoord = aLightmapCoord;
                }`;

            static readonly fragSource = `
                precision mediump float;

                varying float vDepth;
                varying vec2 vTextureCoord;
                varying vec2 vLightmapCoord;

                uniform sampler2D uBaseTexture;

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
                }

                void main()
                {
                    vec4 baseSample = texture2D(uBaseTexture, vTextureCoord);
                    vec3 lightmapped = ApplyLightmap(baseSample.rgb);

                    gl_FragColor = vec4(lightmapped, 1);
                }`;

            readonly uProjection = this.addUniform("uProjection", WebGame.UniformMatrix4);
            readonly uView = this.addUniform("uView", WebGame.UniformMatrix4);
            readonly uModel = this.addUniform("uModel", WebGame.UniformMatrix4);

            readonly uBaseTexture = this.addUniform("uBaseTexture", WebGame.UniformSampler);

            readonly uLightmap = this.addUniform("uLightmap", WebGame.UniformSampler);
            readonly uLightmapParams = this.addUniform("uLightmapParams", WebGame.Uniform4F);

            constructor(context: WebGLRenderingContext) {
                super(context, LightmappedGenericMaterial);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, LightmappedGeneric.vertSource);
                this.includeShaderSource(gl.FRAGMENT_SHADER, LightmappedGeneric.fragSource);

                this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                this.addAttribute("aLightmapCoord", WebGame.VertexAttribute.uv2);

                this.uBaseTexture.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                this.uLightmap.setDefault(WebGame.TextureUtils.getWhiteTexture(context));

                this.compile();
            }

            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void {
                super.bufferSetup(buf);

                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);

                this.uLightmap.bufferParameter(buf, Map.lightmapParam);
                this.uLightmapParams.bufferParameter(buf, Map.lightmapInfoParam);
            }

            bufferModelMatrix(buf: Facepunch.WebGame.CommandBuffer, value: Float32Array): void {
                super.bufferModelMatrix(buf, value);

                this.uModel.bufferValue(buf, false, value);
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: LightmappedGenericMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uBaseTexture.bufferValue(buf, props.basetexture);
            }
        }
    }
}