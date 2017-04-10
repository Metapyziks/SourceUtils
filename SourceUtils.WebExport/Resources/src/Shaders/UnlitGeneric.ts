/// <reference path="ModelBase.ts"/>

namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class UnlitGenericMaterial extends ModelBaseMaterial {

        }

        export class UnlitGeneric extends ModelBase<UnlitGenericMaterial> {
            constructor(context: WebGLRenderingContext) {
                super(context, UnlitGenericMaterial);

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
                        gl_FragColor = ModelBase_main();
                    }`);

                this.compile();
            }
        }
    }
}