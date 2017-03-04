namespace SourceUtils {
    export class VisLeaf extends BspDrawListItem implements IVisElem {
        isLeaf = true;

        leafIndex: number;
        cluster: number;

        canSeeSky2D: boolean;
        canSeeSky3D: boolean;

        constructor(model: BspModel, info: Api.IBspLeaf) {
            super(model.map, "l", info.index);

            const min = info.min;
            const max = info.max;

            this.parent = model;

            this.leafIndex = info.index;
            this.cluster = info.cluster === undefined ? -1 : info.cluster;

            this.canSeeSky2D = (info.flags & Api.LeafFlags.Sky2D) !== 0;
            this.canSeeSky3D = (info.flags & Api.LeafFlags.Sky) !== 0;

            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z),
                new THREE.Vector3(max.x, max.y, max.z));
        }

        getAllLeaves(dstArray: VisLeaf[]): void {
            dstArray.push(this);
        }
    }
}