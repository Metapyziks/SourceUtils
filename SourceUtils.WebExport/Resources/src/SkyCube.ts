namespace SourceUtils {
    import WebGame = Facepunch.WebGame;

    export class SkyCube extends WebGame.DrawListItem {
        constructor(viewer: MapViewer, material: WebGame.Material) {
            super();

            const meshData: WebGame.IMeshData = {
                attributes: [WebGame.VertexAttribute.uv, WebGame.VertexAttribute.alpha],
                elements: [
                    {
                        mode: WebGame.DrawMode.Triangles,
                        material: material,
                        indexOffset: 0,
                        indexCount: 36
                    }
                ],
                vertices: [],
                indices: []
            };

            for (let face = 0; face < 6; ++face) {
                meshData.vertices.push(0, 0, face);
                meshData.vertices.push(1, 0, face);
                meshData.vertices.push(1, 1, face);
                meshData.vertices.push(0, 1, face);

                const index = face * 4;
                meshData.indices.push(index + 0, index + 1, index + 2);
                meshData.indices.push(index + 0, index + 2, index + 3);
            }

            this.addMeshHandles(viewer.meshes.addMeshData(meshData));
        }
    }
}