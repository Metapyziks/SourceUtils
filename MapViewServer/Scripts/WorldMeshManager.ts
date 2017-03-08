/// <reference path="WorldMeshGroup.ts"/>

namespace SourceUtils
{
    export class WorldMeshManager implements IStateLoggable {
        private gl: WebGLRenderingContext;
        private groups: WorldMeshGroup[] = [];

        constructor(gl: WebGLRenderingContext) {
            this.gl = gl;
        }

        getVertexCount(): number {
            let total = 0;
            for (let i = 0; i < this.groups.length; ++i) {
                total += this.groups[i].getVertexCount();
            }
            return total;
        }

        getTriangleCount(): number {
            let total = 0;
            for (let i = 0; i < this.groups.length; ++i) {
                total += this.groups[i].getTriangleCount();
            }
            return total;
        }

        addMeshData(data: MeshData): WorldMeshHandle[] {
            for (let i = 0; i < this.groups.length; ++i) {
                if (this.groups[i].canAddMeshData(data)) return this.groups[i].addMeshData(data);
            }

            const newGroup = new WorldMeshGroup(this.gl, data.components);
            const result = newGroup.addMeshData(data);
            this.groups.push(newGroup);
            return result;
        }

        dispose(): void {
            for (let i = 0; i < this.groups.length; ++i) {
                this.groups[i].dispose();
            }

            this.groups = [];
        }

        logState(writer: FormattedWriter): void {
            writer.writeProperty("groupCount", this.groups.length);

            for (let i = 0; i < this.groups.length; ++i) {
                writer.beginBlock(`groups[${i}]`);
                this.groups[i].logState(writer);
                writer.endBlock();
            }
        }
    }
}