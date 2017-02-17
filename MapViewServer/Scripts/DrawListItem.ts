namespace SourceUtils {
    export class DrawListItem implements IFaceLoadTarget {
        bounds: THREE.Box3;
        parent: Entity;

        private tokenPrefix: string;
        private tokenIndex: number;

        private drawLists: DrawList[] = [];

        private loadedFaces = false;
        private meshHandles: WorldMeshHandle[];

        constructor(tokenPrefix: string, tokenIndex: number) {
            this.tokenPrefix = tokenPrefix;
            this.tokenIndex = tokenIndex;
        }

        getIsVisible(): boolean {
            return this.drawLists.length > 0;
        }

        getIsInDrawList(drawList: DrawList): boolean {
            for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                if (this.drawLists[i] === drawList) {
                    return true;
                }
            }

            return false;
        }

        onAddToDrawList(list: DrawList) {
            if (this.getIsInDrawList(list)) throw "Item added to a draw list twice.";
            this.drawLists.push(list);
        }

        onRemoveFromDrawList(list: DrawList) {
            for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                if (this.drawLists[i] === list) {
                    this.drawLists.splice(i, 1);
                    return;
                }
            }

            throw "Item removed from a draw list it isn't a member of.";
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
            return 0;
        }

        onLoadFaces(handles: WorldMeshHandle[]): void {

            if (this.parent != null) {
                for (let i = 0, iEnd = handles.length; i < iEnd; ++i) {
                    handles[i].parent = this.parent;
                }
            }

            this.meshHandles = handles;
            if (this.getIsVisible()) {
                for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    this.drawLists[i].updateItem(this);
                }
            }
        }

        getApiQueryToken(): string { return `${this.tokenPrefix}${this.tokenIndex}`; }
    }
}