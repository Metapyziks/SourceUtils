/// <reference path="AppBase.ts"/>
/// <reference path="typings/lz-string/lz-string.d.ts"/>

namespace SourceUtils {
    class Vector3Data {
        x: number;
        y: number;
        z: number;
    }

    class MdlData {
        hullMin: Vector3Data;
        hullMax: Vector3Data;
        materials: string[];
        vertices: string;
        triangles: string;
    }

    class MaterialPropertiesData {
        baseTexture: string;
        bumpMap: string;
    }

    class ShaderData {
        material: string;
        properties: MaterialPropertiesData;
        sourceName: string;
        sourceProperties: any;
    }

    class VmtData {
        shaders: ShaderData[];
    }

    class VvdData {
        numLods: number;
        lod: number;
        vertices: string;
        normals: string;
        texcoords: string;
    }

    class MeshData {
        materialIndex: number;
        start: number;
        length: number;
    }

    class VtxData {
        numLods: number;
        lod: number;
        meshes: MeshData[];
        triangles: string;
    }

    class VtfData {
        width: number;
        height: number;
        flags: number;
        png: string;
        mipmaps: number;
    }

    export class ModelViewer extends AppBase {
        private vvd: VvdData;
        private vtx: VtxData;

        private cameraAngle = 0;

        private texLoader: THREE.TextureLoader;

        private geometry: THREE.BufferGeometry;
        private material: THREE.MeshNormalMaterial;
        private mesh: THREE.Mesh;

        private hullSize = new THREE.Vector3();
        private hullCenter = new THREE.Vector3();

        init(container: JQuery): void {
            this.texLoader = new THREE.TextureLoader();

            this.camera = new THREE.PerspectiveCamera(60, container.innerWidth() / container.innerHeight(), 1, 2048);
            this.camera.up = new THREE.Vector3(0, 0, 1);

            super.init(container);

            const ambient = new THREE.AmbientLight(0x7EABCF, 0.125);
            this.getScene().add(ambient);

            const directionalA = new THREE.DirectionalLight(0xFDF4D9);
            directionalA.position.set(3, -5, 7);
            this.getScene().add(directionalA);

            const directionalB = new THREE.DirectionalLight(0x7EABCF, 0.25);
            directionalB.position.set(-4, 6, -1);
            this.getScene().add(directionalB);
        }

        loadModel(url: string): void {
            $.getJSON(url, (mdl: MdlData, status: string) => this.onLoadMdl(mdl, status));

            if (this.mesh != null) {
                this.getScene().remove(this.mesh);
            }

            this.geometry = new THREE.BufferGeometry();
            this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0xff00ff }));
            this.getScene().add(this.mesh);
        }

        private onLoadMdl(mdl: MdlData, status: string) {
            this.vvd = null;
            this.vtx = null;

            this.hullSize.set(
                mdl.hullMax.x - mdl.hullMin.x,
                mdl.hullMax.y - mdl.hullMin.y,
                mdl.hullMax.z - mdl.hullMin.z);

            this.hullCenter.set(
                mdl.hullMin.x + this.hullSize.x * 0.5,
                mdl.hullMin.y + this.hullSize.y * 0.5,
                mdl.hullMin.z + this.hullSize.z * 0.5);

            this.geometry.boundingBox = new THREE.Box3(mdl.hullMin as any, mdl.hullMax as any);

            for (let i = 0; i < mdl.materials.length; ++i) {
                $.getJSON(mdl.materials[i], (vmt: VmtData, status: string) => this.onLoadVmt(i, vmt, status));
            }

            $.getJSON(mdl.vertices.replace("{lod}", "0"), (vvd: VvdData, status: string) => this.onLoadVvd(vvd, status));
            $.getJSON(mdl.triangles.replace("{lod}", "0"), (vtx: VtxData, status: string) => this.onLoadVtx(vtx, status));
        }

        private decompressFloat32Array(base64: string): Float32Array {
            const str = LZString.decompressFromBase64(base64);
            return new Float32Array(JSON.parse(str));
        }

        private decompressUint32Array(base64: string): Uint32Array {
            const str = LZString.decompressFromBase64(base64);
            return new Uint32Array(JSON.parse(str));
        }

        private loadVtf(url: string, action: (tex: THREE.Texture) => void): void
        {
            $.getJSON(url, (vtf: VtfData, status: string) => {
                const minMipMap = Math.max(vtf.mipmaps - 4, 0);
                let bestMipMap = vtf.mipmaps;
                for (let i = minMipMap; i >= 0; --i)
                {
                    this.texLoader.load(vtf.png.replace("{mipmap}", i.toString()), tex => {
                        if (i >= bestMipMap) return;
                        bestMipMap = i;
                        tex.wrapS = THREE.RepeatWrapping;
                        tex.wrapT = THREE.RepeatWrapping;
                        action(tex);
                    });
                }
            });
        }

        private onLoadVmt(index: number, vmt: VmtData, status: string): void {
            const shader = vmt.shaders[0];
            if (shader == null) return;

            const mat: THREE.Material = new THREE[shader.material]({side: THREE.BackSide});

            for (let key in shader.properties) {
                if (!shader.properties.hasOwnProperty(key)) continue;
                const value = shader.properties[key];
                switch (key) {
                case "map":
                    this.loadVtf(value, tex => {
                        (mat as any).map = tex;
                        mat.needsUpdate = true;
                    });
                    break;
                case "bumpMap":
                    this.loadVtf(value, tex => {
                        (mat as any).bumpMap = tex;
                        mat.needsUpdate = true;
                    });
                    break;
                case "specularMap":
                    this.loadVtf(value, tex =>
                    {
                        (mat as any).specularMap = tex;
                        mat.needsUpdate = true;
                    });
                    break;
                }
            }

            const hasMultiMat = (this.mesh.material as any).materials != null;

            if (!hasMultiMat) {
                if (index === 0) {
                    this.mesh.material = mat;
                    return;
                } else {
                    const oldMat = this.mesh.material;
                    this.mesh.material = new THREE.MultiMaterial([oldMat]);
                }
            }

            const multiMat = this.mesh.material as THREE.MultiMaterial;

            multiMat.materials[index] = mat;
            multiMat.needsUpdate = true;
        }

        private onLoadVvd(vvd: VvdData, status: string): void {
            this.vvd = vvd;
            if (this.vtx != null) this.updateModel();
        }

        private onLoadVtx(vtx: VtxData, status: string): void {
            this.vtx = vtx;
            if (this.vvd != null) this.updateModel();
        }

        private updateModel(): void {
            this.geometry.addAttribute("position", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.vertices), 3));
            this.geometry.addAttribute("normal", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.normals), 3, true));
            this.geometry.addAttribute("uv", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.texcoords), 2));
            this.geometry.setIndex(new THREE.BufferAttribute(this.decompressUint32Array(this.vtx.triangles), 1));

            for (let i = 0; i < this.vtx.meshes.length; ++i) {
                const mesh = this.vtx.meshes[i];
                this.geometry.addGroup(mesh.start, mesh.length, mesh.materialIndex);
            }
        }

        onRenderFrame(dt: number): void {
            this.cameraAngle += dt;

            const radius = this.hullSize.length();

            this.mesh.rotation.set(0, 0, this.cameraAngle * 0.25);
            this.camera.position.set(Math.cos(this.cameraAngle) * radius,
                Math.sin(this.cameraAngle) * radius,
                0.5 * radius);
            this.camera.position.add(this.hullCenter);
            this.camera.lookAt(this.hullCenter);

            super.onRenderFrame(dt);
        }
    }
}
