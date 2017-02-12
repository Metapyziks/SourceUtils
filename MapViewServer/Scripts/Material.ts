namespace SourceUtils {
    export class Material
    {
        private map: Map;
        private info: Api.Material;
        private program: ShaderProgram;

        private testColor: THREE.Vector3;

        constructor(map: Map, info: Api.Material) {
            this.map = map;
            this.info = info;
            this.program = map.getShaders().get(info.shader);

            this.testColor = new THREE.Vector3(Math.random(), Math.random(), Math.random());
        }

        getProgram(): ShaderProgram {
            return this.program;
        }

        prepareForRendering(): void {
            (this.program as Shaders.LightmappedGeneric).color
                .set3f(this.testColor.x, this.testColor.y, this.testColor.z);
        }
    }
}