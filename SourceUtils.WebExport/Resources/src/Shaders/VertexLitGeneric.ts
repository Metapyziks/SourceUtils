/// <reference path="ModelBase.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class VertexLitGenericMaterial extends ModelBaseMaterial {

        }

        export class VertexLitGeneric extends ModelBase<VertexLitGenericMaterial> {
            constructor(context: WebGLRenderingContext) {
                super(context, VertexLitGenericMaterial);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    void main()
                    {
                        ModelBase_main();
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    void main()
                    {
                        vec4 mainSample = ModelBase_main();
                        gl_FragColor = vec4(ApplyFog(mainSample.rgb), mainSample.a);
                    }`);

                this.compile();
            }
        }
    }
}