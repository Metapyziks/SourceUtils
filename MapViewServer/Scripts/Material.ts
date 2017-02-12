namespace SourceUtils
{
    export class MaterialProperties {
        baseTexture: Texture2D;
    }

    export class Material
    {
        properties = new MaterialProperties();

        private map: Map;
        private info: Api.Material;
        private program: ShaderProgram;

        constructor(map: Map, info: Api.Material) {
            this.map = map;
            this.info = info;
            this.program = map.shaderManager.get(info.shader);

            for (let i = 0; i < info.properties.length; ++i) {
                this.addProperty(info.properties[i]);
            }
        }

        private addProperty(info: Api.MaterialProperty): void {
            switch (info.type) {
                case Api.MaterialPropertyType.boolean:
                case Api.MaterialPropertyType.number:
                    this.properties[info.name] = info.value as boolean | number;
                    break;
                case Api.MaterialPropertyType.texture:
                    this.properties[info.name] = this.map.textureLoader.load(info.value as string);
                    break;
            }
        }

        getProgram(): ShaderProgram {
            return this.program;
        }

        prepareForRendering(): void {
            this.program.changeMaterial(this);
        }
    }
}