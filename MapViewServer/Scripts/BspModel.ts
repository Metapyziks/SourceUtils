/// <reference path="Entity.ts"/>

namespace SourceUtils {
    export class BspModel extends Entity {
        map: Map;

        clusters: number[];

        private info: Api.IBspModelResponse;
        private index: number;

        private leaves: VisLeaf[];
        private root: VisNode;

        constructor(map: Map, info: Api.IFuncBrush) {
            super();

            this.map = map;
            this.index = info.model;
            this.clusters = info.clusters;

            this.setPosition(info.origin);

            this.loadInfo(this.map.info.modelUrl.replace("{index}", this.index.toString()));
        }

        private loadInfo(url: string): void {
            $.getJSON(url,
                (data: Api.IBspModelResponse) => {
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

            return elem.isLeaf ? elem as VisLeaf : null;
        }
    }
}