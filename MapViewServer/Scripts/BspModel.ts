namespace SourceUtils {
    export class BspModel extends THREE.Mesh {
        map: Map;

        private info: Api.BspModelResponse;
        private index: number;

        private leaves: VisLeaf[];
        private root: VisNode;

        constructor(map: Map, index: number) {
            super(new THREE.BufferGeometry(), new THREE.MeshPhongMaterial({ side: THREE.BackSide }));

            this.frustumCulled = false;

            this.map = map;
            this.index = index;

            this.loadInfo(this.map.info.modelUrl.replace("{index}", index.toString()));

            // Hack
            (this as any).onAfterRender = this.onAfterRenderImpl;
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

        onAfterRenderImpl(renderer: THREE.Renderer,
            scene: THREE.Scene,
            camera: THREE.Camera,
            geom: THREE.Geometry,
            mat: THREE.Material,
            group: THREE.Group): void {
            const leaves = this === this.map.getWorldSpawn() ? this.map.getPvs() : this.leaves;

            const webGlRenderer = renderer as THREE.WebGLRenderer;

            const gl = webGlRenderer.context;
            const props = webGlRenderer.properties;

            const matProps = props.get(this.material);
            const program = matProps.program;
            const attribs = program.getAttributes();

            gl.enableVertexAttribArray(attribs["position"]);
            gl.enableVertexAttribArray(attribs["normal"]);

            for (let i = 0, leafCount = leaves.length; i < leafCount; ++i) {
                const leaf = leaves[i];
                leaf.render(gl, attribs);
            }
        }
    }
}