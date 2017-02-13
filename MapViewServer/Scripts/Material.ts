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

        constructor(map: Map, infoOrShader: Api.Material | string) {
            this.map = map;

            if (typeof infoOrShader == "string") {
                this.program = map.shaderManager.get(infoOrShader as string);
            } else {
                this.info = infoOrShader as Api.Material;
                this.program = map.shaderManager.get(this.info.shader);

                for (let i = 0; i < this.info.properties.length; ++i)
                {
                    this.addPropertyFromInfo(this.info.properties[i]);
                }
            }
        }

        private addPropertyFromInfo(info: Api.MaterialProperty): void {
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

        getMap(): Map {
            return this.map;
        }

        getProgram(): ShaderProgram {
            return this.program;
        }

        prepareForRendering(): void {
            this.program.changeMaterial(this);
        }
    }
}