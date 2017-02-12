
namespace SourceUtils {
    export class ShaderManager {
        private programs: { [name: string]: ShaderProgram } = {};
        private gl: WebGLRenderingContext;

        private currentProgram: ShaderProgram;

        constructor(gl: WebGLRenderingContext) {
            this.gl = gl;
        }

        getContext(): WebGLRenderingContext {
            return this.gl;
        }

        getCurrentProgram(): ShaderProgram {
            return this.currentProgram;
        }

        setCurrentProgram(program: ShaderProgram): void {
            if (this.currentProgram != null) {
                this.currentProgram.disableMeshComponents();
            }

            this.currentProgram = program;
        }

        get(name: string): ShaderProgram {
            const program = this.programs[name];
            if (program !== undefined) return program;

            const Type = Shaders[name];
            if (Type === undefined) throw `Unknown shader name '${name}'.`;
            return this.programs[name] = new Type(this);
        }

        dispose(): void {
            for (let name in this.programs) {
                if (this.programs.hasOwnProperty(name)) {
                    this.programs[name].dispose();
                }
            }

            this.programs = {};
        }
    }

    export interface IProgramAttributes {
        [component: number]: number;
    }

    export class ShaderProgramAttributes implements IProgramAttributes {
        [component: number]: number;
    }

    export class Uniform {
        private gl: WebGLRenderingContext;
        private program: ShaderProgram;
        private name: string;
        private location: WebGLUniformLocation;

        constructor(program: ShaderProgram, name: string) {
            this.program = program;
            this.name = name;
            this.gl = program.getContext();
        }

        getLocation(): WebGLUniformLocation {
            if (this.location !== undefined) return this.location;
            if (!this.program.isCompiled()) return undefined;
            this.location = this.gl.getUniformLocation(this.program.getProgram(), this.name);
        }

        set1i(x: number): void {
            this.gl.uniform1i(this.getLocation(), x);
        }

        set1f(x: number): void {
            this.gl.uniform1f(this.getLocation(), x);
        }

        set2f(x: number, y: number): void {
            this.gl.uniform2f(this.getLocation(), x, y);
        }

        set3f(x: number, y: number, z: number): void {
            this.gl.uniform3f(this.getLocation(), x, y, z);
        }

        set4f(x: number, y: number, z: number, w: number): void {
            this.gl.uniform4f(this.getLocation(), x, y, z, w);
        }

        setMatrix4f(value: Float32Array, transpose: boolean = false): void {
            this.gl.uniformMatrix4fv(this.getLocation(), transpose, value);
        }
    }

    export class ShaderProgram {
        private manager: ShaderManager;
        private program: WebGLProgram;
        private compiled = false;

        private vertSource: string;
        private fragSource: string;

        private attribNames: { [name: string]: Api.MeshComponent } = {};
        private attribs: IProgramAttributes;

        viewProjectionMatrix: Uniform;
        modelMatrix: Uniform;

        constructor(manager: ShaderManager) {
            this.manager = manager;

            this.viewProjectionMatrix = new Uniform(this, "uViewProjection");
            this.modelMatrix = new Uniform(this, "uModel");
        }

        dispose(): void {
            if (this.program !== undefined) {
                this.getContext().deleteProgram(this.program);
                this.program = undefined;
            }
        }

        getProgram(): WebGLProgram {
            if (this.program === undefined) {
                return this.program = this.getContext().createProgram();
            }
            return this.program;
        }

        setVertexAttribPointer(component: Api.MeshComponent,
            size: number,
            type: number,
            normalized: boolean,
            stride: number,
            offset: number) {
            const loc = this.attribs[component];
            if (loc === undefined) return;

            this.getContext().vertexAttribPointer(loc, size, type, normalized, stride, offset);
        }

        isCompiled(): boolean {
            return this.compiled;
        }

        use(): boolean {
            if (this.program === undefined) return false;
            if (this.manager.getCurrentProgram() === this) return true;

            this.manager.setCurrentProgram(this);
            this.getContext().useProgram(this.program);

            return true;
        }

        protected addAttribute(name: string, component: Api.MeshComponent) {
            this.attribNames[name] = component;
        }

        getContext(): WebGLRenderingContext {
            return this.manager.getContext();
        }

        protected loadShaderSource(type: number, url: string): void {
            $.get(`${url}?v=${Math.random()}`, source => this.onLoadShaderSource(type, source));
        }

        private hasAllSources(): boolean {
            return this.vertSource !== undefined && this.fragSource !== undefined;
        }

        private onLoadShaderSource(type: number, source: string): void {
            switch (type) {
            case WebGLRenderingContext.VERTEX_SHADER:
                this.vertSource = source;
                break;
            case WebGLRenderingContext.FRAGMENT_SHADER:
                this.fragSource = source;
                break;
            default:
                return;
            }

            if (this.hasAllSources()) {
                this.compile();
            }
        }

        private compileShader(type: number, source: string): WebGLShader {
            const gl = this.getContext();

            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                const error = `Shader compilation error:\n${gl.getShaderInfoLog(shader)}`;
                gl.deleteShader(shader);
                throw error;
            }

            return shader;
        }

        private findAttribLocation(name: string, component: Api.MeshComponent): void {
            const gl = this.getContext();
            const loc = gl.getAttribLocation(this.program, name);

            if (loc === -1) throw `Unable to find attribute with name '${name}'.`;

            this.attribs[component] = loc;
        }

        private compile(): void {
            const gl = this.getContext();

            const vert = this.compileShader(gl.VERTEX_SHADER, this.vertSource);
            const frag = this.compileShader(gl.FRAGMENT_SHADER, this.fragSource);

            const prog = this.getProgram();

            gl.attachShader(prog, vert);
            gl.attachShader(prog, frag);

            gl.linkProgram(prog);

            gl.deleteShader(vert);
            gl.deleteShader(frag);

            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                throw `Program linking error: ${gl.getProgramInfoLog(prog)}`;
            }

            this.attribs = new ShaderProgramAttributes();

            for (let name in this.attribNames) {
                if (this.attribNames.hasOwnProperty(name)) {
                    this.findAttribLocation(name, this.attribNames[name]);
                }
            }

            this.compiled = true;
        }

        private enabledComponents: Api.MeshComponent = 0;

        enableMeshComponents(components: Api.MeshComponent) {
            const gl = this.getContext();
            const diff = this.enabledComponents ^ components;

            let component = 1;
            while (diff >= component) {
                if ((diff & component) === component) {
                    const attrib = this.attribs[component];
                    if (attrib !== undefined) {
                        if ((components & component) === component) gl.enableVertexAttribArray(attrib);
                        else gl.disableVertexAttribArray(attrib);
                    }
                }
                component <<= 1;
            }

            this.enabledComponents = components;
        }

        disableMeshComponents() {
            this.enableMeshComponents(0 as Api.MeshComponent);
        }

        private modelMatrixValue = new THREE.Matrix4();

        prepareForRendering(map: Map, camera: THREE.Camera): void {
            this.modelMatrixValue.getInverse(camera.matrixWorld);

            this.use();
            this.viewProjectionMatrix.setMatrix4f(camera.projectionMatrix.elements);
            this.modelMatrix.setMatrix4f(this.modelMatrixValue.elements);

            const gl = this.getContext();
            gl.cullFace(gl.FRONT);
        }

        changeMaterial(material: Material): void {}
    }

    export namespace Shaders {
        export class LightmappedGeneric extends ShaderProgram {
            baseTexture: Uniform;
            lightmap: Uniform;

            constructor(manager: ShaderManager) {
                super(manager);

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedGeneric.frag.txt");

                this.addAttribute("aPosition", Api.MeshComponent.position);
                this.addAttribute("aTextureCoord", Api.MeshComponent.uv);
                this.addAttribute("aLightmapCoord", Api.MeshComponent.uv2);

                this.baseTexture = new Uniform(this, "uBaseTexture");
                this.lightmap = new Uniform(this, "uLightmap");
            }

            prepareForRendering(map: Map, camera: THREE.Camera): void {
                super.prepareForRendering(map, camera);

                const gl = this.getContext();
                const lightmap = map.getLightmap();
                if (lightmap != null && lightmap.isLoaded()) {
                    gl.activeTexture(gl.TEXTURE0 + 2);
                    gl.bindTexture(gl.TEXTURE_2D, lightmap.getHandle());
                }

                this.lightmap.set1i(2);
            }

            changeMaterial(material: SourceUtils.Material): void {
                const gl = this.getContext();
                const tex = material.properties.baseTexture;

                if (tex != null && tex.isLoaded()) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, tex.getHandle());
                }

                this.baseTexture.set1i(0);
            }
        }
    }
}