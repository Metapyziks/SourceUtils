namespace SourceUtils {
    export class DrawListItem implements IFaceLoadTarget {
        bounds: THREE.Box3;

        private tokenPrefix: string;
        private tokenIndex: number;

        private drawList: DrawList;

        private loadedFaces = false;
        private meshHandles: WorldMeshHandle[];

        constructor(tokenPrefix: string, tokenIndex: number) {
            this.tokenPrefix = tokenPrefix;
            this.tokenIndex = tokenIndex;
        }

        getIsVisible(): boolean {
            return this.drawList != null;
        }

        onAddToDrawList(list: DrawList) {
            this.drawList = list;
        }

        onRemoveFromDrawList(list: DrawList) {
            if (this.drawList === list) this.drawList = null;
        }

        getMeshHandles(loader: FaceLoader): WorldMeshHandle[] {
            if (!this.loadedFaces) {
                this.loadedFaces = true;
                loader.loadFaces(this);
            }

            return this.meshHandles;
        }

        private static rootCenter = new THREE.Vector3();
        private static thisCenter = new THREE.Vector3();

        faceLoadPriority(map: Map): number {
            if (!this.getIsVisible()) return Number.POSITIVE_INFINITY;
            if (this.bounds == null) return Number.MAX_VALUE;

            const root = map.getPvsRoot();
            if ((this as any) === root || root == null) return 0;

            root.bounds.getCenter(DrawListItem.rootCenter);
            this.bounds.getCenter(DrawListItem.thisCenter);

            DrawListItem.rootCenter.sub(DrawListItem.thisCenter);

            return DrawListItem.rootCenter.lengthSq();
        }

        onLoadFaces(handles: WorldMeshHandle[]): void {
            this.meshHandles = handles;
            if (this.getIsVisible()) this.drawList.updateItem(this);
        }

        getApiQueryToken(): string { return `${this.tokenPrefix}${this.tokenIndex}`; }
    }
}