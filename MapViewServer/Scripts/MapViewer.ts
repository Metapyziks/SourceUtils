/// <reference path="AppBase.ts"/>

namespace SourceUtils {
    export class MapViewer extends AppBase {
        private map: Map;

        init(container: JQuery): void {
            this.camera = new THREE.PerspectiveCamera(60, container.innerWidth() / container.innerHeight(), 1, 2048);
            this.camera.up = new THREE.Vector3(0, 0, 1);

            super.init(container);

            const ambient = new THREE.AmbientLight(0x7EABCF, 0.125);
            this.getScene().add(ambient);

            const directional = new THREE.DirectionalLight(0xFDF4D9);
            directional.position.set(3, -5, 7);
            this.getScene().add(directional);
        }

        loadMap(url: string): void {
            if (this.map != null) {
                this.getScene().remove(this.map);
            }

            this.map = new Map(url);
            this.getScene().add(this.map);
        }
    }
}
