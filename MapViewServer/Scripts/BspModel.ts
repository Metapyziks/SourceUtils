/// <reference path="Entity.ts"/>

namespace SourceUtils
{
    export class BspModel extends Entity {
        map: Map;

        private info: Api.BspModelResponse;
        private index: number;

        private leaves: VisLeaf[];
        private root: VisNode;
        private drawList: DrawList;

        constructor(map: Map, index: number) {
            super();

            this.map = map;
            this.index = index;
            this.drawList = new DrawList(map);

            this.loadInfo(this.map.info.modelUrl.replace("{index}", index.toString()));
        }

        getDrawList(): DrawList {
            return this.drawList;
        }

        private loadInfo(url: string): void {
            $.getJSON(url,
                (data: Api.BspModelResponse) => {
                    this.info = data;
                    this.loadTree();
                    this.map.onModelLoaded(this);
                });
        }

        private loadTree(): void {
            this.leaves = [];
            this.root = new VisNode(this, Utils.decompress(this.info.tree));
            this.root.getAllLeaves(this.leaves);

            if (this.index !== 0) {
                for (let i = 0; i < this.leaves.length; ++i) {
                    this.drawList.addItem(this.leaves[i]);
                }
            }
        }

        getLeaves(): VisLeaf[] {
            return this.leaves;
        }

        findLeaf(pos: THREE.Vector3): VisLeaf {
            if (this.root == null) return null;

            let elem: IVisElem = this.root;

            while (!elem.isLeaf) {
                const node = elem as VisNode;
                const index = node.plane.normal.dot(pos) >= node.plane.constant ? 0 : 1;
                elem = node.children[index];
            }

            return elem as VisLeaf;
        }

        private viewProjectionMatrix = new THREE.Matrix4();
        private modelMatrix = new THREE.Matrix4();

        render(shaders: ShaderManager, camera: THREE.Camera): void {
            const gl = shaders.getContext();

            const shader = shaders.get("LightmappedGeneric") as Shaders.LightmappedGeneric;
            if (!shader.isCompiled()) return;

            gl.cullFace(gl.FRONT);

            camera.updateMatrixWorld(true);
            this.modelMatrix.getInverse(camera.matrixWorld);

            const lightmap = this.map.getLightmap();
            if (lightmap != null && lightmap.isLoaded()) {
                gl.activeTexture(gl.TEXTURE0 + 2);
                gl.bindTexture(gl.TEXTURE_2D, this.map.getLightmap().getHandle());
            }

            shader.use();
            shader.viewProjectionMatrix.setMatrix4f(camera.projectionMatrix.elements);
            shader.modelMatrix.setMatrix4f(this.modelMatrix.elements);
            shader.lightmap.set1i(2);

            this.drawList.render(shader);
        }
    }
}