
namespace SourceUtils
{
    export class TextureLoader {
        private context: WebGLRenderingContext;

        constructor(gl: WebGLRenderingContext) {
            this.context = gl;
        }

        load(url: string): Texture2D
        {
            // TODO
            return new Texture2D(this.context, url);
        }
    }
}
