namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export namespace Entities {
        export interface IKeyframeRope extends IPvsEntity {
            width: number;
            textureScale: number;
            subDivisions: number;
            slack: number;
            ropeMaterial: number;
            nextKey: string;
            moveSpeed: number;
        }

        export class KeyframeRope extends PvsEntity {
            readonly nextKey: string;
            readonly width: number;
            readonly slack: number;
            readonly subDivisions: number;

            constructor(map: Map, info: IKeyframeRope) {
                super(map, info);

                this.nextKey = info.nextKey;
                this.width = info.width;
                this.slack = info.slack;
                this.subDivisions = info.subDivisions;
            }
        }

        export enum PositionInterpolator {
            Linear = 0,
            CatmullRomSpline = 1,
            Rope = 2
        }

        export interface IMoveRope extends IKeyframeRope {
            positionInterp: PositionInterpolator;
        }

        export class MoveRope extends KeyframeRope {
            private readonly info: IMoveRope;
            private keyframes: KeyframeRope[];
            private material: WebGame.Material;
            private meshHandles: WebGame.MeshHandle[];

            constructor(map: Map, info: IMoveRope) {
                super(map, info);

                this.info = info;
            }

            private findKeyframes(): KeyframeRope[] {
                const list: KeyframeRope[] = [];

                let prev: KeyframeRope = this;
                while (prev != null && list.length < 256) {
                    list.push(prev);
                    prev = this.map.getNamedEntity(prev.nextKey) as KeyframeRope;
                }

                return list;
            }

            private generateMesh(): WebGame.MeshHandle[] {
                if (this.keyframes == null) {
                    this.keyframes = this.findKeyframes();
                }

                if (this.keyframes.length <= 1) {
                    return [];
                }

                if (this.material == null) {
                    this.material = this.map.viewer.mapMaterialLoader.loadMaterial(this.info.ropeMaterial).clone();
                    this.material.addUsage(this);
                }

                const mesh: WebGame.IMeshData = {
                    attributes: [WebGame.VertexAttribute.position, WebGame.VertexAttribute.normal, WebGame.VertexAttribute.uv, WebGame.VertexAttribute.uv2],
                    elements: [],
                    vertices: [],
                    indices: []
                };

                const prev = new Facepunch.Vector3();
                const next = new Facepunch.Vector3();
                const pos = new Facepunch.Vector3();
                const norm = new Facepunch.Vector3();
                const mid = new Facepunch.Vector3();

                // TODO: check current texture res, use info.textureScale
                const texScale = this.info.textureScale / 64;

                this.keyframes[0].getPosition(prev);
                mid.add(prev);

                let totalLength = 0;
                let indexOffset = -4;

                for (let i = 0; i < this.keyframes.length - 1; ++i) {
                    const keyframe = this.keyframes[i];

                    this.keyframes[i + 1].getPosition(next);
                    mid.add(next);

                    const segmentLength = norm.copy(next).sub(prev).length();

                    // TODO: this is just a rough guess
                    // TODO: need to solve `L = 1/2 sqrt(1 + 16 h^2) + (arcsinh(4 h))/(8 h)` for h
                    const slack = (keyframe.slack / segmentLength) * Math.sqrt(segmentLength) * 4.0;
                    norm.normalize();

                    for (let j = 0; j <= keyframe.subDivisions + 1; ++j) {
                        const t = j / (keyframe.subDivisions + 1);
                        const v = (totalLength + segmentLength * t) * texScale;
                        const s = slack * 4 * (t * t - t);

                        pos.copy(next).sub(prev).multiplyScalar(t).add(prev);

                        mesh.vertices.push(pos.x, pos.y, pos.z, norm.x, norm.y, norm.z, 0, v, keyframe.width, s);
                        mesh.vertices.push(pos.x, pos.y, pos.z, norm.x, norm.y, norm.z, 0.25, v, keyframe.width, s);
                        mesh.vertices.push(pos.x, pos.y, pos.z, norm.x, norm.y, norm.z, 0.75, v, keyframe.width, s);
                        mesh.vertices.push(pos.x, pos.y, pos.z, norm.x, norm.y, norm.z, 1, v, keyframe.width, s);

                        if (j > 0) {
                            for (let k = 0; k < 3; ++k) {
                                mesh.indices.push(
                                    indexOffset + k, indexOffset + k + 4, indexOffset + k + 1,
                                    indexOffset + k + 1, indexOffset + k + 4, indexOffset + k + 5
                                );
                            }
                        }

                        indexOffset += 4;
                    }

                    totalLength += segmentLength;

                    prev.copy(next);
                }

                mid.multiplyScalar(1 / this.keyframes.length);

                this.map.getLeafAt(mid, leaf => {
                    const ambient = (this.material.properties as Shaders.SplineRopeMaterial).ambient = new Array<Facepunch.Vector3>(6);
                    leaf.getAmbientCube(mid, ambient, success => {
                        if (success) this.map.viewer.forceDrawListInvalidation(false);
                    });
                });

                mesh.elements.push({
                    mode: WebGame.DrawMode.Triangles,
                    material: this.material,
                    indexOffset: 0,
                    indexCount: mesh.indices.length
                });

                return this.map.viewer.meshes.addMeshData(mesh);
            }

            onAddToDrawList(list: Facepunch.WebGame.DrawList): void {
                super.onAddToDrawList(list);

                if (this.meshHandles == null) {
                    this.meshHandles = this.generateMesh();
                }
            }

            getMeshHandles(): Facepunch.WebGame.MeshHandle[] {
                return this.meshHandles;
            }
        }
    }
}