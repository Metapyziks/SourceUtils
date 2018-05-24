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

                    uniform mat4 ${this.uProjection};
                    uniform mat4 ${this.uView};

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
                        vec4 viewPos = ${this.uView} * vec4(GetPosition() * 128.0, 0.0);

                        gl_Position = ${this.uProjection} * vec4(viewPos.xyz, 1.0);

                        vFace = aFace;
                        vTextureCoord = aTextureCoord;
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    #extension GL_EXT_frag_depth : enable

                    precision mediump float;

                    varying float vFace;
                    varying vec2 vTextureCoord;

                    uniform sampler2D ${this.uFacePosX}; uniform vec4 ${this.uFacePosX.getSizeUniform()};
                    uniform sampler2D ${this.uFaceNegX}; uniform vec4 ${this.uFaceNegX.getSizeUniform()};
                    uniform sampler2D ${this.uFacePosY}; uniform vec4 ${this.uFacePosY.getSizeUniform()};
                    uniform sampler2D ${this.uFaceNegY}; uniform vec4 ${this.uFaceNegY.getSizeUniform()};
                    uniform sampler2D ${this.uFacePosZ}; uniform vec4 ${this.uFacePosZ.getSizeUniform()};
                    uniform sampler2D ${this.uFaceNegZ}; uniform vec4 ${this.uFaceNegZ.getSizeUniform()};

                    uniform int ${this.uHdrCompressed};

                    vec4 GetFaceSize()
                    {
                        int face = int(vFace + 0.5);
                        if (face == 0) return ${this.uFacePosX.getSizeUniform()};
                        if (face == 1) return ${this.uFaceNegX.getSizeUniform()};
                        if (face == 2) return ${this.uFacePosY.getSizeUniform()};
                        if (face == 3) return ${this.uFaceNegY.getSizeUniform()};
                        if (face == 4) return ${this.uFacePosZ.getSizeUniform()};
                        if (face == 5) return ${this.uFaceNegZ.getSizeUniform()};
                        return vec4(1.0, 1.0, 1.0, 1.0);
                    }

                    vec4 GetFaceSample(vec2 uv)
                    {
                        int face = int(vFace + 0.5);
                        if (face == 0) return texture2D(${this.uFacePosX}, uv);
                        if (face == 1) return texture2D(${this.uFaceNegX}, uv);
                        if (face == 2) return texture2D(${this.uFacePosY}, uv);
                        if (face == 3) return texture2D(${this.uFaceNegY}, uv);
                        if (face == 4) return texture2D(${this.uFacePosZ}, uv);
                        if (face == 5) return texture2D(${this.uFaceNegZ}, uv);
                        return vec4(0.0, 0.0, 0.0, 1.0);
                    }

                    vec3 DecompressHdr(vec4 sample)
                    {
                        return sample.rgb * sample.a * 2.0;
                    }

                    void main()
                    {
                        if (${this.uHdrCompressed} != 0) {
                            vec4 size = GetFaceSize();
                            vec2 scaledCoord = vTextureCoord * size.xy * vec2(1.0, size.x * size.w) - vec2(0.5, 0.5);
                            vec2 minCoord = floor(scaledCoord) + vec2(0.5, 0.5);
                            vec2 maxCoord = minCoord + vec2(1.0, 1.0);
                            vec2 delta = scaledCoord - floor(scaledCoord);

                            minCoord *= size.zw;
                            maxCoord *= size.zw;

                            vec3 sampleA = DecompressHdr(GetFaceSample(vec2(minCoord.x, minCoord.y)));
                            vec3 sampleB = DecompressHdr(GetFaceSample(vec2(maxCoord.x, minCoord.y)));
                            vec3 sampleC = DecompressHdr(GetFaceSample(vec2(minCoord.x, maxCoord.y)));
                            vec3 sampleD = DecompressHdr(GetFaceSample(vec2(maxCoord.x, maxCoord.y)));

                            vec3 sample = mix(mix(sampleA, sampleB, delta.x), mix(sampleC, sampleD, delta.x), delta.y);

                            gl_FragColor = vec4(sample, 1.0);
                        } else {
                            vec4 sample = GetFaceSample(vTextureCoord);
                            gl_FragColor = vec4(sample.rgb, 1.0);
                        }

                        gl_FragDepthEXT = 0.99999;
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
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: SkyMaterial): void {
                super.bufferMaterialProps(buf, props);

                this.uFacePosX.bufferValue(buf, props.facePosX);
                this.uFaceNegX.bufferValue(buf, props.faceNegX);
                this.uFacePosY.bufferValue(buf, props.facePosY);
                this.uFaceNegY.bufferValue(buf, props.faceNegY);
                this.uFacePosZ.bufferValue(buf, props.facePosZ);
                this.uFaceNegZ.bufferValue(buf, props.faceNegZ);

                this.uHdrCompressed.bufferValue(buf, props.hdrCompressed ? 1 : 0);
            }
        }
    }
}