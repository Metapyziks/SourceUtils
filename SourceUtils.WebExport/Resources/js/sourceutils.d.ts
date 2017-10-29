/// <reference path="facepunch.webgame.d.ts" />
/// <reference path="jquery.d.ts" />
declare namespace SourceUtils {
    interface IPageRequest<TValue, TPage> {
        index: number;
        callback: (payload: TValue, page: TPage) => void;
    }
    abstract class ResourcePage<TPayload, TValue> {
        readonly first: number;
        readonly count: number;
        readonly url: string;
        private readonly values;
        private toLoad;
        protected page: TPayload;
        constructor(info: IPageInfo);
        getLoadPriority(): number;
        getValue(index: number): TValue;
        protected abstract onGetValue(index: number): TValue;
        load(index: number, callback: (payload: TValue, page: ResourcePage<TPayload, TValue>) => void): TValue;
        onLoadValues(page: TPayload): void;
    }
    abstract class PagedLoader<TPage extends ResourcePage<TPayload, TValue>, TPayload, TValue> implements Facepunch.ILoader {
        private pages;
        private readonly toLoad;
        private active;
        private loadProgress;
        protected abstract onCreatePage(page: IPageInfo): TPage;
        getLoadProgress(): number;
        load(index: number, callback: (payload: TValue, page: TPage) => void): TValue;
        setPageLayout(pages: IPageInfo[]): void;
        private getNextToLoad();
        update(requestQuota: number): number;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    interface IPlane {
        norm: Facepunch.IVector3;
        dist: number;
    }
    interface IBspElement {
        min: Facepunch.IVector3;
        max: Facepunch.IVector3;
    }
    interface IBspNode extends IBspElement {
        plane: IPlane;
        children: IBspElement[];
    }
    enum LeafFlags {
        Sky = 1,
        Radial = 2,
        Sky2D = 4,
    }
    interface IBspLeaf extends IBspElement {
        index: number;
        flags: LeafFlags;
        hasFaces: boolean;
        cluster?: number;
    }
    interface IBspModel {
        index: number;
        min: Facepunch.IVector3;
        max: Facepunch.IVector3;
        origin: Facepunch.IVector3;
        headNode: IBspNode;
    }
    class Plane {
        norm: Facepunch.Vector3;
        dist: number;
        copy(plane: IPlane): this;
    }
    interface INodeOrLeaf {
        readonly isLeaf: boolean;
    }
    class BspNode implements INodeOrLeaf {
        private readonly loader;
        readonly isLeaf: boolean;
        readonly plane: Plane;
        readonly children: (BspNode | BspLeaf)[];
        constructor(loader: LeafGeometryLoader, info: IBspNode);
        private loadChild(value);
        findLeaves(target: BspLeaf[]): void;
    }
    class BspLeaf extends WebGame.DrawListItem implements INodeOrLeaf {
        readonly isLeaf: boolean;
        private readonly loader;
        readonly index: number;
        readonly flags: LeafFlags;
        readonly cluster: number;
        readonly hasFaces: boolean;
        private hasLoaded;
        constructor(loader: LeafGeometryLoader, info: IBspLeaf);
        getMeshHandles(): Facepunch.WebGame.MeshHandle[];
        findLeaves(target: BspLeaf[]): void;
    }
    class BspModel extends WebGame.RenderResource<BspModel> {
        readonly viewer: MapViewer;
        private info;
        private headNode;
        private leaves;
        constructor(viewer: MapViewer);
        loadFromInfo(info: IBspModel): void;
        getLeafAt(pos: Facepunch.IVector3): BspLeaf;
        getLeaves(): BspLeaf[];
        isLoaded(): boolean;
    }
    interface IBspModelPage {
        models: IBspModel[];
    }
    class BspModelPage extends ResourcePage<IBspModelPage, IBspModel> {
        private readonly viewer;
        private models;
        constructor(viewer: MapViewer, page: IPageInfo);
        onLoadValues(page: IBspModelPage): void;
        onGetValue(index: number): IBspModel;
    }
    class BspModelLoader extends PagedLoader<BspModelPage, IBspModelPage, IBspModel> {
        readonly viewer: MapViewer;
        private readonly models;
        constructor(viewer: MapViewer);
        loadModel(index: number): BspModel;
        onCreatePage(page: IPageInfo): BspModelPage;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    interface IDispGeometryPage {
        displacements: IFace[];
        materials: IMaterialGroup[];
    }
    class DispGeometryPage extends ResourcePage<IDispGeometryPage, WebGame.MeshHandle> {
        private readonly viewer;
        private matGroups;
        private dispFaces;
        constructor(viewer: MapViewer, page: IPageInfo);
        onLoadValues(page: IDispGeometryPage): void;
        protected onGetValue(index: number): Facepunch.WebGame.MeshHandle;
    }
    class DispGeometryLoader extends PagedLoader<DispGeometryPage, IDispGeometryPage, WebGame.MeshHandle> {
        readonly viewer: MapViewer;
        constructor(viewer: MapViewer);
        protected onCreatePage(page: IPageInfo): DispGeometryPage;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Entities {
        interface IEntity {
            classname: string;
            origin?: Facepunch.IVector3;
            angles?: Facepunch.IVector3;
        }
        interface IColor {
            r: number;
            g: number;
            b: number;
        }
        interface IEnvFogController extends IEntity {
            fogEnabled: boolean;
            fogStart: number;
            fogEnd: number;
            fogMaxDensity: number;
            farZ: number;
            fogColor: IColor;
        }
        class Entity extends WebGame.DrawableEntity {
            readonly map: Map;
            constructor(map: Map, info: IEntity);
        }
        interface IPvsEntity extends IEntity {
            clusters: number[];
        }
        class PvsEntity extends Entity {
            private readonly clusters;
            constructor(map: Map, info: IPvsEntity);
            isInCluster(cluster: number): boolean;
            isInAnyCluster(clusters: number[]): boolean;
            populateDrawList(drawList: WebGame.DrawList, clusters: number[]): void;
            protected onPopulateDrawList(drawList: WebGame.DrawList, clusters: number[]): void;
        }
    }
}
declare namespace SourceUtils {
    namespace Entities {
        interface IBrushEntity extends IPvsEntity {
            model: number;
        }
        class BrushEntity extends PvsEntity {
            readonly model: BspModel;
            readonly isWorldSpawn: boolean;
            constructor(map: Map, info: IBrushEntity);
            onAddToDrawList(list: Facepunch.WebGame.DrawList): void;
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Entities {
        interface ISkyCamera extends IEnvFogController {
            scale: number;
        }
        class Camera extends WebGame.PerspectiveCamera {
            readonly viewer: MapViewer;
            private leaf;
            private leafInvalid;
            render3DSky: boolean;
            constructor(viewer: MapViewer, fov: number);
            protected onChangePosition(): void;
            private static readonly onGetLeaf_temp;
            protected onGetLeaf(): BspLeaf;
            getLeaf(): BspLeaf;
            protected onPopulateDrawList(drawList: Facepunch.WebGame.DrawList): void;
            render(): void;
        }
        class SkyCamera extends Camera {
            private readonly origin;
            private readonly skyScale;
            constructor(viewer: MapViewer, info: ISkyCamera);
            protected onChangePosition(): void;
            protected onGetLeaf(): BspLeaf;
            private static readonly renderRelativeTo_temp;
            renderRelativeTo(camera: Camera): void;
        }
        class ShadowCamera extends WebGame.OrthographicCamera {
            readonly viewer: MapViewer;
            private readonly targetCamera;
            constructor(viewer: MapViewer, targetCamera: Camera);
            protected onPopulateDrawList(drawList: Facepunch.WebGame.DrawList): void;
            private addToFrustumBounds(invLight, vec, bounds);
            private static readonly getFrustumBounds_vec;
            private static readonly getFrustumBounds_invLight;
            private getFrustumBounds(lightRotation, near, far, bounds);
            private static readonly renderShadows_bounds;
            renderShadows(lightRotation: Facepunch.Quaternion, near: number, far: number): void;
        }
    }
}
declare namespace SourceUtils {
    namespace Entities {
        interface IDisplacement extends IPvsEntity {
            index: number;
        }
        class Displacement extends PvsEntity {
            private readonly index;
            private isLoaded;
            constructor(map: Map, info: IDisplacement);
            onAddToDrawList(list: Facepunch.WebGame.DrawList): void;
        }
    }
}
declare namespace SourceUtils {
    namespace Entities {
        interface IStaticProp extends IPvsEntity {
            model: number;
            vertLighting?: number;
            albedoModulation?: number;
        }
        class StaticProp extends PvsEntity {
            readonly model: StudioModel;
            private lighting;
            private albedoModulation?;
            constructor(map: Map, info: IStaticProp);
            private checkLoaded();
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Entities {
        interface IWorldspawn extends IBrushEntity {
            skyMaterial: WebGame.IMaterialInfo;
        }
        class Worldspawn extends BrushEntity {
            private readonly clusterLeaves;
            constructor(map: Map, info: IWorldspawn);
            private onModelLoad();
            isInAnyCluster(clusters: number[]): boolean;
            isInCluster(cluster: number): boolean;
            protected onPopulateDrawList(drawList: Facepunch.WebGame.DrawList, clusters: number[]): void;
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    interface IFace {
        material: number;
        element: number;
    }
    interface IMaterialGroup {
        material: number;
        meshData: WebGame.ICompressedMeshData;
    }
    interface ILeafGeometryPage {
        leaves: IFace[][];
        materials: IMaterialGroup[];
    }
    class LeafGeometryPage extends ResourcePage<ILeafGeometryPage, WebGame.MeshHandle[]> {
        private readonly viewer;
        private matGroups;
        private leafFaces;
        constructor(viewer: MapViewer, page: IPageInfo);
        onLoadValues(page: ILeafGeometryPage): void;
        protected onGetValue(index: number): Facepunch.WebGame.MeshHandle[];
    }
    class LeafGeometryLoader extends PagedLoader<LeafGeometryPage, ILeafGeometryPage, WebGame.MeshHandle[]> {
        readonly viewer: MapViewer;
        constructor(viewer: MapViewer);
        protected onCreatePage(page: IPageInfo): LeafGeometryPage;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    interface IPageInfo {
        first: number;
        count: number;
        url: string;
    }
    interface IMap {
        name: string;
        lightmapUrl: string;
        visPages: IPageInfo[];
        leafPages: IPageInfo[];
        dispPages: IPageInfo[];
        materialPages: IPageInfo[];
        brushModelPages: IPageInfo[];
        studioModelPages: IPageInfo[];
        vertLightingPages: IPageInfo[];
        entities: Entities.IEntity[];
    }
    class Map implements WebGame.ICommandBufferParameterProvider {
        static readonly lightmapParam: WebGame.CommandBufferParameter;
        readonly viewer: MapViewer;
        skyCamera: Entities.SkyCamera;
        private tSpawns;
        private ctSpawns;
        private playerSpawns;
        private worldspawn;
        private pvsEntities;
        private lightmap;
        private skyCube;
        private info;
        private clusterVis;
        private clusterEnts;
        constructor(viewer: MapViewer);
        isReady(): boolean;
        unload(): void;
        load(url: string): void;
        getLightmapLoadProgress(): number;
        private onLoad(info);
        getPvsEntitiesInCluster(cluster: number): Entities.PvsEntity[];
        getLeafAt(pos: Facepunch.IVector3): BspLeaf;
        populateDrawList(drawList: WebGame.DrawList, pvsRoot: BspLeaf): void;
        populateCommandBufferParameters(buf: Facepunch.WebGame.CommandBuffer): void;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    interface IMapMaterialPage {
        textures: WebGame.ITextureInfo[];
        materials: WebGame.IMaterialInfo[];
    }
    class MapMaterialPage extends ResourcePage<IMapMaterialPage, WebGame.IMaterialInfo> {
        private readonly viewer;
        private materials;
        constructor(viewer: MapViewer, page: IPageInfo);
        onLoadValues(page: IMapMaterialPage): void;
        onGetValue(index: number): WebGame.IMaterialInfo;
    }
    class MapMaterialLoader extends PagedLoader<MapMaterialPage, IMapMaterialPage, WebGame.IMaterialInfo> {
        readonly viewer: MapViewer;
        private readonly materials;
        constructor(viewer: MapViewer);
        loadMaterial(index: number): WebGame.Material;
        protected onCreatePage(page: IPageInfo): MapMaterialPage;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    enum CameraMode {
        Fixed = 0,
        CanLook = 1,
        CanMove = 2,
        FreeCam = 3,
    }
    class MapViewer extends WebGame.Game {
        mainCamera: Entities.Camera;
        debugPanel: HTMLElement;
        readonly map: Map;
        readonly visLoader: VisLoader;
        readonly bspModelLoader: BspModelLoader;
        readonly mapMaterialLoader: MapMaterialLoader;
        readonly leafGeometryLoader: LeafGeometryLoader;
        readonly dispGeometryLoader: DispGeometryLoader;
        readonly studioModelLoader: StudioModelLoader;
        readonly vertLightingLoader: VertexLightingLoader;
        private debugPanelVisible;
        cameraMode: CameraMode;
        showDebugPanel: boolean;
        constructor(container: HTMLElement);
        loadMap(url: string): void;
        protected onInitialize(): void;
        protected onCreateDebugPanel(): HTMLElement;
        protected onDeviceRotate(deltaAngles: Facepunch.Vector3): void;
        protected onResize(): void;
        private readonly lookAngs;
        private readonly tempQuat;
        private readonly lookQuat;
        setCameraAngles(yaw: number, pitch: number): void;
        private updateCameraAngles();
        protected onMouseLook(delta: Facepunch.Vector2): void;
        toggleFullscreen(): void;
        protected onKeyDown(key: WebGame.Key): boolean;
        private readonly move;
        protected onUpdateFrame(dt: number): void;
        protected onRenderFrame(dt: number): void;
        populateCommandBufferParameters(buf: WebGame.CommandBuffer): void;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class BaseMaterial {
            cullFace: boolean;
        }
        class BaseShaderProgram<TMaterial extends BaseMaterial> extends WebGame.ShaderProgram {
            private readonly materialCtor;
            constructor(context: WebGLRenderingContext, ctor: {
                new (): TMaterial;
            });
            createMaterialProperties(): any;
            bufferMaterial(buf: WebGame.CommandBuffer, material: WebGame.Material): void;
            bufferMaterialProps(buf: WebGame.CommandBuffer, props: TMaterial): void;
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class ModelBaseMaterial extends BaseMaterial {
            basetexture: WebGame.Texture;
            alphaTest: boolean;
            translucent: boolean;
            alpha: number;
            fogEnabled: boolean;
        }
        abstract class ModelBase<TMaterial extends ModelBaseMaterial> extends BaseShaderProgram<TMaterial> {
            readonly uProjection: WebGame.UniformMatrix4;
            readonly uView: WebGame.UniformMatrix4;
            readonly uModel: WebGame.UniformMatrix4;
            readonly uBaseTexture: WebGame.UniformSampler;
            readonly uAlphaTest: WebGame.Uniform1F;
            readonly uTranslucent: WebGame.Uniform1F;
            readonly uAlpha: WebGame.Uniform1F;
            readonly uFogParams: WebGame.Uniform4F;
            readonly uFogColor: WebGame.Uniform3F;
            readonly uFogEnabled: WebGame.Uniform1I;
            constructor(context: WebGLRenderingContext, ctor: {
                new (): TMaterial;
            });
            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void;
            bufferModelMatrix(buf: Facepunch.WebGame.CommandBuffer, value: Float32Array): void;
            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: TMaterial): void;
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class LightmappedBaseMaterial extends ModelBaseMaterial {
        }
        abstract class LightmappedBase<TMaterial extends LightmappedBaseMaterial> extends ModelBase<TMaterial> {
            readonly uLightmap: WebGame.UniformSampler;
            constructor(context: WebGLRenderingContext, ctor: {
                new (): TMaterial;
            });
            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void;
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class Lightmapped2WayBlendMaterial extends LightmappedBaseMaterial {
            basetexture2: WebGame.Texture;
            blendModulateTexture: WebGame.Texture;
        }
        class Lightmapped2WayBlend extends LightmappedBase<Lightmapped2WayBlendMaterial> {
            readonly uBaseTexture2: WebGame.UniformSampler;
            readonly uBlendModulateTexture: WebGame.UniformSampler;
            readonly uBlendModulate: WebGame.Uniform1I;
            constructor(context: WebGLRenderingContext);
            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: Lightmapped2WayBlendMaterial): void;
        }
    }
}
declare namespace SourceUtils {
    namespace Shaders {
        class LightmappedGenericMaterial extends LightmappedBaseMaterial {
        }
        class LightmappedGeneric extends LightmappedBase<LightmappedGenericMaterial> {
            constructor(context: WebGLRenderingContext);
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class SkyMaterial extends BaseMaterial {
            facePosX: WebGame.Texture;
            faceNegX: WebGame.Texture;
            facePosY: WebGame.Texture;
            faceNegY: WebGame.Texture;
            facePosZ: WebGame.Texture;
            faceNegZ: WebGame.Texture;
            hdrCompressed: boolean;
            aspect: number;
        }
        class Sky extends BaseShaderProgram<SkyMaterial> {
            readonly uProjection: WebGame.UniformMatrix4;
            readonly uView: WebGame.UniformMatrix4;
            readonly uFacePosX: WebGame.UniformSampler;
            readonly uFaceNegX: WebGame.UniformSampler;
            readonly uFacePosY: WebGame.UniformSampler;
            readonly uFaceNegY: WebGame.UniformSampler;
            readonly uFacePosZ: WebGame.UniformSampler;
            readonly uFaceNegZ: WebGame.UniformSampler;
            readonly uHdrCompressed: WebGame.Uniform1I;
            constructor(context: WebGLRenderingContext);
            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void;
            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: SkyMaterial): void;
        }
    }
}
declare namespace SourceUtils {
    namespace Shaders {
        class UnlitGenericMaterial extends ModelBaseMaterial {
        }
        class UnlitGeneric extends ModelBase<UnlitGenericMaterial> {
            constructor(context: WebGLRenderingContext);
        }
    }
}
declare namespace SourceUtils {
    namespace Shaders {
        class VertexLitGenericMaterial extends ModelBaseMaterial {
        }
        class VertexLitGeneric extends ModelBase<VertexLitGenericMaterial> {
            constructor(context: WebGLRenderingContext);
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class WaterMaterial extends LightmappedBaseMaterial {
            fogStart: number;
            fogEnd: number;
            fogColor: Facepunch.Vector3;
            translucent: boolean;
            refract: boolean;
            cullFace: boolean;
        }
        class Water extends LightmappedBase<WaterMaterial> {
            uInverseProjection: WebGame.UniformMatrix4;
            uInverseView: WebGame.UniformMatrix4;
            uScreenParams: WebGame.Uniform4F;
            uOpaqueColor: WebGame.UniformSampler;
            uOpaqueDepth: WebGame.UniformSampler;
            uWaterFogParams: WebGame.Uniform4F;
            uWaterFogColor: WebGame.Uniform3F;
            constructor(context: WebGLRenderingContext);
            bufferSetup(buf: Facepunch.WebGame.CommandBuffer): void;
            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: WaterMaterial): void;
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class WorldTwoTextureBlendMaterial extends LightmappedBaseMaterial {
            detail: WebGame.Texture;
            detailScale: number;
        }
        class WorldTwoTextureBlend extends LightmappedBase<WorldTwoTextureBlendMaterial> {
            readonly uDetail: WebGame.UniformSampler;
            readonly uDetailScale: WebGame.Uniform1F;
            constructor(context: WebGLRenderingContext);
            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: WorldTwoTextureBlendMaterial): void;
        }
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    class SkyCube extends WebGame.DrawListItem {
        constructor(viewer: MapViewer, material: WebGame.Material);
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    interface ISmdMesh {
        meshId: number;
        material: number;
        element: number;
    }
    interface ISmdModel {
        meshes: ISmdMesh[];
    }
    interface ISmdBodyPart {
        name: string;
        models: ISmdModel[];
    }
    interface IStudioModel {
        bodyParts: ISmdBodyPart[];
    }
    class StudioModel extends WebGame.RenderResource<StudioModel> {
        readonly viewer: MapViewer;
        private info;
        private page;
        constructor(viewer: MapViewer);
        private static getOrCreateMatGroup(matGroups, attribs);
        private static encode2CompColor(vertLit, albedoMod);
        createMeshHandles(bodyPartIndex: number, transform: Facepunch.Matrix4, vertLighting?: number[][], albedoModulation?: number): WebGame.MeshHandle[];
        loadFromInfo(info: IStudioModel, page: StudioModelPage): void;
        isLoaded(): boolean;
    }
    interface IStudioModelPage {
        models: IStudioModel[];
        materials: IMaterialGroup[];
    }
    class StudioModelPage extends ResourcePage<IStudioModelPage, IStudioModel> {
        private matGroups;
        private models;
        constructor(page: IPageInfo);
        getMaterialGroup(index: number): WebGame.IMeshData;
        onLoadValues(page: IStudioModelPage): void;
        onGetValue(index: number): IStudioModel;
    }
    class StudioModelLoader extends PagedLoader<StudioModelPage, IStudioModelPage, IStudioModel> {
        readonly viewer: MapViewer;
        private readonly models;
        constructor(viewer: MapViewer);
        update(requestQuota: number): number;
        loadModel(index: number): StudioModel;
        onCreatePage(page: IPageInfo): StudioModelPage;
    }
    interface IVertexLightingPage {
        props: (string | number[])[][];
    }
    class VertexLightingPage extends ResourcePage<IVertexLightingPage, number[][]> {
        private props;
        onLoadValues(page: IVertexLightingPage): void;
        onGetValue(index: number): number[][];
    }
    class VertexLightingLoader extends PagedLoader<VertexLightingPage, IVertexLightingPage, number[][]> {
        readonly viewer: MapViewer;
        constructor(viewer: MapViewer);
        update(requestQuota: number): number;
        onCreatePage(page: IPageInfo): VertexLightingPage;
    }
}
declare namespace SourceUtils {
    interface IVisPage {
        values: (number[] | string)[];
    }
    class VisPage extends ResourcePage<IVisPage, number[]> {
        protected onGetValue(index: number): number[];
    }
    class VisLoader extends PagedLoader<VisPage, IVisPage, number[]> {
        protected onCreatePage(page: IPageInfo): VisPage;
    }
}
