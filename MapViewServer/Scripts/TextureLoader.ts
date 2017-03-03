namespace SourceUtils {
    export class TextureLoader extends Loader<ValveTexture> {
        private context: WebGLRenderingContext;

        constructor(gl: WebGLRenderingContext) {
            super();
            this.context = gl;
        }

        protected onCreateItem(url: string): ValveTexture
        {
            if (url.indexOf(",") !== -1)
            {
                return new ValveTextureCube(this.context, url.split(","));
            }

            return new ValveTexture2D(this.context, url);
        }

        load2D(url: string): ValveTexture2D {
            return this.load(url) as ValveTexture2D;
        }

        loadCube(urls: string[]): ValveTexture
        {
            if (urls.length !== 6)
            {
                throw new Error("Expected 6 texture URLs.");
            }

            const joinedUrls = urls.join(",");
            return this.load(joinedUrls);
        }
    }
}
