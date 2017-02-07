namespace SourceUtils {
    export interface IVisElem {
        isLeaf: boolean;
        bounds: THREE.Box3;

        getAllLeaves(dstArray: VisLeaf[]): void;
    }

    export class VisNode implements IVisElem {
        isLeaf = false;
        bounds: THREE.Box3;

        children: IVisElem[];
        plane: THREE.Plane;

        private static createVisElem(model: BspModel, info: Api.BspElem): IVisElem {
            if ((info as any).children != undefined) {
                return new VisNode(model, info as Api.BspNode);
            } else {
                return new VisLeaf(info as Api.BspLeaf);
            }
        }

        constructor(model: BspModel, info: Api.BspNode) {
            const normal = info.plane.normal;
            const min = info.min;
            const max = info.max;

            this.plane = new THREE.Plane(new THREE.Vector3(normal.x, normal.y, normal.z), info.plane.dist);
            this.bounds = new THREE.Box3(new THREE.Vector3(min
                    .x,
                    min.y,
                    min.z),
                new THREE.Vector3(max.x, max.y, max.z));

            this.children = [
                VisNode.createVisElem(model, info.children[0]),
                VisNode.createVisElem(model, info.children[1])
            ];
        }

        getAllLeaves(dstArray: VisLeaf[]): void {
            this.children[0].getAllLeaves(dstArray);
            this.children[1].getAllLeaves(dstArray);
        }
    }
}