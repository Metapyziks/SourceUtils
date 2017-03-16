namespace SourceUtils {
    export interface IVisElem {
        isLeaf: boolean;
        bounds: Box3;

        getAllLeaves(dstArray: VisLeaf[]): void;
    }

    export class VisNode implements IVisElem {
        isLeaf = false;
        bounds: Box3;

        children: IVisElem[];
        plane: Plane;

        private static createVisElem(model: BspModel, info: Api.IBspElem): IVisElem {
            if ((info as any).children != undefined) {
                return new VisNode(model, info as Api.IBspNode);
            } else {
                return new VisLeaf(model, info as Api.IBspLeaf);
            }
        }

        constructor(model: BspModel, info: Api.IBspNode) {
            const normal = info.plane.normal;
            const min = info.min;
            const max = info.max;

            this.plane = new Plane(new Vector3(normal.x, normal.y, normal.z), info.plane.dist);
            this.bounds = new Box3(new Vector3(min.x, min.y, min.z), new Vector3(max.x, max.y, max.z));

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