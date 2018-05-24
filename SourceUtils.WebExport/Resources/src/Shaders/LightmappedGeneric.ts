/// <reference path="LightmappedBase.ts"/>

namespace SourceUtils {
    export namespace Shaders {
        export class LightmappedGenericMaterial extends LightmappedBaseMaterial {

        }

        export class LightmappedGeneric extends LightmappedBase<LightmappedGenericMaterial> {
            constructor(context: WebGLRenderingContext) {
                super(context, LightmappedGenericMaterial);

                const gl = context;

                this.includeShaderSource(gl.VERTEX_SHADER, `
                    void main()
                    {
                        LightmappedBase_main();
                    }`);

                this.includeShaderSource(gl.FRAGMENT_SHADER, `
                    precision mediump float;

                    void main()
                    {
                        vec4 modelBase = ModelBase_main();
                        vec3 lightmapped = ${this.uEmission} != 0 ? modelBase.rgb : ApplyLightmap(modelBase.rgb);

                        gl_FragColor = vec4(ApplyFog(lightmapped), modelBase.a);
                    }`);

                this.compile();
            }
        }
    }
}