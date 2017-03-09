
namespace SourceUtils {
    export class ShaderManager {
        private blankTexture: Texture;
        private blankNormalMap: Texture;
        private blankTextureCube: Texture;

        private programs: { [name: string]: ShaderProgram } = {};
        private gl: WebGLRenderingContext;

        constructor(gl: WebGLRenderingContext) {
            this.gl = gl;

            this.blankTexture = new BlankTexture2D(gl, new THREE.Color(1, 1, 1));
            this.blankNormalMap = new BlankTexture2D(gl, new THREE.Color(0.5, 0.5, 1.0));
            this.blankTextureCube = new BlankTextureCube(gl, new THREE.Color(1, 1, 1));
        }

        resetUniformCache(): void {
            for (let name in this.programs) {
                if (this.programs.hasOwnProperty(name)) {
                    this.programs[name].resetUniformCache();
                }
            }
        }

        getBlankTexture(): Texture {
            return this.blankTexture;
        }

        getBlankNormalMap(): Texture {
            return this.blankNormalMap;
        }

        getBlankTextureCube(): Texture {
            return this.blankTexture;
        }

        getContext(): WebGLRenderingContext {
            return this.gl;
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

    export abstract class Uniform {
        protected gl: WebGLRenderingContext;

        private program: ShaderProgram;
        private name: string;
        private location: WebGLUniformLocation;

        private parameter: CommandBufferParameter;

        constructor(program: ShaderProgram, name: string) {
            this.program = program;
            this.name = name;
            this.gl = program.getContext();
        }

        protected getLocation(): WebGLUniformLocation {
            if (this.location !== undefined) return this.location;
            if (!this.program.isCompiled()) return undefined;
            return this.location = this.gl.getUniformLocation(this.program.getProgram(), this.name);
        }

        reset(): void {
            this.parameter = undefined;
        }

        bufferParameter(buf: CommandBuffer, param: CommandBufferParameter) {
            if (this.parameter === param) return;
            this.parameter = param;
            buf.setUniformParameter(this.getLocation(), param);
        }
    }

    export class Uniform1F extends Uniform {
        private x: number;

        reset(): void {
            super.reset();
            this.x = undefined;
        }

        bufferValue(buf: CommandBuffer, x: number): void {
            if (this.x === x) return;
            this.x = x;
            buf.setUniform1F(this.getLocation(), x);
        }

        set(x: number): void {
            this.gl.uniform1f(this.getLocation(), x);
        }
    }

    export class Uniform1I extends Uniform {
        private x: number;

        reset(): void {
            super.reset();
            this.x = undefined;
        }

        bufferValue(buf: CommandBuffer, x: number): void {
            if (this.x === x) return;
            this.x = x;
            buf.setUniform1I(this.getLocation(), x);
        }

        set(x: number): void {
            this.gl.uniform1i(this.getLocation(), x);
        }
    }

    export class Uniform2F extends Uniform {
        private x: number;
        private y: number;

        reset(): void {
            super.reset();
            this.x = undefined;
            this.y = undefined;
        }

        bufferValue(buf: CommandBuffer, x: number, y: number): void {
            if (this.x === x && this.y === y) return;
            this.x = x;
            this.y = y;
            buf.setUniform2F(this.getLocation(), x, y);
        }

        set(x: number, y: number): void {
            this.gl.uniform2f(this.getLocation(), x, y);
        }
    }

    export class Uniform3F extends Uniform {
        private x: number;
        private y: number;
        private z: number;

        reset(): void {
            super.reset();
            this.x = undefined;
            this.y = undefined;
            this.z = undefined;
        }

        bufferValue(buf: CommandBuffer, x: number, y: number, z: number): void {
            if (this.x === x && this.y === y && this.z === z) return;
            this.x = x;
            this.y = y;
            this.z = z;
            buf.setUniform3F(this.getLocation(), x, y, z);
        }

        set(x: number, y: number, z: number): void {
            this.gl.uniform3f(this.getLocation(), x, y, z);
        }
    }

    export class Uniform4F extends Uniform {
        private x: number;
        private y: number;
        private z: number;
        private w: number;

        reset(): void {
            super.reset();
            this.x = undefined;
            this.y = undefined;
            this.z = undefined;
            this.w = undefined;
        }

        bufferValue(buf: CommandBuffer, x: number, y: number, z: number, w: number): void {
            if (this.x === x && this.y === y && this.z === z && this.w === w) return;
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            buf.setUniform4F(this.getLocation(), x, y, z, w);
        }

        set(x: number, y: number, z: number, w: number): void {
            this.gl.uniform4f(this.getLocation(), x, y, z, w);
        }
    }

    export class UniformSampler extends Uniform {
        private value: number;
        private default: Texture;

        private texUnit: number;

        constructor(program: ShaderProgram, name: string) {
            super(program, name);
            this.texUnit = program.reserveNextTextureUnit();
        }

        setDefault(tex: Texture): void {
            this.default = tex;
        }

        reset(): void {
            super.reset();
            this.value = undefined;
        }

        bufferValue(buf: CommandBuffer, tex: Texture): void {
            if (tex == null || !tex.isLoaded()) {
                tex = this.default;
            }

            buf.bindTexture(this.texUnit, tex);

            if (this.value !== this.texUnit) {
                this.value = this.texUnit;
                buf.setUniform1I(this.getLocation(), this.texUnit);
            }
        }

        set(tex: Texture): void {

            if (tex == null || !tex.isLoaded()) {
                tex = this.default;
            }

            this.gl.activeTexture(this.gl.TEXTURE0 + this.texUnit);
            this.gl.bindTexture(tex.getTarget(), tex.getHandle());
            this.gl.uniform1i(this.getLocation(), this.texUnit);
        }
    }

    export class UniformMatrix4 extends Uniform {
        private transpose: boolean;
        private values: Float32Array;

        reset(): void {
            super.reset();
            this.transpose = undefined;
            this.values = undefined;
        }

        bufferValue(buf: CommandBuffer, transpose: boolean, values: Float32Array): void {
            if (this.transpose === transpose && this.values === values) return;
            this.transpose = transpose;
            this.values = values;

            buf.setUniformMatrix4(this.getLocation(), transpose, values);
        }

        set(transpose: boolean, values: Float32Array): void {
            this.gl.uniformMatrix4fv(this.getLocation(), transpose, values);
        }
    }

    export interface IUniformCtor<TUniform extends Uniform> {
        new (program: ShaderProgram, name: string): TUniform;
    }

    export class ShaderProgram {
        private static nextSortIndex = 0;

        private sortIndex: number;

        private manager: ShaderManager;
        private program: WebGLProgram;
        private compiled = false;

        private vertSource: string;
        private fragSource: string;

        private nextTextureUnit = 0;

        private attribNames: { [name: string]: Api.MeshComponent } = {};
        private attribs: IProgramAttributes = {};
        private uniforms: Uniform[] = [];

        sortOrder = 0;

        projectionMatrix: UniformMatrix4;
        viewMatrix: UniformMatrix4;
        modelMatrix: UniformMatrix4;

        constructor(manager: ShaderManager) {
            this.manager = manager;

            this.sortIndex = ShaderProgram.nextSortIndex++;

            this.projectionMatrix = this.addUniform(UniformMatrix4, "uProjection");
            this.viewMatrix = this.addUniform(UniformMatrix4, "uView");
            this.modelMatrix = this.addUniform(UniformMatrix4, "uModel");
        }

        reserveNextTextureUnit(): number {
            return this.nextTextureUnit++;
        }

        resetUniformCache(): void {
            for (let i = 0; i < this.uniforms.length; ++i) {
                this.uniforms[i].reset();
            }
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

        bufferAttribPointer(buf: CommandBuffer, component: Api.MeshComponent,
            size: number,
            type: number,
            normalized: boolean,
            stride: number,
            offset: number) {
            const loc = this.attribs[component];
            if (loc === undefined) return;

            buf.vertexAttribPointer(loc, size, type, normalized, stride, offset);
        }

        isCompiled(): boolean {
            return this.compiled;
        }

        protected addAttribute(name: string, component: Api.MeshComponent): void {
            this.attribNames[name] = component;
        }

        protected addUniform<TUniform extends Uniform>(ctor: IUniformCtor<TUniform>, name: string): TUniform {
            const uniform = new ctor(this, name);
            this.uniforms.push(uniform);
            return uniform;
        }

        getContext(): WebGLRenderingContext {
            return this.manager.getContext();
        }

        private static includeRegex = /^\s*#include\s+\"([^"]+)\"\s*$/m;

        private getShaderSource(url: string, action: (source: string) => void): void {
            $.get(`${url}?v=${Math.random()}`,
                (source: string) => {
                    const match = source.match(ShaderProgram.includeRegex);

                    if (match == null) {
                        action(source);
                        return;
                    }

                    const fileName = match[1];
                    const dirName = url.substr(0, url.lastIndexOf("/") + 1);

                    this.getShaderSource(`${dirName}${fileName}`,
                        include => {
                            action(source.replace(match[0], include));
                        });
                });
        }

        protected loadShaderSource(type: number, url: string): void {
            this.getShaderSource(url, source => this.onLoadShaderSource(type, source));
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
                console.log(source);
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

        bufferEnableMeshComponents(buf: CommandBuffer, components: Api.MeshComponent) {
            const diff = this.enabledComponents ^ components;

            let component = 1;
            while (diff >= component) {
                if ((diff & component) === component) {
                    const attrib = this.attribs[component];
                    if (attrib !== undefined) {
                        if ((components & component) === component) buf.enableVertexAttribArray(attrib);
                        else buf.disableVertexAttribArray(attrib);
                    }
                }
                component <<= 1;
            }

            this.enabledComponents = components;
        }

        bufferDisableMeshComponents(buf: CommandBuffer) {
            this.bufferEnableMeshComponents(buf, 0 as Api.MeshComponent);
        }

        bufferSetup(buf: CommandBuffer, context: RenderContext): void {
            buf.useProgram(this);
            this.projectionMatrix.bufferParameter(buf, CommandBufferParameter.ProjectionMatrix);
            this.viewMatrix.bufferParameter(buf, CommandBufferParameter.ViewMatrix);
        }

        bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void {
            this.modelMatrix.bufferValue(buf, false, value);
        }

        bufferMaterial(buf: CommandBuffer, material: Material): void {
            const gl = this.getContext();

            if (material.properties.noCull) {
                buf.disable(gl.CULL_FACE);
            } else {
                buf.enable(gl.CULL_FACE);
            }
        }
    }

    export namespace Shaders {
        export class Base extends ShaderProgram {
            baseTexture: UniformSampler;

            time: Uniform4F;

            fogParams: Uniform4F;
            fogColor: Uniform3F;
            noFog: Uniform1F;

            protected isTranslucent = false;

            constructor(manager: ShaderManager) {
                super(manager);

                this.addAttribute("aPosition", Api.MeshComponent.Position);
                this.addAttribute("aTextureCoord", Api.MeshComponent.Uv);

                this.baseTexture = this.addUniform(UniformSampler, "uBaseTexture");
                this.baseTexture.setDefault(manager.getBlankTexture());

                this.time = this.addUniform(Uniform4F, "uTime");
                this.fogParams = this.addUniform(Uniform4F, "uFogParams");
                this.fogColor = this.addUniform(Uniform3F, "uFogColor");
                this.noFog = this.addUniform(Uniform1F, "uNoFog");
            }

            bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                super.bufferSetup(buf, context);

                this.time.bufferParameter(buf, CommandBufferParameter.TimeParams);

                const fog = context.fogParams;
                if (fog != null && fog.fogEnabled) {
                    const densMul = fog.fogMaxDensity / ((fog.fogEnd - fog.fogStart) * (context.far - context.near));

                    const nearDensity = (context.near - fog.fogStart) * densMul;
                    const farDensity = (context.far - fog.fogStart) * densMul;

                    const clrMul = 1 / 255;

                    this.fogParams.bufferValue(buf, nearDensity, farDensity, 0, fog.fogMaxDensity);
                    this.fogColor.bufferValue(buf,
                        fog.fogColor.r * clrMul,
                        fog.fogColor.g * clrMul,
                        fog.fogColor.b * clrMul);
                } else {
                    this.fogParams.bufferValue(buf, 0, 0, 0, 0);
                }

                const gl = this.getContext();

                if (this.isTranslucent) {
                    buf.depthMask(false);
                    buf.enable(gl.BLEND);
                    buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                } else {
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                }
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.baseTexture.bufferValue(buf, material.properties.baseTexture);
                this.noFog.bufferValue(buf, material.properties.noFog ? 1 : 0);
            }
        }

        export class LightmappedBase extends Base {
            lightmap: UniformSampler;
            lightmapParams: Uniform4F;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 0;

                this.addAttribute("aLightmapCoord", Api.MeshComponent.Uv2);

                this.lightmap = this.addUniform(UniformSampler, "uLightmap");
                this.lightmap.setDefault(manager.getBlankTexture());

                this.lightmapParams = this.addUniform(Uniform4F, "uLightmapParams");
            }

            bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                super.bufferSetup(buf, context);

                const lightmap = context.getLightmap();

                this.lightmap.bufferValue(buf, lightmap);

                if (lightmap != null && lightmap.isLoaded()) {
                    this.lightmapParams.bufferValue(buf,
                        lightmap.width,
                        lightmap.height,
                        1 / lightmap.width,
                        1 / lightmap.height);
                } else {
                    this.lightmapParams.bufferValue(buf, 1, 1, 1, 1);
                }
            }
        }

        export class LightmappedGeneric extends LightmappedBase {
            alphaTest: Uniform1F;

            constructor(manager: ShaderManager) {
                super(manager);

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedGeneric.frag.txt");

                this.alphaTest = this.addUniform(Uniform1F, "uAlphaTest");
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.alphaTest.bufferValue(buf, material.properties.alphaTest ? 1 : 0);
            }
        }

        export class LightmappedTranslucent extends LightmappedBase {
            alpha: Uniform1F;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 2000;
                this.isTranslucent = true;

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedTranslucent.frag.txt");

                this.alpha = this.addUniform(Uniform1F, "uAlpha");
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.alpha.bufferValue(buf, material.properties.alpha);
            }
        }

        export class Lightmapped2WayBlend extends LightmappedBase {
            baseTexture2: UniformSampler;
            blendModulateTexture: UniformSampler;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 100;

                this.addAttribute("aAlpha", Api.MeshComponent.Alpha);

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Lightmapped2WayBlend.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Lightmapped2WayBlend.frag.txt");

                this.baseTexture2 = this.addUniform(UniformSampler, "uBaseTexture2");
                this.baseTexture2.setDefault(manager.getBlankTexture());

                this.blendModulateTexture = this.addUniform(UniformSampler, "uBlendModulateTexture");
                this.blendModulateTexture.setDefault(manager.getBlankTexture());
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.baseTexture2.bufferValue(buf, material.properties.baseTexture2);
                this.blendModulateTexture.bufferValue(buf, material.properties.blendModulateTexture);
            }
        }

        export class UnlitGeneric extends Base {
            alpha: Uniform1F;
            translucent: Uniform1F;
            alphaTest: Uniform1F;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 200;

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/UnlitGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/UnlitGeneric.frag.txt");

                this.alpha = this.addUniform(Uniform1F, "uAlpha");
                this.translucent = this.addUniform(Uniform1F, "uTranslucent");
                this.alphaTest = this.addUniform(Uniform1F, "uAlphaTest");
            }

            bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                super.bufferSetup(buf, context);

                this.translucent.bufferValue(buf, this.isTranslucent ? 1 : 0);
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.alpha.bufferValue(buf, material.properties.alpha);
                this.alphaTest.bufferValue(buf, material.properties.alphaTest ? 1 : 0);
            }
        }

        export class UnlitTranslucent extends UnlitGeneric {
            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 2200;
                this.isTranslucent = true;
            }
        }

        export class VertexLitGeneric extends Base {
            alpha: Uniform1F;
            translucent: Uniform1F;
            alphaTest: Uniform1F;
            tint: Uniform1F;
            baseAlphaTint: Uniform1F;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 400;

                this.addAttribute("aColorCompressed", Api.MeshComponent.Rgb);

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/VertexLitGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/VertexLitGeneric.frag.txt");

                this.alpha = this.addUniform(Uniform1F, "uAlpha");
                this.translucent = this.addUniform(Uniform1F, "uTranslucent");
                this.alphaTest = this.addUniform(Uniform1F, "uAlphaTest");
                this.tint = this.addUniform(Uniform1F, "uTint");
                this.baseAlphaTint = this.addUniform(Uniform1F, "uBaseAlphaTint");
            }

            bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                super.bufferSetup(buf, context);

                this.translucent.bufferValue(buf, this.isTranslucent ? 1 : 0);
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.alpha.bufferValue(buf, material.properties.alpha);
                this.alphaTest.bufferValue(buf, material.properties.alphaTest ? 1 : 0);
                this.tint.bufferValue(buf, material.properties.noTint ? 0 : 1);
                this.baseAlphaTint.bufferValue(buf, material.properties.baseAlphaTint ? 1 : 0);
            }
        }

        export class VertexLitTranslucent extends VertexLitGeneric {
            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 2400;
                this.isTranslucent = true;
            }
        }

        export class Water extends Base {
            normalMap: UniformSampler;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 1900;
                this.isTranslucent = true;

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Water.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Water.frag.txt");

                this.normalMap = this.addUniform(UniformSampler, "uNormalMap");
                this.normalMap.setDefault(manager.getBlankNormalMap());
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.normalMap.bufferValue(buf, material.properties.normalMap);
            }
        }

        export class Sky extends ShaderProgram {
            cameraPos: Uniform3F;
            skyCube: UniformSampler;

            constructor(manager: ShaderManager) {
                super(manager);

                this.sortOrder = 1000;

                const gl = this.getContext();

                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Sky.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Sky.frag.txt");

                this.addAttribute("aPosition", Api.MeshComponent.Position);

                this.cameraPos = this.addUniform(Uniform3F, "uCameraPos");
                this.skyCube = this.addUniform(UniformSampler, "uSkyCube");
                this.skyCube.setDefault(manager.getBlankTextureCube());
            }

            bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                super.bufferSetup(buf, context);

                this.cameraPos.bufferParameter(buf, CommandBufferParameter.CameraPos);
            }

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                super.bufferMaterial(buf, material);

                this.skyCube.bufferValue(buf, material.properties.baseTexture);
            }
        }
    }
}