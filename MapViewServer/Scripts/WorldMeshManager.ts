namespace SourceUtils
{
    export class DrawListBatch {
        // TODO
    }

    export class WorldMeshManager {
        private gl: WebGLRenderingContext;
        private groups: WorldMeshGroup[] = [];

        constructor(gl: WebGLRenderingContext) {
            this.gl = gl;
        }

        getVertexCount(): number
        {
            let total = 0;
            for (let i = 0; i < this.groups.length; ++i)
            {
                total += this.groups[i].getVertexCount();
            }
            return total;
        }

        getTriangleCount(): number
        {
            let total = 0;
            for (let i = 0; i < this.groups.length; ++i)
            {
                total += this.groups[i].getTriangleCount();
            }
            return total;
        }

        addFaces(faces: FaceData): WorldMeshHandle[] {
            for (let i = 0; i < this.groups.length; ++i) {
                if (this.groups[i].canAddFaces(faces)) return this.groups[i].addFaces(faces);
            }

            const newGroup = new WorldMeshGroup(this.gl, faces.components);
            const result = newGroup.addFaces(faces);
            this.groups.push(newGroup);
            return result;
        }

        dispose(): void {
            for (let i = 0; i < this.groups.length; ++i) {
                this.groups[i].dispose();
            }

            this.groups = [];
        }

        debugPrint(): void {
            console.log(`WorldMeshGroups: ${this.groups.length}, Vertices: ${this.getVertexCount()}, Triangles: ${this.getTriangleCount()}`);
        }
    }
}