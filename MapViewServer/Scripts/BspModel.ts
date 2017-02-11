namespace SourceUtils {
    export class BspModel extends THREE.Mesh {
        map: Map;

        private info: Api.BspModelResponse;
        private index: number;

        private leaves: VisLeaf[];
        private root: VisNode;
        private drawList: DrawList;

        constructor(map: Map, index: number) {
            super(new THREE.BufferGeometry(), map.getLightmapMaterial());

            this.frustumCulled = false;

            this.map = map;
            this.index = index;
            this.drawList = new DrawList(map);

            this.loadInfo(this.map.info.modelUrl.replace("{index}", index.toString()));

            (this.geometry as THREE.BufferGeometry).addAttribute("uv", new THREE.BufferAttribute(new Float32Array(1), 2));
            (this.geometry as THREE.BufferGeometry).addAttribute("uv2", new THREE.BufferAttribute(new Float32Array(1), 2));

            // Hack
            (this as any).onAfterRender = this.onAfterRenderImpl;
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

        onAfterRenderImpl(renderer: THREE.Renderer,
            scene: THREE.Scene,
            camera: THREE.Camera,
            geom: THREE.Geometry,
            mat: THREE.Material,
            group: THREE.Group): void {
            const webGlRenderer = renderer as THREE.WebGLRenderer;

            const props = webGlRenderer.properties;

            const matProps = props.get(this.material);
            const program = matProps.program;
            const attribs = program.getAttributes() as IProgramAttributes;

            this.drawList.render(attribs);
        }
    }
}