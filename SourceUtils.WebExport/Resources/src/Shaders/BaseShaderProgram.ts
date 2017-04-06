namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Shaders {
        export class BaseMaterial {
            cullFace = true;
        }

        export class BaseShaderProgram<TMaterial extends BaseMaterial> extends WebGame.ShaderProgram {
            private readonly materialCtor: { new(): TMaterial };

            constructor(context: WebGLRenderingContext, ctor: { new(): TMaterial }) {
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
    }
}