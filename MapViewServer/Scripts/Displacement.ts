/// <reference path="DrawListItem.ts"/>

namespace SourceUtils
{
    export class Displacement extends DrawListItem
    {
        clusters: number[];

        constructor(model: BspModel, info: Api.IDisplacement) {
            super("d", info.index);

            this.parent = model;
            this.clusters = info.clusters;

            const min = info.min;
            const max = info.max;

            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
        }
    }
}