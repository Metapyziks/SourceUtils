namespace SourceUtils {
    export class VisLeaf extends DrawListItem implements IVisElem {
        isLeaf = true;

        leafIndex: number;
        cluster: number;

        constructor(info: Api.BspLeaf) {
            super("l", info.index);

            const min = info.min;
            const max = info.max;

            this.leafIndex = info.index;
            this.cluster = info.cluster === undefined ? -1 : info.cluster;

            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
        }

        getAllLeaves(dstArray: VisLeaf[]): void {
            dstArray.push(this);
        }
    }
}