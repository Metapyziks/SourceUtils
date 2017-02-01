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

    enum PropertyType {
        Boolean,
        Number,
        Texture
    }

    class MaterialPropertiesData
    {
        name: string;
        type: PropertyType;
        value: any;
    }

    class ShaderData {
        material: string;
        properties: MaterialPropertiesData[];
        sourceName: string;
        sourceProperties: any;
    }

    class VmtData {
        shaders: ShaderData[];
    }

    class VvdData {
        numLods: number;
        lod: number;
        vertices: string | number[];
        normals: string | number[];
        texcoords: string | number[];
        tangents: string | number[];
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
        indices: string | number[];
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

        private directionalA: THREE.DirectionalLight;
        private directionalB: THREE.DirectionalLight;

        private hullSize = new THREE.Vector3();
        private hullCenter = new THREE.Vector3();

        init(container: JQuery): void {
            this.texLoader = new THREE.TextureLoader();

            this.camera = new THREE.PerspectiveCamera(60, container.innerWidth() / container.innerHeight(), 1, 2048);
            this.camera.up = new THREE.Vector3(0, 0, 1);

            super.init(container);

            const ambient = new THREE.AmbientLight(0x7EABCF, 0.125);
            this.getScene().add(ambient);

            this.directionalA = new THREE.DirectionalLight(0xFDF4D9);
            this.directionalA.position.set(3, -5, 7);
            this.getScene().add(this.directionalA);

            this.directionalB = new THREE.DirectionalLight(0x7EABCF, 0.25);
            this.directionalB.position.set(-4, 6, -1);
            this.getScene().add(this.directionalB);
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

        private decompressFloat32Array(value: string | number[]): Float32Array
        {
            if (typeof value === "string")
            {
                const str = LZString.decompressFromBase64(value);
                return new Float32Array(JSON.parse(str));
            }

            return new Float32Array(value as number[]);
        }

        private decompressUint32Array(value: string | number[]): Uint32Array
        {
            if (typeof value === "string")
            {
                const str = LZString.decompressFromBase64(value);
                return new Uint32Array(JSON.parse(str));
            }

            return new Uint32Array(value as number[]);
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

            const mat: THREE.Material = new THREE[shader.material]();

            for (let i = 0; i < shader.properties.length; ++i) {
                const prop = shader.properties[i];
                switch (prop.type) {
                case PropertyType.Texture:
                    this.loadVtf(prop.value, tex =>
                    {
                        mat[prop.name] = tex;
                        mat.needsUpdate = true;
                        });
                    break;
                default:
                    mat[prop.name] = prop.value;
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
            if (this.vvd.vertices != null) this.geometry.addAttribute("position", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.vertices), 3));
            if (this.vvd.normals != null) this.geometry.addAttribute("normal", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.normals), 3, true));
            if (this.vvd.texcoords != null) this.geometry.addAttribute("uv", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.texcoords), 2));
            if (this.vvd.tangents != null) this.geometry.addAttribute("tangent", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.tangents), 4));
            this.geometry.setIndex(new THREE.BufferAttribute(this.decompressUint32Array(this.vtx.indices), 1));

            for (let i = 0; i < this.vtx.meshes.length; ++i) {
                const mesh = this.vtx.meshes[i];
                this.geometry.addGroup(mesh.start, mesh.length, mesh.materialIndex);
            }
        }

        onRenderFrame(dt: number): void {
            this.cameraAngle += dt * 0.25;

            const radius = this.hullSize.length();

            this.camera.position.set(Math.cos(this.cameraAngle) * radius,
                Math.sin(this.cameraAngle) * radius,
                0.5 * radius);

            this.directionalA.position.set(Math.cos(this.cameraAngle * 2.67),
                Math.sin(this.cameraAngle * 2.67), 0.75);
            this.directionalB.position.set(Math.cos(this.cameraAngle * 2.67 + 2.8),
                Math.sin(this.cameraAngle * 2.67 + 2.8), -0.5);

            this.camera.position.add(this.hullCenter);
            this.camera.lookAt(this.hullCenter);

            super.onRenderFrame(dt);
        }
    }
}
