namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class SplineRopeMaterial extends ModelBaseMaterial {
            
        }

        export class SplineRope extends ModelBase<SplineRopeMaterial> {

            constructor(context: WebGLRenderingContext) {
                super(context, UnlitGenericMaterial);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    attribute vec3 aTangent;
                    attribute vec2 aSplineParams;

                    void main()
                    {
                        vec4 viewPos = ${this.uView} * ${this.uModel} * vec4(aPosition, 1.0);
                        vec3 viewTangent = normalize((${this.uView} * ${this.uModel} * vec4(aTangent, 0.0)).xyz);
                        vec3 viewNormalA = normalize(cross(viewPos.xyz, viewTangent));
                        vec3 viewNormalB = normalize(cross(viewNormalA, viewTangent));

                        viewPos.xyz += viewNormalA * (aTextureCoord.x - 0.5) * aSplineParams.x;
                        viewPos.xyz += viewNormalB * sqrt(1.0 - pow(1.0 - aTextureCoord.x * 2.0, 2.0)) * aSplineParams.x * 0.5;

                        gl_Position = ${this.uProjection} * viewPos;

                        vTextureCoord = aTextureCoord;
                        vDepth = -viewPos.z;
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    void main()
                    {
                        vec4 mainSample = ModelBase_main();
                        gl_FragColor = vec4(ApplyFog(mainSample.rgb), mainSample.a);
                    }`);

                this.addAttribute("aTangent", WebGame.VertexAttribute.normal);
                this.addAttribute("aSplineParams", WebGame.VertexAttribute.uv2);

                this.compile();
            }
        }
    }
}