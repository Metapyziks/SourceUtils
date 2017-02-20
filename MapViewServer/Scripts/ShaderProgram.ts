
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
        private static nextSortIndex = 0;

        private sortIndex: number;

        private manager: ShaderManager;
        private program: WebGLProgram;
        private compiled = false;

        private vertSource: string;
        private fragSource: string;

        private attribNames: { [name: string]: Api.MeshComponent } = {};
        private attribs: IProgramAttributes = {};

        sortOrder = 0;

        projectionMatrix: Uniform;
        modelViewMatrix: Uniform;

        constructor(manager: ShaderManager) {
            this.manager = manager;

            this.sortIndex = ShaderProgram.nextSortIndex++;

            this.projectionMatrix = new Uniform(this, "uProjection");
            this.modelViewMatrix = new Uniform(this, "uModelView");
        }

        dispose(): void {
            if (this.program !== undefined) {
                this.getContext().deleteProgram(this.program);
                this.program = undefined;
            }
        }

        compareTo(other: ShaderProgram): number {
            if (other === this) return 0;
            const orderCompare = this.sortOrder - other.sortOrder;
            if (orderCompare !== 0) return orderCompare;
            return this.sortIndex - other.sortIndex;
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

        private noCull: boolean;

        prepareForRendering(map: Map, context: RenderContext): void {
            if (!this.isCompiled()) return;

            this.use();
            this.projectionMatrix.setMatrix4f(context.getProjectionMatrix());

            this.noCull = false;
        }

        changeModelTransform(context: RenderContext): void {
            if (!this.isCompiled()) return;
            this.modelViewMatrix.setMatrix4f(context.getModelViewMatrix());
        }

        cleanupPostRender(map: Map, context: RenderContext): void {
            const gl = this.getContext();
            if (this.noCull) gl.enable(gl.CULL_FACE);
        }

        changeMaterial(material: Material): boolean {
            const gl = this.getContext();

            if (this.noCull !== material.properties.noCull) {
                this.noCull = material.properties.noCull;
                if (this.noCull) gl.disable(gl.CULL_FACE);
                else gl.enable(gl.CULL_FACE);
            }

            return true;
        }

        protected setTexture(uniform: Uniform, target: number, unit: number, value: Texture, defaultValue?: Texture): void {
            const gl = this.getContext();

            if ((value == null || !value.isLoaded) && defaultValue != null) {
                value = defaultValue;
            }

            gl.activeTexture(gl.TEXTURE0 + unit);

            if (value == null || !value.isLoaded) {
                gl.bindTexture(target, 0);
            } else {
                gl.bindTexture(target, value.getHandle());
            }

            uniform.set1i(unit);
        }
    }

    export namespace Shaders {
        export class LightmappedBase extends ShaderProgram {
            baseTexture: Uniform;
            lightmap: Uniform;

            fogParams: Uniform;
            fogColor: Uniform;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 0;

                this.addAttribute("aPosition", Api.MeshComponent.position);
                this.addAttribute("aTextureCoord", Api.MeshComponent.uv);
                this.addAttribute("aLightmapCoord", Api.MeshComponent.uv2);

                this.baseTexture = new Uniform(this, "uBaseTexture");
                this.lightmap = new Uniform(this, "uLightmap");

                this.fogParams = new Uniform(this, "uFogParams");
                this.fogColor = new Uniform(this, "uFogColor");
            }

            prepareForRendering(map: Map, context: RenderContext): void {
                super.prepareForRendering(map, context);

                const fog = map.info.fog;
                if (fog.enabled) {
                    const densMul = fog.maxDensity / ((fog.end - fog.start) * (context.far - context.near));

                    const nearDensity = (context.near - fog.start) * densMul;
                    const farDensity = (context.far - fog.start) * densMul;

                    const clrMul = 1 / 255;

                    this.fogParams.set2f(nearDensity, farDensity);
                    this.fogColor.set3f(fog.color.r * clrMul, fog.color.g * clrMul, fog.color.b * clrMul);
                } else {
                    this.fogParams.set2f(0, 0);
                }

                const gl = this.getContext();
                this.setTexture(this.lightmap, gl.TEXTURE_2D, 5, map.getLightmap(), map.getBlankTexture());

                this.lightmap.set1i(5);
            }

            changeMaterial(material: SourceUtils.Material): boolean {
                if (!super.changeMaterial(material)) return false;

                const gl = this.getContext();
                const blank = material.getMap().getBlankTexture();
                this.setTexture(this.baseTexture, gl.TEXTURE_2D, 0, material.properties.baseTexture, blank);

                return true;
            }
        }

        export class LightmappedGeneric extends LightmappedBase {
            alphaTest: Uniform;

            constructor(manager: ShaderManager) {
                super(manager);

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedGeneric.frag.txt");

                this.alphaTest = new Uniform(this, "uAlphaTest");
            }

            changeMaterial(material: SourceUtils.Material): boolean {
                if (!super.changeMaterial(material)) return false;

                this.alphaTest.set1f(material.properties.alphaTest ? 1 : 0);

                return true;
            }
        }

        export class LightmappedTranslucent extends LightmappedBase {
            alpha: Uniform;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 2000;

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedTranslucent.frag.txt");

                this.alpha = new Uniform(this, "uAlpha");
            }

            prepareForRendering(map: SourceUtils.Map, context: RenderContext): void {
                super.prepareForRendering(map, context);

                const gl = this.getContext();

                gl.depthMask(false);

                gl.enable(gl.BLEND);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            }

            changeMaterial(material: SourceUtils.Material): boolean {
                if (!super.changeMaterial(material)) return false;

                this.alpha.set1f(material.properties.alpha);

                return true;
            }

            cleanupPostRender(map: SourceUtils.Map, context: RenderContext): void {
                const gl = this.getContext();

                gl.depthMask(true);
                gl.disable(gl.BLEND);

                super.cleanupPostRender(map, context);
            }
        }

        export class Lightmapped2WayBlend extends LightmappedBase
        {
            baseTexture2: Uniform;
            blendModulateTexture: Uniform;

            constructor(manager: ShaderManager)
            {
                super(manager);

                this.addAttribute("aAlpha", Api.MeshComponent.alpha);

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Lightmapped2WayBlend.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Lightmapped2WayBlend.frag.txt");

                this.baseTexture2 = new Uniform(this, "uBaseTexture2");
                this.blendModulateTexture = new Uniform(this, "uBlendModulateTexture");
            }

            changeMaterial(material: SourceUtils.Material): boolean
            {
                if (!super.changeMaterial(material)) return false;
                
                const gl = this.getContext();
                const blank = material.getMap().getBlankTexture();
                this.setTexture(this.baseTexture, gl.TEXTURE_2D, 1, material.properties.baseTexture2, blank);
                this.setTexture(this.blendModulateTexture, gl.TEXTURE_2D, 2, material.properties.blendModulateTexture, blank);

                return true;
            }
        }

        export class Sky extends ShaderProgram {
            cameraPos: Uniform;
            skyCube: Uniform;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 1000;

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Sky.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Sky.frag.txt");

                this.addAttribute("aPosition", Api.MeshComponent.position);

                this.cameraPos = new Uniform(this, "uCameraPos");
                this.skyCube = new Uniform(this, "uSkyCube");
            }

            prepareForRendering(map: Map, context: RenderContext): void {
                super.prepareForRendering(map, context);

                this.cameraPos.set3f(context.origin.x, context.origin.y, context.origin.z);
            }

            changeMaterial(material: SourceUtils.Material): boolean {
                super.changeMaterial(material);

                const gl = this.getContext();
                const tex = material.properties.baseTexture;

                if (tex == null || !tex.isLoaded()) return false;

                this.setTexture(this.skyCube, gl.TEXTURE_CUBE_MAP, 0, tex);

                return true;
            }
        }
    }
}