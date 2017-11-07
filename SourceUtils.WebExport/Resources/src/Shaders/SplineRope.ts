namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class SplineRopeMaterial extends ModelBaseMaterial {
            ambient: Facepunch.Vector3[];
        }

        export class SplineRope extends ModelBase<SplineRopeMaterial> {
            private uAmbient0 = this.addUniform("uAmbient[0]", WebGame.Uniform3F);
            private uAmbient1 = this.addUniform("uAmbient[1]", WebGame.Uniform3F);
            private uAmbient2 = this.addUniform("uAmbient[2]", WebGame.Uniform3F);
            private uAmbient3 = this.addUniform("uAmbient[3]", WebGame.Uniform3F);
            private uAmbient4 = this.addUniform("uAmbient[4]", WebGame.Uniform3F);
            private uAmbient5 = this.addUniform("uAmbient[5]", WebGame.Uniform3F);

            uAmbient: WebGame.Uniform3F[];

            constructor(context: WebGLRenderingContext) {
                super(context, SplineRopeMaterial);

                this.uAmbient = [this.uAmbient0, this.uAmbient1, this.uAmbient2, this.uAmbient3, this.uAmbient4, this.uAmbient5];

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute vec3 aTangent;
                    attribute vec2 aSplineParams;

                    uniform vec3 uAmbient[6];

                    varying vec3 vAmbient;

                    vec3 SampleAmbient(vec3 normal, vec3 axis, int index)
                    {
                        return pow(max(0.0, dot(normal, axis)), 2.0) * pow(uAmbient[index], vec3(0.5, 0.5, 0.5));
                    }

                    void main()
                    {
                        vec4 viewPos = ${this.uView} * ${this.uModel} * vec4(aPosition, 1.0);
                        vec3 viewTangent = normalize((${this.uView} * ${this.uModel} * vec4(aTangent, 0.0)).xyz);
                        vec3 viewNormalA = normalize(cross(viewPos.xyz, viewTangent));
                        vec3 viewNormalB = normalize(cross(viewNormalA, viewTangent));

                        vec3 viewUnitX = normalize((${this.uView} * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
                        vec3 viewUnitY = normalize((${this.uView} * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
                        vec3 viewUnitZ = normalize((${this.uView} * vec4(0.0, 0.0, 1.0, 0.0)).xyz);

                        vec3 viewNormal = normalize(viewNormalA * (aTextureCoord.x - 0.5)
                            + viewNormalB * sqrt(1.0 - pow(1.0 - aTextureCoord.x * 2.0, 2.0)) * 0.5);

                        vAmbient = SampleAmbient(viewNormal,  viewUnitX, 0)
                                 + SampleAmbient(viewNormal, -viewUnitX, 1)
                                 + SampleAmbient(viewNormal,  viewUnitY, 2)
                                 + SampleAmbient(viewNormal, -viewUnitY, 3)
                                 + SampleAmbient(viewNormal,  viewUnitZ, 4)
                                 + SampleAmbient(viewNormal, -viewUnitZ, 5);

                        viewPos.xyz += viewNormal * aSplineParams.x;
                        viewPos.xyz += viewUnitZ * aSplineParams.y;

                        gl_Position = ${this.uProjection} * viewPos;

                        vTextureCoord = aTextureCoord;
                        vDepth = -viewPos.z;
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    varying vec3 vAmbient;

                    void main()
                    {
                        vec4 mainSample = ModelBase_main();
                        gl_FragColor = vec4(ApplyFog(mainSample.rgb * vAmbient), mainSample.a);
                    }`);

                this.addAttribute("aTangent", WebGame.VertexAttribute.normal);
                this.addAttribute("aSplineParams", WebGame.VertexAttribute.uv2);

                this.compile();
            }

            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: SplineRopeMaterial): void {
                super.bufferMaterialProps(buf, props);

                if (props.ambient != null) {
                    const values = props.ambient;
                    const uniforms = this.uAmbient;
                    for (let i = 0; i < 6; ++i) {
                        const value = values[i];
                        if (value == null) continue;
                        uniforms[i].bufferValue(buf, value.x, value.y, value.z);
                    }
                }
            }
        }
    }
}