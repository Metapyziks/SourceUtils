
namespace SourceUtils {
    export type CommandBufferAction = (gl: WebGLRenderingContext, args: ICommandBufferItem) => void;

    export interface ICommandBufferItem {
        action?: CommandBufferAction;

        parameter?: CommandBufferParameter;
        program?: WebGLProgram;
        uniform?: WebGLUniformLocation;
        target?: number;
        unit?: number;
        texture?: WebGLTexture;
        transpose?: boolean;
        values?: Float32Array;
        context?: RenderContext;
        x?: number;
        y?: number;
        z?: number;
        w?: number;
    }

    export enum CommandBufferParameter {
        ProjectionMatrix,
        ModelViewMatrix,
        TimeParams
    }

    export class CommandBuffer {
        private context: WebGLRenderingContext;

        private commands: ICommandBufferItem[] = [];

        private boundTextures: Texture[] = [];
        private currentProgram: ShaderProgram;

        private parameters: Float32Array[] = [];

        constructor(context: WebGLRenderingContext) {
            this.context = context;
        }

        clear(): void {
            this.boundTextures = [];
            this.commands = [];
            this.currentProgram = undefined;
        }

        setParameter(param: CommandBufferParameter, value: Float32Array): void {
            while (this.parameters.length <= param) {
                this.parameters.push(undefined);
            }

            this.parameters[param] = value;
        }

        run(renderContext: RenderContext): void {
            const gl = this.context;

            for (let i = 0, iEnd = this.commands.length; i < iEnd; ++i) {
                const command = this.commands[i];
                command.action(gl, command);
            }
        }

        private push(action: CommandBufferAction, args: ICommandBufferItem): void {
            args.action = action;
            this.commands.push(args);
        }

        useProgram(program: ShaderProgram): void {
            if (this.currentProgram === program) return;
            this.currentProgram = program;

            this.push(this.onUseProgram, { program: program.getProgram() });

            program.bufferSetup(this);
        }

        private onUseProgram(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.useProgram(args.program);
        }

        setUniformParameter(uniform: WebGLUniformLocation, parameter: CommandBufferParameter) {
            this.push(this.onUseProgram, { uniform: uniform, parameter: parameter });
        }

        private onSetUniformParameter(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            const value = this.parameters[args.parameter];
            if (value === undefined) return;

            switch (args.parameter) {
                case CommandBufferParameter.ProjectionMatrix:
                case CommandBufferParameter.ModelViewMatrix:
                    gl.uniformMatrix4fv(args.uniform, false, value);
                    break;
                case CommandBufferParameter.TimeParams:
                    gl.uniform4fv(args.uniform, value);
                    break;
            }
        }

        setUniform1F(uniform: WebGLUniformLocation, x: number): void {
            this.push(this.onSetUniform1F, { uniform: uniform, x: x });
        }

        private onSetUniform1F(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.uniform1f(args.uniform, args.x);
        }

        setUniform1I(uniform: WebGLUniformLocation, x: number): void {
            this.push(this.onSetUniform1I, { uniform: uniform, x: x });
        }

        private onSetUniform1I(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.uniform1i(args.uniform, args.x);
        }

        setUniform2F(uniform: WebGLUniformLocation, x: number, y: number): void {
            this.push(this.onSetUniform2F, { uniform: uniform, x: x, y: y });
        }

        private onSetUniform2F(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.uniform2f(args.uniform, args.x, args.y);
        }

        setUniform3F(uniform: WebGLUniformLocation, x: number, y: number, z: number): void {
            this.push(this.onSetUniform3F, { uniform: uniform, x: x, y: y, z: z });
        }

        private onSetUniform3F(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.uniform3f(args.uniform, args.x, args.y, args.z);
        }

        setUniform4F(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void {
            this.push(this.onSetUniform4F, { uniform: uniform, x: x, y: y, z: z, w: w });
        }

        private onSetUniform4F(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.uniform4f(args.uniform, args.x, args.y, args.z, args.w);
        }

        setUniformMatrix4(uniform: WebGLUniformLocation, transpose: boolean, values: Float32Array): void {
            this.push(this.onSetUniform4F, { uniform: uniform, transpose: transpose, values: values });
        }

        private onSetUniformMatrix4(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.uniformMatrix4fv(args.uniform, args.transpose, args.values);
        }

        bindTexture(unit: number, value: Texture): void {
            while (unit >= this.boundTextures.length) {
                this.boundTextures.push(null);
            }

            if (this.boundTextures[unit] === value) return;
            this.boundTextures[unit] = value;

            unit += this.context.TEXTURE0;

            this.push(this.onBindTexture, { unit: unit, target: value.getTarget(), texture: value.getHandle() });
        }

        private onBindTexture(gl: WebGLRenderingContext, args: ICommandBufferItem) {
            gl.activeTexture(args.unit);
            gl.bindTexture(args.target, args.texture);
        }
    }
}