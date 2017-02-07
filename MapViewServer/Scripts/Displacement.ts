/// <reference path="DrawListItem.ts"/>

namespace SourceUtils
{
    export class Displacement extends DrawListItem
    {
        clusters: number[];

        constructor(info: Api.Displacement) {
            super("d", info.index);
            this.clusters = info.clusters;

            const min = info.min;
            const max = info.max;

            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
        }
    }
}