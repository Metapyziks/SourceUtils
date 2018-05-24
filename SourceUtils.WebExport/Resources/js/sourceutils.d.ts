/// <reference path="facepunch.webgame.d.ts" />
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
    abstract class PagedLoader<TPayload, TValue, TPage extends ResourcePage<TPayload, TValue>> implements Facepunch.ILoader {
        private pages;
        private readonly toLoad;
        private active;
        private loadProgress;
        protected abstract onCreatePage(page: IPageInfo): TPage;
        throwIfNotFound: boolean;
        getLoadProgress(): number;
        load(index: number, callback: (payload: TValue, page: TPage) => void): TValue;
        setPageLayout(pages: IPageInfo[]): void;
        private getNextToLoad();
        update(requestQuota: number): number;
    }
}
declare namespace SourceUtils {
    interface IAmbientPage {
        values: IAmbientSample[][];
    }
    interface IAmbientSample {
        position: Facepunch.IVector3;
        samples: number[];
    }
    class AmbientPage extends ResourcePage<IAmbientPage, IAmbientSample[]> {
        protected onGetValue(index: number): IAmbientSample[];
    }
    class AmbientLoader extends PagedLoader<IAmbientPage, IAmbientSample[], AmbientPage> {
        protected onCreatePage(page: IPageInfo): AmbientPage;
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
        private readonly viewer;
        readonly isLeaf: boolean;
        readonly plane: Plane;
        readonly children: (BspLeaf | BspNode)[];
        constructor(viewer: MapViewer, info: IBspNode);
        private loadChild(value);
        findLeaves(target: BspLeaf[]): void;
    }
    class BspLeaf extends WebGame.DrawListItem implements INodeOrLeaf {
        readonly isLeaf: boolean;
        private readonly viewer;
        readonly index: number;
        readonly flags: LeafFlags;
        readonly cluster: number;
        readonly hasFaces: boolean;
        private hasLoaded;
        private ambientSamples;
        private hasLoadedAmbient;
        constructor(viewer: MapViewer, info: IBspLeaf);
        private static readonly getAmbientCube_temp;
        getAmbientCube(pos: Facepunch.IVector3, outSamples: Facepunch.IVector3[], callback?: (success: boolean) => void): boolean;
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
        protected onGetValue(index: number): IBspModel;
    }
    class BspModelLoader extends PagedLoader<IBspModelPage, IBspModel, BspModelPage> {
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
    class DispGeometryLoader extends PagedLoader<IDispGeometryPage, WebGame.MeshHandle, DispGeometryPage> {
        readonly viewer: MapViewer;
        constructor(viewer: MapViewer);
        protected onCreatePage(page: IPageInfo): DispGeometryPage;
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
    class LeafGeometryLoader extends PagedLoader<ILeafGeometryPage, WebGame.MeshHandle[], LeafGeometryPage> {
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
        ambientPages: IPageInfo[];
        entities: Entities.IEntity[];
    }
    class Map implements WebGame.ICommandBufferParameterProvider {
        static readonly lightmapParam: WebGame.CommandBufferParameter;
        readonly viewer: MapViewer;
        skyCamera: Entities.SkyCamera;
        private tSpawns;
        private ctSpawns;
        private playerSpawns;
        private namedEntities;
        private worldspawn;
        private pvsEntities;
        private lightmap;
        private skyCube;
        private info;
        private clusterVis;
        private clusterEnts;
        private worldspawnLoadedCallbacks;
        constructor(viewer: MapViewer);
        isReady(): boolean;
        unload(): void;
        load(url: string): void;
        getLightmapLoadProgress(): number;
        private onLoad(info);
        addNamedEntity(targetname: string, entity: Entities.Entity): void;
        getNamedEntity(targetname: string): Entities.Entity;
        addPvsEntity(entity: Entities.PvsEntity): void;
        removePvsEntity(entity: Entities.PvsEntity): void;
        getPvsEntitiesInCluster(cluster: number): Entities.PvsEntity[];
        getLeafAt(pos: Facepunch.IVector3, callback?: (leaf: BspLeaf) => void): BspLeaf;
        update(dt: number): void;
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
        protected onGetValue(index: number): WebGame.IMaterialInfo;
    }
    class MapMaterialLoader extends PagedLoader<IMapMaterialPage, WebGame.IMaterialInfo, MapMaterialPage> {
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
    interface IPositionHash {
        x?: number;
        y?: number;
        z?: number;
        r?: number;
        s?: number;
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
        readonly ambientLoader: AmbientLoader;
        private debugPanelVisible;
        cameraMode: CameraMode;
        saveCameraPosInHash: boolean;
        showDebugPanel: boolean;
        totalLoadProgress: number;
        avgFrameTime: number;
        avgFrameRate: number;
        notMovedTime: number;
        constructor(container: HTMLElement);
        loadMap(url: string): void;
        protected onInitialize(): void;
        private static readonly hashKeyRegex;
        private static readonly hashObjectRegex;
        protected setHash(value: string | Object): void;
        private oldHash;
        private hashChange();
        private readonly onHashChange_temp;
        protected onHashChange(value: string | Object): void;
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
        private lastProfileTime;
        private frameCount;
        private lastDrawCalls;
        private allLoaded;
        protected onSetDebugText(className: string, value: string): void;
        private readonly onUpdateFrame_temp;
        protected onUpdateFrame(dt: number): void;
        protected onRenderFrame(dt: number): void;
        populateCommandBufferParameters(buf: WebGame.CommandBuffer): void;
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
        private static readonly sampleAmbientCube_samples;
        private static readonly sampleAmbientCube_temp;
        private static sampleAmbientCube(leaf, pos, normal);
        createMeshHandles(bodyPartIndex: number, transform: Facepunch.Matrix4, lighting?: (number[][] | BspLeaf), albedoModulation?: number): WebGame.MeshHandle[];
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
        protected onGetValue(index: number): IStudioModel;
    }
    class StudioModelLoader extends PagedLoader<IStudioModelPage, IStudioModel, StudioModelPage> {
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
        protected onGetValue(index: number): number[][];
    }
    class VertexLightingLoader extends PagedLoader<IVertexLightingPage, number[][], VertexLightingPage> {
        readonly viewer: MapViewer;
        constructor(viewer: MapViewer);
        update(requestQuota: number): number;
        onCreatePage(page: IPageInfo): VertexLightingPage;
    }
}
declare namespace SourceUtils {
    class ColorConversion {
        private static lastScreenGamma;
        private static linearToScreenGammaTable;
        private static exponentTable;
        static initialize(screenGamma: number): void;
        static rgbExp32ToVector3(rgbExp: number, out: Facepunch.IVector3): Facepunch.IVector3;
        static linearToScreenGamma(f: number): number;
    }
}
declare namespace SourceUtils {
    interface IVisPage {
        values: (number[] | string)[];
    }
    class VisPage extends ResourcePage<IVisPage, number[]> {
        protected onGetValue(index: number): number[];
    }
    class VisLoader extends PagedLoader<IVisPage, number[], VisPage> {
        constructor();
        protected onCreatePage(page: IPageInfo): VisPage;
    }
}
declare namespace SourceUtils {
    import WebGame = Facepunch.WebGame;
    namespace Entities {
        interface IEntity {
            classname: string;
            targetname?: string;
            origin?: Facepunch.IVector3;
            angles?: Facepunch.IVector3;
            scale?: number;
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
            readonly targetname: string;
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
        interface IKeyframeRope extends IPvsEntity {
            width: number;
            textureScale: number;
            subDivisions: number;
            slack: number;
            ropeMaterial: number;
            nextKey: string;
            moveSpeed: number;
        }
        class KeyframeRope extends PvsEntity {
            readonly nextKey: string;
            readonly width: number;
            readonly slack: number;
            readonly subDivisions: number;
            constructor(map: Map, info: IKeyframeRope);
        }
        enum PositionInterpolator {
            Linear = 0,
            CatmullRomSpline = 1,
            Rope = 2,
        }
        interface IMoveRope extends IKeyframeRope {
            positionInterp: PositionInterpolator;
        }
        class MoveRope extends KeyframeRope {
            private readonly info;
            private keyframes;
            private material;
            private meshHandles;
            constructor(map: Map, info: IMoveRope);
            private findKeyframes();
            private generateMesh();
            onAddToDrawList(list: Facepunch.WebGame.DrawList): void;
            getMeshHandles(): Facepunch.WebGame.MeshHandle[];
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
            private readonly info;
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
            emission: boolean;
            emissionTint: Facepunch.Vector3;
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
            readonly uEmission: WebGame.Uniform1I;
            readonly uEmissionTint: WebGame.Uniform3F;
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
    import WebGame = Facepunch.WebGame;
    namespace Shaders {
        class SplineRopeMaterial extends ModelBaseMaterial {
            ambient: Facepunch.Vector3[];
        }
        class SplineRope extends ModelBase<SplineRopeMaterial> {
            private uAmbient0;
            private uAmbient1;
            private uAmbient2;
            private uAmbient3;
            private uAmbient4;
            private uAmbient5;
            uAmbient: WebGame.Uniform3F[];
            constructor(context: WebGLRenderingContext);
            bufferMaterialProps(buf: Facepunch.WebGame.CommandBuffer, props: SplineRopeMaterial): void;
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
            fogLightmapped: boolean;
            translucent: boolean;
            refract: boolean;
            refractTint: Facepunch.Vector3;
            normalMap: WebGame.Texture;
            cullFace: boolean;
        }
        class Water extends LightmappedBase<WaterMaterial> {
            uCameraPos: WebGame.Uniform3F;
            uInverseProjection: WebGame.UniformMatrix4;
            uInverseView: WebGame.UniformMatrix4;
            uScreenParams: WebGame.Uniform4F;
            uOpaqueColor: WebGame.UniformSampler;
            uOpaqueDepth: WebGame.UniformSampler;
            uWaterFogParams: WebGame.Uniform4F;
            uWaterFogColor: WebGame.Uniform3F;
            uWaterFogLightmapped: WebGame.Uniform1F;
            uNormalMap: WebGame.UniformSampler;
            uRefractTint: WebGame.Uniform3F;
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
