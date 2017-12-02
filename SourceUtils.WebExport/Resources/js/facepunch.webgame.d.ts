declare namespace Facepunch {
    interface ILoadable {
        loadNext(callback: (requeue: boolean) => void): void;
        getLoadPriority(): number;
        getLoadProgress(): number;
    }
    interface ILoader {
        update(requestQuota: number): number;
        getLoadProgress(): number;
    }
    abstract class Loader<TLoadable extends ILoadable> implements ILoader {
        private queue;
        private loaded;
        private active;
        private completed;
        load(url: string): TLoadable;
        getLoadProgress(): number;
        protected enqueueItem(item: TLoadable): void;
        protected abstract onCreateItem(url: string): TLoadable;
        protected onFinishedLoadStep(item: TLoadable): void;
        private getNextToLoad();
        update(requestQuota: number): number;
    }
}
declare namespace Facepunch {
    class LZString {
        static readonly compressToBase64: (input: any) => string;
        static readonly decompressFromBase64: (input: any) => string;
        static readonly compressToUTF16: (input: any) => string;
        static readonly decompressFromUTF16: (compressed: any) => string;
        static readonly compressToUint8Array: (uncompressed: any) => Uint8Array;
        static readonly decompressFromUint8Array: (compressed: any) => string;
        static readonly compressToEncodedURIComponent: (input: any) => string;
        static readonly decompressFromEncodedURIComponent: (input: any) => string;
        static readonly compress: (uncompressed: any) => string;
        static readonly decompress: (compressed: any) => string;
    }
}
declare namespace Facepunch {
    interface IVector2 {
        x: number;
        y: number;
    }
    class Vector2 implements IVector2 {
        x: number;
        y: number;
        constructor(x?: number, y?: number);
        length(): number;
        lengthSq(): number;
        set(x: number, y: number): this;
        add(x: number, y: number): this;
        add(vec: IVector2): this;
        sub(x: number, y: number): this;
        sub(vec: IVector2): this;
        multiplyScalar(val: number): this;
        copy(vec: IVector2): this;
    }
    interface IVector3 extends IVector2 {
        z: number;
    }
    class Vector3 implements IVector3 {
        static readonly zero: Vector3;
        static readonly one: Vector3;
        static readonly unitX: Vector3;
        static readonly unitY: Vector3;
        static readonly unitZ: Vector3;
        x: number;
        y: number;
        z: number;
        constructor(x?: number, y?: number, z?: number);
        length(): number;
        lengthSq(): number;
        normalize(): this;
        set(x: number, y: number, z: number): this;
        add(x: number, y: number, z: number): this;
        add(vec: IVector3): this;
        sub(x: number, y: number, z: number): this;
        sub(vec: IVector3): this;
        multiply(x: number, y: number, z: number): this;
        multiply(vec: IVector3): this;
        cross(vec: IVector3): this;
        divide(vec: IVector3): this;
        multiplyScalar(val: number): this;
        dot(vec: IVector3): number;
        copy(vec: IVector3): this;
        applyQuaternion(quat: Quaternion): this;
        setNormal(vec: IVector3): this;
    }
    interface IVector4 extends IVector3 {
        w: number;
    }
    class Vector4 implements IVector4 {
        x: number;
        y: number;
        z: number;
        w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
        length(): number;
        lengthSq(): number;
        lengthXyz(): number;
        lengthSqXyz(): number;
        normalize(): this;
        normalizeXyz(): this;
        set(x: number, y: number, z: number, w: number): this;
        multiplyScalar(val: number): this;
        applyQuaternion(quat: Quaternion): this;
        applyMatrix4(mat: Matrix4): this;
    }
    class Quaternion implements IVector4 {
        x: number;
        y: number;
        z: number;
        w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
        copy(quat: Quaternion): this;
        setIdentity(): this;
        setInverse(quat?: Quaternion): this;
        setNormalized(quat?: Quaternion): this;
        private static readonly setLookAlong_temp;
        setLookAlong(normal: IVector3): this;
        setAxisAngle(axis: IVector3, angle: number): this;
        multiply(quat: Quaternion): this;
        setEuler(euler: Euler): this;
    }
    enum AxisOrder {
        Xyz = 5,
        Xzy = 12,
        Yxz = 9,
        Yzx = 3,
        Zxy = 6,
        Zyx = 10,
    }
    class Euler {
        x: number;
        y: number;
        z: number;
        order: AxisOrder;
        constructor(x?: number, y?: number, z?: number, order?: AxisOrder);
    }
    class Plane {
        normal: Vector3;
        distance: number;
        constructor(normal: Vector3, distance: number);
    }
    class Box3 {
        min: Vector3;
        max: Vector3;
        constructor(min?: IVector3, max?: IVector3);
        copy(box: Box3): this;
        clampLineSegment(a: IVector3, b: IVector3): boolean;
        distanceToPoint(vec: IVector3): number;
        addPoint(vec: IVector3): void;
    }
    class Matrix4 {
        private static nextId;
        readonly id: number;
        elements: Float32Array;
        setIdentity(): this;
        compareTo(other: Matrix4): number;
        copy(mat: Matrix4): this;
        setRotation(rotation: Quaternion): this;
        scale(vec: Vector3): this;
        translate(vec: Vector3): this;
        setPerspective(fov: number, aspect: number, near: number, far: number): this;
        setOrthographic(size: number, aspect: number, near: number, far: number): this;
        setInverse(from: Matrix4): this;
    }
}
declare namespace Facepunch {
    class Http {
        static readonly cancelled: any;
        static getString(url: string, success: (response: string) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number) => void): void;
        static getJson<TResponse>(url: string, success: (response: TResponse) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number) => void): void;
        static getImage(url: string, success: (response: HTMLImageElement) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number) => void): void;
        static isAbsUrl(url: string): boolean;
        static getAbsUrl(url: string, relativeTo: string): string;
    }
    class Utils {
        static decompress<T>(value: string | T): T;
        static decompressOrClone<T>(value: string | T[]): T[];
    }
    class WebGl {
        static decodeConst<TEnum extends number>(valueOrIdent: TEnum | string, defaultValue?: TEnum): TEnum;
        private static constDict;
        static encodeConst(value: number): string;
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class Entity {
            private static nextId;
            readonly id: number;
            private position;
            private rotation;
            private scale;
            private matrix;
            private matrixInvalid;
            private inverseMatrix;
            private inverseMatrixInvalid;
            compareTo(other: Entity): number;
            invalidateMatrices(): void;
            protected onChangePosition(): void;
            protected onChangeRotation(): void;
            protected onChangeScale(): void;
            getMatrix(target?: Matrix4): Matrix4;
            getInverseMatrix(target?: Matrix4): Matrix4;
            setPosition(value: IVector3): void;
            setPosition(x: number, y: number, z: number): void;
            getPosition(target: IVector3): IVector3;
            getPositionValues(target: Float32Array): Float32Array;
            getDistanceToBounds(bounds: Box3): number;
            translate(value: IVector3): void;
            translate(x: number, y: number, z: number): void;
            easeTo(goal: IVector3, delta: number): void;
            setRotation(value: Quaternion): void;
            private static tempEuler;
            setAngles(value: IVector3): void;
            setAngles(pitch: number, yaw: number, roll: number): void;
            copyRotation(other: Entity): void;
            applyRotationTo(vector: Vector3 | Vector4): void;
            setScale(value: IVector3 | number): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        type CommandBufferAction = (gl: WebGLRenderingContext, args: ICommandBufferItem) => void;
        interface ICommandBufferItem {
            action?: CommandBufferAction;
            commandBuffer?: CommandBuffer;
            parameter?: CommandBufferParameter;
            program?: ShaderProgram;
            uniform?: Uniform;
            target?: number;
            unit?: number;
            texture?: Texture;
            frames?: number;
            transpose?: boolean;
            values?: Float32Array;
            cap?: number;
            enabled?: boolean;
            buffer?: WebGLBuffer;
            framebuffer?: FrameBuffer;
            fitView?: boolean;
            index?: number;
            mode?: number;
            type?: number;
            offset?: number;
            count?: number;
            size?: number;
            normalized?: boolean;
            stride?: number;
            game?: Game;
            mask?: number;
            x?: number;
            y?: number;
            z?: number;
            w?: number;
        }
        enum UniformType {
            Float = 0,
            Float2 = 1,
            Float3 = 2,
            Float4 = 3,
            Matrix4 = 4,
            Texture = 5,
        }
        class CommandBufferParameter {
            private static nextId;
            readonly id: number;
            readonly type: UniformType;
            constructor(type: UniformType);
        }
        interface ICommandBufferParameterProvider {
            populateCommandBufferParameters(buf: CommandBuffer): void;
        }
        class CommandBuffer {
            private context;
            private commands;
            private boundTextures;
            private boundBuffers;
            private capStates;
            private depthMaskState;
            private parameters;
            private lastCommand;
            private drawCalls;
            private tempLastRunTime;
            private tempSpareTime;
            private tempCurFrame;
            immediate: boolean;
            constructor(context: WebGLRenderingContext, immediate?: boolean);
            private getCommandName(action);
            logCommands(): void;
            private clearState();
            clearCommands(): void;
            getDrawCalls(): number;
            setParameter(param: CommandBufferParameter, value: Float32Array | Texture): void;
            getArrayParameter(param: CommandBufferParameter): Float32Array;
            getTextureParameter(param: CommandBufferParameter): Texture;
            run(): void;
            private push(action, args);
            clear(mask: number): void;
            private onClear(gl, args);
            dynamicMaterial(callback: (buf: CommandBuffer) => void): void;
            private setCap(cap, enabled);
            enable(cap: number): void;
            private onEnable(gl, args);
            disable(cap: number): void;
            private onDisable(gl, args);
            depthMask(flag: boolean): void;
            private onDepthMask(gl, args);
            blendFuncSeparate(srcRgb: number, dstRgb: number, srcAlpha: number, dstAlpha: number): void;
            private onBlendFuncSeparate(gl, args);
            useProgram(program: ShaderProgram): void;
            private onUseProgram(gl, args);
            setUniformParameter(uniform: Uniform, parameter: CommandBufferParameter): void;
            private setUniformParameterInternal(uniform, param, unit?);
            private onSetUniformParameter(gl, args);
            setUniform1F(uniform: Uniform, x: number): void;
            private onSetUniform1F(gl, args);
            setUniform1I(uniform: Uniform, x: number): void;
            private onSetUniform1I(gl, args);
            setUniform2F(uniform: Uniform, x: number, y: number): void;
            private onSetUniform2F(gl, args);
            setUniform3F(uniform: Uniform, x: number, y: number, z: number): void;
            private onSetUniform3F(gl, args);
            setUniform4F(uniform: Uniform, x: number, y: number, z: number, w: number): void;
            private onSetUniform4F(gl, args);
            setUniformTextureSize(uniform: Uniform4F, tex: Texture): void;
            private onSetUniformTextureSize(gl, args);
            setUniformMatrix4(uniform: Uniform, transpose: boolean, values: Float32Array): void;
            private onSetUniformMatrix4(gl, args);
            bindTexture(unit: number, value: Texture): void;
            private onBindTexture(gl, args);
            private onBindAnimatedTexture(gl, args);
            bindBuffer(target: number, buffer: WebGLBuffer): void;
            private onBindBuffer(gl, args);
            enableVertexAttribArray(index: number): void;
            private onEnableVertexAttribArray(gl, args);
            disableVertexAttribArray(index: number): void;
            private onDisableVertexAttribArray(gl, args);
            vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void;
            private onVertexAttribPointer(gl, args);
            drawElements(mode: number, count: number, type: number, offset: number, elemSize: number): void;
            private onDrawElements(gl, args);
            bindFramebuffer(buffer: FrameBuffer, fitView?: boolean): void;
            bindFramebufferInternal(buffer: FrameBuffer, fitView: boolean): void;
            private onBindFramebuffer(gl, args);
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        abstract class Camera extends Entity implements ICommandBufferParameterProvider {
            static readonly cameraPosParam: CommandBufferParameter;
            static readonly clipInfoParam: CommandBufferParameter;
            static readonly projectionMatrixParam: CommandBufferParameter;
            static readonly inverseProjectionMatrixParam: CommandBufferParameter;
            static readonly viewMatrixParam: CommandBufferParameter;
            static readonly inverseViewMatrixParam: CommandBufferParameter;
            static readonly opaqueColorParam: CommandBufferParameter;
            static readonly opaqueDepthParam: CommandBufferParameter;
            private readonly drawList;
            private readonly commandBuffer;
            private opaqueFrameBuffer;
            private geometryInvalid;
            readonly game: Game;
            readonly fog: Fog;
            private near;
            private far;
            private projectionInvalid;
            private projectionMatrix;
            private inverseProjectionInvalid;
            private inverseProjectionMatrix;
            private shadowCamera;
            private shadowCascades;
            constructor(game: Game, near: number, far: number);
            setShadowCascades(cascadeFractions: number[]): void;
            setNear(value: number): void;
            getNear(): number;
            setFar(value: number): void;
            getFar(): number;
            getOpaqueColorTexture(): RenderTexture;
            getOpaqueDepthTexture(): RenderTexture;
            getShadowCascadeCount(): number;
            invalidateGeometry(): void;
            protected onPopulateDrawList(drawList: DrawList): void;
            render(): void;
            private setupFrameBuffers();
            bufferOpaqueTargetBegin(buf: CommandBuffer): void;
            bufferRenderTargetEnd(buf: CommandBuffer): void;
            private static readonly bufferShadowTargetBegin_lightNorm;
            private static readonly bufferShadowTargetBegin_lightDir;
            bufferShadowTargetBegin(buf: CommandBuffer, cascadeIndex: number): void;
            bufferShadowTargetEnd(buf: CommandBuffer): void;
            getDrawCalls(): number;
            getProjectionMatrix(target?: Matrix4): Matrix4;
            getInverseProjectionMatrix(target?: Matrix4): Matrix4;
            protected invalidateProjectionMatrix(): void;
            protected abstract onUpdateProjectionMatrix(matrix: Matrix4): void;
            private cameraPosParams;
            private clipParams;
            populateCommandBufferParameters(buf: CommandBuffer): void;
            dispose(): void;
        }
        class PerspectiveCamera extends Camera {
            private fov;
            private aspect;
            constructor(game: Game, fov: number, aspect: number, near: number, far: number);
            setFov(value: number): void;
            getFov(): number;
            setAspect(value: number): void;
            getAspect(): number;
            protected onUpdateProjectionMatrix(matrix: Matrix4): void;
        }
        class OrthographicCamera extends Camera {
            private size;
            private aspect;
            constructor(game: Game, size: number, aspect: number, near: number, far: number);
            setSize(value: number): void;
            getSize(): number;
            setAspect(value: number): void;
            getAspect(): number;
            protected onUpdateProjectionMatrix(matrix: Matrix4): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class DrawableEntity extends Entity implements IDrawListItem {
            protected readonly drawable: DrawListItem;
            constructor(isStatic?: boolean);
            invalidateDrawLists(): void;
            getIsVisible(): boolean;
            getIsInDrawList(drawList: DrawList): boolean;
            onAddToDrawList(list: DrawList): void;
            onRemoveFromDrawList(list: DrawList): void;
            getMeshHandles(): MeshHandle[];
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class DebugLine extends DrawableEntity {
            private readonly game;
            private readonly attribs;
            private readonly material;
            private readonly materialProps;
            private readonly meshGroup;
            private readonly meshHandle;
            private readonly meshHandles;
            private readonly vertData;
            private readonly indexData;
            private readonly vertBuffer;
            private meshChanged;
            progressScale: number;
            constructor(game: Game);
            clear(): void;
            phase: number;
            frequency: number;
            setColor(color: IVector3): void;
            setColor(color0: IVector3, color1: IVector3): void;
            private lastPos;
            private progress;
            private addVertex(pos, progress);
            moveTo(pos: IVector3): void;
            lineTo(pos: IVector3, progress?: number): void;
            update(): void;
            dispose(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class DrawList {
            private static readonly identityMatrix;
            private items;
            private invalid;
            private shadowCast;
            private opaque;
            private translucent;
            private lastHandle;
            private lastProgram;
            private hasRefraction;
            isInvalid(): boolean;
            clear(): void;
            addItem(item: IDrawListItem): void;
            addItems<TItem extends IDrawListItem>(items: TItem[]): void;
            private isBuildingList;
            invalidate(): void;
            private bufferHandle(buf, handle);
            private static compareHandles(a, b);
            private buildHandleList(shaders);
            appendToBuffer(buf: CommandBuffer, camera: Camera): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IDrawListItem {
            invalidateDrawLists(): void;
            getIsVisible(): boolean;
            getIsInDrawList(drawList: DrawList): boolean;
            onAddToDrawList(list: DrawList): void;
            onRemoveFromDrawList(list: DrawList): void;
            getMeshHandles(): MeshHandle[];
        }
        class DrawListItem implements IDrawListItem {
            isStatic: boolean;
            entity: Entity;
            private meshHandles;
            private readonly drawLists;
            clearMeshHandles(): void;
            addMeshHandles(handles: MeshHandle[]): void;
            invalidateDrawLists(): void;
            getIsVisible(): boolean;
            getIsInDrawList(drawList: DrawList): boolean;
            onAddToDrawList(list: DrawList): void;
            onRemoveFromDrawList(list: DrawList): void;
            getMeshHandles(): MeshHandle[];
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class Fog implements ICommandBufferParameterProvider {
            static readonly fogColorParam: CommandBufferParameter;
            static readonly fogInfoParam: CommandBufferParameter;
            start: number;
            end: number;
            maxDensity: number;
            readonly color: Vector3;
            private readonly colorValues;
            private readonly paramsValues;
            populateCommandBufferParameters(buf: CommandBuffer): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class FrameBuffer {
            private context;
            private frameBuffer;
            private ownsFrameTexture;
            private ownsDepthTexture;
            private frameTexture;
            private depthTexture;
            constructor(tex: RenderTexture);
            constructor(gl: WebGLRenderingContext, width: number, height: number);
            private unbindAndCheckState();
            addDepthAttachment(existing?: RenderTexture): void;
            getColorTexture(): RenderTexture;
            getDepthTexture(): RenderTexture;
            dispose(): void;
            resize(width: number, height: number): void;
            getHandle(): WebGLFramebuffer;
            begin(): void;
            end(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum MouseButton {
            Left = 1,
            Middle = 2,
            Right = 3,
        }
        enum Key {
            Backspace = 8,
            Tab = 9,
            Enter = 13,
            Shift = 16,
            Ctrl = 17,
            Alt = 18,
            PauseBreak = 19,
            CapsLock = 20,
            Escape = 27,
            Space = 32,
            PageUp = 33,
            PageDown = 34,
            End = 35,
            Home = 36,
            LeftArrow = 37,
            UpArrow = 38,
            RightArrow = 39,
            DownArrow = 40,
            Insert = 45,
            Delete = 46,
            D0 = 48,
            D1 = 49,
            D2 = 50,
            D3 = 51,
            D4 = 52,
            D5 = 53,
            D6 = 54,
            D7 = 55,
            D8 = 56,
            D9 = 57,
            A = 65,
            B = 66,
            C = 67,
            D = 68,
            E = 69,
            F = 70,
            G = 71,
            H = 72,
            I = 73,
            J = 74,
            K = 75,
            L = 76,
            M = 77,
            N = 78,
            O = 79,
            P = 80,
            Q = 81,
            R = 82,
            S = 83,
            T = 84,
            U = 85,
            V = 86,
            W = 87,
            X = 88,
            Y = 89,
            Z = 90,
            LeftWindowKey = 91,
            RightWindowKey = 92,
            Select = 93,
            Numpad0 = 96,
            Numpad1 = 97,
            Numpad2 = 98,
            Numpad3 = 99,
            Numpad4 = 100,
            Numpad5 = 101,
            Numpad6 = 102,
            Numpad7 = 103,
            Numpad8 = 104,
            Numpad9 = 105,
            Multiply = 106,
            Add = 107,
            Subtract = 109,
            DecimalPoint = 110,
            Divide = 111,
            F1 = 112,
            F2 = 113,
            F3 = 114,
            F4 = 115,
            F5 = 116,
            F6 = 117,
            F7 = 118,
            F8 = 119,
            F9 = 120,
            F10 = 121,
            F11 = 122,
            F12 = 123,
            NumLock = 144,
            ScrollLock = 145,
            SemiColon = 186,
            EqualSign = 187,
            Comma = 188,
            Dash = 189,
            Period = 190,
            ForwardSlash = 191,
            GraveAccent = 192,
            OpenBracket = 219,
            BackSlash = 220,
            CloseBraket = 221,
            SingleQuote = 222,
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class Game implements ICommandBufferParameterProvider {
            static readonly timeInfoParam: CommandBufferParameter;
            static readonly screenInfoParam: CommandBufferParameter;
            static readonly lightDirParam: CommandBufferParameter;
            canLockPointer: boolean;
            private initialized;
            readonly shaders: ShaderManager;
            readonly meshes: MeshManager;
            readonly materialLoader: MaterialLoader;
            readonly textureLoader: TextureLoader;
            readonly modelLoader: ModelLoader;
            private loaders;
            private animateCallback;
            private lastAnimateCallback;
            readonly container: HTMLElement;
            readonly canvas: HTMLCanvasElement;
            readonly context: WebGLRenderingContext;
            private readonly drawListInvalidationHandlers;
            private heldKeys;
            private heldMouseButtons;
            private mouseScreenPos;
            private mouseLookDelta;
            constructor(container: HTMLElement);
            protected enableExtension(name: string): void;
            getLastUpdateTime(): number;
            getWidth(): number;
            getHeight(): number;
            getMouseScreenPos(out?: Vector2): Vector2;
            getMouseViewPos(out?: Vector2): Vector2;
            private getScreenPos(pageX, pageY, out?);
            isPointerLocked(): boolean;
            populateDrawList(drawList: DrawList, camera: Camera): void;
            addDrawListInvalidationHandler(action: (geom: boolean) => void): void;
            forceDrawListInvalidation(geom: boolean): void;
            animate(dt?: number): void;
            isKeyDown(key: Key): boolean;
            isMouseButtonDown(button: MouseButton): boolean;
            protected onInitialize(): void;
            protected onResize(): void;
            protected addLoader<TLoader extends ILoader>(loader: TLoader): TLoader;
            protected onMouseDown(button: MouseButton, screenPos: Vector2, target: EventTarget): boolean;
            protected onMouseUp(button: MouseButton, screenPos: Vector2, target: EventTarget): boolean;
            protected onMouseScroll(delta: number): boolean;
            protected onMouseMove(screenPos: Vector2): void;
            protected onMouseLook(delta: Vector2): void;
            protected onKeyDown(key: Key): boolean;
            protected onKeyUp(key: Key): boolean;
            protected onUpdateFrame(dt: number): void;
            protected onRenderFrame(dt: number): void;
            private readonly timeParams;
            private readonly screenParams;
            private readonly lightDirParams;
            populateCommandBufferParameters(buf: CommandBuffer): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IRenderResource {
            getVisibleUsageCount(): number;
            onDependencyLoaded(dependency: IRenderResource): void;
        }
        abstract class RenderResource<TResource extends RenderResource<TResource>> implements IRenderResource {
            private readonly onLoadCallbacks;
            private readonly usages;
            private readonly dependents;
            abstract isLoaded(): boolean;
            getLoadPriority(): number;
            addDependent(dependent: IRenderResource): void;
            addUsage(drawable: IDrawListItem): void;
            removeUsage(drawable: IDrawListItem): void;
            onDependencyLoaded(dependency: IRenderResource): void;
            getVisibleUsageCount(): number;
            addOnLoadCallback(callback: (resource: TResource) => void): void;
            protected dispatchOnLoadCallbacks(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum MaterialPropertyType {
            Boolean = 1,
            Number = 2,
            Color = 3,
            TextureUrl = 4,
            TextureIndex = 5,
            TextureInfo = 6,
        }
        interface IMaterialProperty {
            type: MaterialPropertyType;
            name: string;
            value: boolean | number | string | ITextureInfo | IColor;
        }
        interface IMaterialInfo {
            shader: string;
            properties: IMaterialProperty[];
        }
        class Material extends RenderResource<Material> {
            private static nextId;
            readonly id: number;
            properties: any;
            program: ShaderProgram;
            enabled: boolean;
            readonly isDynamic: boolean;
            constructor(isDynamic: boolean);
            constructor(program: ShaderProgram, isDynamic: boolean);
            clone(isDynamic?: boolean): Material;
            isLoaded(): boolean;
        }
        class MaterialClone extends Material {
            constructor(base: Material, isDynamic: boolean);
        }
        class MaterialLoadable extends Material implements ILoadable {
            private static nextDummyId;
            private readonly game;
            private readonly url;
            private textureSource;
            private loadProgress;
            constructor(game: Game, url?: string);
            getLoadProgress(): number;
            private addPropertyFromInfo(info);
            loadFromInfo(info: IMaterialInfo, textureSource?: (index: number) => Texture): void;
            loadNext(callback: (requeue: boolean) => void): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class MaterialLoader extends Loader<MaterialLoadable> {
            private readonly game;
            constructor(game: Game);
            protected onCreateItem(url: string): MaterialLoadable;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IMeshElement {
            mode: DrawMode;
            material: number | Material;
            indexOffset: number;
            indexCount: number;
            vertexOffset?: number;
            vertexCount?: number;
        }
        interface IMeshData {
            attributes: VertexAttribute[];
            elements: IMeshElement[];
            vertices: number[];
            indices: number[];
        }
        interface ICompressedMeshData {
            attributes: (VertexAttribute | string)[];
            elements: IMeshElement[];
            vertices: number[] | string;
            indices: number[] | string;
        }
        class MeshGroup {
            private static readonly maxIndexDataLength;
            private static readonly vertexComponentSize;
            private static nextId;
            readonly id: number;
            private readonly context;
            private readonly attribs;
            private readonly attribOffsets;
            readonly vertexLength: number;
            readonly indexSize: number;
            private readonly maxVertexDataLength;
            private readonly maxSubBufferLength;
            private vertexBuffer;
            private indexBuffer;
            private vertexData;
            private indexData;
            private vertexDataLength;
            private indexDataLength;
            private subBufferOffset;
            constructor(context: WebGLRenderingContext, attribs: VertexAttribute[]);
            clear(): void;
            compareTo(other: MeshGroup): number;
            canAddMeshData(data: IMeshData): boolean;
            private ensureCapacity<TArray>(array, length, ctor);
            private updateBuffer<TArray>(target, buffer, data, newData, oldData, offset);
            addVertexData(data: Float32Array, meshHandle?: MeshHandle): number;
            addIndexData(data: Uint32Array | Uint16Array, meshHandle?: MeshHandle): number;
            addMeshData(data: IMeshData, getMaterial: (materialIndex: number) => Material, target: MeshHandle[]): void;
            bufferBindBuffers(buf: CommandBuffer, program: ShaderProgram): void;
            bufferAttribPointers(buf: CommandBuffer, program: ShaderProgram, vertexOffset: number): void;
            bufferRenderElements(buf: CommandBuffer, mode: number, offset: number, count: number): void;
            dispose(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum DrawMode {
            Lines,
            LineStrip,
            LineLoop,
            Triangles,
            TriangleStrip,
            TriangleFan,
        }
        class MeshHandle {
            static readonly undefinedHandle: MeshHandle;
            program: ShaderProgram;
            readonly transform: Matrix4;
            readonly material: Material;
            readonly group: MeshGroup;
            readonly vertexOffset: number;
            readonly drawMode: DrawMode;
            readonly indexOffset: number;
            indexCount: number;
            constructor(group: MeshGroup, vertexOffset: number, drawMode: DrawMode, indexOffset: number, indexCount: number, material: Material, transform?: Matrix4);
            clone(newTransform: Matrix4, newMaterial?: Material): MeshHandle;
            compareTo(other: MeshHandle): number;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class MeshManager {
            private readonly context;
            private readonly game;
            private readonly groups;
            constructor(game: Game);
            static decompress(compressed: ICompressedMeshData): IMeshData;
            static createEmpty(attribs: VertexAttribute[]): IMeshData;
            static copyElement(src: IMeshData, dst: IMeshData, index: number): IMeshElement;
            static clone(data: IMeshData): IMeshData;
            static getAttributeOffset(attribs: VertexAttribute[], attrib: VertexAttribute): number;
            static getVertexLength(attribs: VertexAttribute[]): number;
            static transform3F(data: IMeshData, attrib: VertexAttribute, action: (vec: Vector3) => void): void;
            static transform4F(data: IMeshData, attrib: VertexAttribute, action: (vec: Vector4) => void, defaultW?: number): void;
            addMeshData(data: IMeshData, getMaterial?: (materialIndex: number) => Material, target?: MeshHandle[]): MeshHandle[];
            private composeFrameHandle;
            getComposeFrameMeshHandle(): MeshHandle;
            dispose(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IModelInfo {
            materials: string[];
            meshData: ICompressedMeshData;
        }
        abstract class Model extends RenderResource<Model> {
            readonly meshManager: MeshManager;
            readonly materialLoader: MaterialLoader;
            constructor(meshManager: MeshManager, materialLoader: MaterialLoader);
            abstract getMeshData(): IMeshData;
            abstract getMaterial(index: number): Material;
            abstract getMeshHandles(): MeshHandle[];
        }
        class ModelLoadable extends Model implements ILoadable {
            private readonly url;
            private materials;
            private meshData;
            private handles;
            private loadProgress;
            constructor(game: Game, url: string);
            getLoadProgress(): number;
            isLoaded(): boolean;
            getMaterial(index: number): Material;
            getMeshData(): IMeshData;
            getMeshHandles(): MeshHandle[];
            loadNext(callback: (requeue: boolean) => void): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class ModelLoader extends Loader<ModelLoadable> {
            private readonly game;
            constructor(game: Game);
            protected onCreateItem(url: string): ModelLoadable;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class ShaderManager {
            private namedPrograms;
            private ctorPrograms;
            readonly context: WebGLRenderingContext;
            constructor(context: WebGLRenderingContext);
            resetUniformCache(): void;
            private getFromName(name);
            private getFromCtor(ctor);
            get(name: string): ShaderProgram;
            get(ctor: IProgramCtor): ShaderProgram;
            createMaterial(ctor: IProgramCtor, isDynamic: boolean): Material;
            dispose(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IProgramCtor {
            new (context: WebGLRenderingContext): ShaderProgram;
        }
        abstract class ShaderProgram {
            private static nextId;
            readonly id: number;
            readonly context: WebGLRenderingContext;
            private program;
            private compiled;
            private readonly vertIncludes;
            private readonly fragIncludes;
            private nextTextureUnit;
            private attribNames;
            private attribIds;
            private attribLocations;
            private attribStates;
            private uniforms;
            readonly name: string;
            sortOrder: number;
            constructor(context: WebGLRenderingContext);
            toString(): string;
            createMaterialProperties(): any;
            reserveNextTextureUnit(): number;
            resetUniformCache(): void;
            dispose(): void;
            compareTo(other: ShaderProgram): number;
            compareMaterials(a: Material, b: Material): number;
            getProgram(): WebGLProgram;
            bufferAttribPointer(buf: CommandBuffer, attrib: VertexAttribute, stride: number, offset: number): void;
            isCompiled(): boolean;
            addAttribute(name: string, attrib: VertexAttribute): void;
            addUniform<TUniform extends Uniform>(name: string, ctor: IUniformCtor<TUniform>): TUniform;
            private static formatSource(source);
            protected includeShaderSource(type: number, source: string): void;
            private compileShader(type, source);
            private findAttribLocation(name, attrib);
            protected compile(): void;
            bufferEnableAttributes(buf: CommandBuffer, attribs?: VertexAttribute[]): void;
            bufferDisableAttributes(buf: CommandBuffer): void;
            bufferSetup(buf: CommandBuffer): void;
            bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void;
            bufferMaterial(buf: CommandBuffer, material: Material): void;
        }
        class BaseMaterialProps {
            noCull: boolean;
        }
        abstract class BaseShaderProgram<TMaterialProps extends BaseMaterialProps> extends ShaderProgram {
            private readonly materialPropsCtor;
            constructor(context: WebGLRenderingContext, ctor: {
                new (): TMaterialProps;
            });
            createMaterialProperties(): any;
            bufferMaterial(buf: CommandBuffer, material: Material): void;
            bufferMaterialProps(buf: CommandBuffer, props: TMaterialProps): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class ComposeFrame extends ShaderProgram {
                readonly frameColor: UniformSampler;
                readonly frameDepth: UniformSampler;
                constructor(context: WebGLRenderingContext);
                bufferSetup(buf: CommandBuffer): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class DebugLineProps extends BaseMaterialProps {
                noCull: boolean;
                color0: Vector3;
                color1: Vector3;
                phase: number;
                frequency: number;
            }
            class DebugLine extends BaseShaderProgram<DebugLineProps> {
                readonly projectionMatrix: UniformMatrix4;
                readonly viewMatrix: UniformMatrix4;
                readonly modelMatrix: UniformMatrix4;
                readonly time: Uniform4F;
                readonly color0: Uniform3F;
                readonly color1: Uniform3F;
                readonly phase: Uniform1F;
                readonly frequency: Uniform1F;
                constructor(context: WebGLRenderingContext);
                bufferSetup(buf: CommandBuffer): void;
                bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void;
                bufferMaterialProps(buf: CommandBuffer, props: DebugLineProps): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class Error extends ShaderProgram {
                readonly projectionMatrix: UniformMatrix4;
                readonly viewMatrix: UniformMatrix4;
                readonly modelMatrix: UniformMatrix4;
                readonly errorTexture: UniformSampler;
                constructor(context: WebGLRenderingContext);
                bufferSetup(buf: CommandBuffer): void;
                bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class ModelBaseMaterialProps extends BaseMaterialProps {
                baseTexture: Texture;
                noFog: boolean;
                translucent: boolean;
                shadowCast: boolean;
            }
            abstract class ModelBase<TMaterialProps extends ModelBaseMaterialProps> extends BaseShaderProgram<TMaterialProps> {
                readonly projectionMatrix: UniformMatrix4;
                readonly viewMatrix: UniformMatrix4;
                readonly modelMatrix: UniformMatrix4;
                readonly baseTexture: UniformSampler;
                readonly time: Uniform4F;
                readonly fogParams: Uniform4F;
                readonly fogColor: Uniform3F;
                readonly noFog: Uniform1F;
                constructor(context: WebGLRenderingContext, ctor: {
                    new (): TMaterialProps;
                });
                bufferSetup(buf: CommandBuffer): void;
                bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void;
                bufferMaterialProps(buf: CommandBuffer, props: TMaterialProps): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class VertexLitGenericMaterialProps extends ModelBaseMaterialProps {
                alpha: number;
                alphaTest: boolean;
            }
            class VertexLitGeneric extends ModelBase<VertexLitGenericMaterialProps> {
                readonly alpha: Uniform1F;
                readonly alphaTest: Uniform1F;
                readonly translucent: Uniform1F;
                constructor(context: WebGLRenderingContext);
                bufferMaterialProps(buf: CommandBuffer, props: VertexLitGenericMaterialProps): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class ShadowCamera extends WebGame.OrthographicCamera {
            readonly game: Game;
            private readonly targetCamera;
            constructor(game: Game, targetCamera: Camera);
            private addToFrustumBounds(vec, bounds);
            private static readonly getFrustumBounds_vec;
            private getFrustumBounds(near, far, bounds);
            private static readonly renderShadows_bounds;
            private static readonly renderShadows_vec1;
            private static readonly renderShadows_vec2;
            bufferCascadeBegin(lightRotation: Facepunch.Quaternion, near: number, far: number): void;
            bufferCascadeEnd(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class StaticProp extends DrawableEntity {
            private model;
            private tint;
            constructor();
            setColorTint(color: IVector3): void;
            setModel(model: Model): void;
            private onModelLoaded(model);
            getModel(): Model;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        abstract class Texture extends RenderResource<Texture> {
            private static nextId;
            readonly id: number;
            constructor();
            isLoaded(): boolean;
            abstract hasMipLevel(level: number): boolean;
            abstract getWidth(level: number): number;
            abstract getHeight(level: number): number;
            getFrameCount(): number;
            abstract getTarget(): TextureTarget;
            abstract getHandle(frame?: number): WebGLTexture;
            dispose(): void;
        }
        enum TextureFormat {
            Alpha,
            Rgb,
            Rgba,
            DepthComponent,
            Luminance,
        }
        enum TextureDataType {
            Uint8,
            Uint16,
            Uint32,
            Float,
        }
        enum TextureTarget {
            Texture2D,
            TextureCubeMap,
        }
        enum TextureWrapMode {
            ClampToEdge,
            Repeat,
            MirroredRepeat,
        }
        enum TextureMinFilter {
            Nearest,
            Linear,
            NearestMipmapNearest,
            LinearMipmapNearest,
            NearestMipmapLinear,
            LinearMipmapLinear,
        }
        enum TextureMagFilter {
            Nearest,
            Linear,
        }
        enum TextureParameterType {
            Integer,
            Float,
        }
        enum TextureParameter {
            WrapS,
            WrapT,
            MinFilter,
            MagFilter,
        }
        class RenderTexture extends Texture {
            readonly context: WebGLRenderingContext;
            readonly target: TextureTarget;
            readonly format: TextureFormat;
            readonly type: TextureDataType;
            private width;
            private height;
            private handle;
            constructor(context: WebGLRenderingContext, target: TextureTarget, format: TextureFormat, type: TextureDataType, width: number, height: number);
            hasMipLevel(level: number): boolean;
            getWidth(level: number): number;
            getHeight(level: number): number;
            setWrapMode(mode: TextureWrapMode): void;
            setWrapMode(wrapS: TextureWrapMode, wrapT: TextureWrapMode): void;
            setFilter(minFilter: TextureMinFilter, magFilter: TextureMagFilter): void;
            getTarget(): TextureTarget;
            getHandle(frame?: number): WebGLTexture;
            resize(width: number, height: number): void;
            protected onResize(width: number, height: number): void;
            dispose(): void;
        }
        interface IPixelData {
            readonly channels: number;
            readonly width: number;
            readonly height: number;
            readonly values: ArrayBufferView;
        }
        class PixelData<TArray extends ArrayBufferView> implements IPixelData {
            readonly channels: number;
            readonly width: number;
            readonly height: number;
            readonly values: TArray;
            constructor(format: TextureFormat, width: number, height: number, ctor: {
                new (size: number): TArray;
            });
        }
        class ProceduralTexture2D extends RenderTexture {
            private pixels;
            name: string;
            private static readonly channelBuffer;
            constructor(context: WebGLRenderingContext, width: number, height: number, format?: TextureFormat, type?: TextureDataType);
            setImage(image: HTMLImageElement): void;
            copyFrom(tex: Texture): void;
            toString(): string;
            setPixelRgb(x: number, y: number, rgb: number): void;
            setPixelRgba(x: number, y: number, rgba: number): void;
            setPixelColor(x: number, y: number, color: IColor): void;
            setPixel(x: number, y: number, channels: number[]): void;
            getPixelColor(x: number, y: number, target?: IColor): IColor;
            getPixel(x: number, y: number, target?: number[], dstIndex?: number): number[];
            setPixels(x: number, y: number, width: number, height: number, values: number[]): void;
            writePixels(): void;
            readPixels(): void;
            readPixels(frameBuffer: FrameBuffer): void;
            protected onResize(width: number, height: number): void;
        }
        class TextureUtils {
            private static whiteTexture;
            static getWhiteTexture(context: WebGLRenderingContext): Texture;
            private static blackTexture;
            static getBlackTexture(context: WebGLRenderingContext): Texture;
            private static translucentTexture;
            static getTranslucentTexture(context: WebGLRenderingContext): Texture;
            private static errorTexture;
            static getErrorTexture(context: WebGLRenderingContext): Texture;
        }
        enum TextureFilter {
            Nearest,
            Linear,
        }
        interface ITextureParameters {
            wrapS?: TextureWrapMode | "CLAMP_TO_EDGE" | "REPEAT" | "MIRRORED_REPEAT";
            wrapT?: TextureWrapMode | "CLAMP_TO_EDGE" | "REPEAT" | "MIRRORED_REPEAT";
            filter?: TextureFilter | "NEAREST" | "LINEAR";
            mipmap?: boolean;
        }
        interface IColor {
            r: number;
            g: number;
            b: number;
            a?: number;
        }
        interface ITextureElement {
            level: number;
            frame?: number;
            target?: TextureTarget | string;
            url?: string;
            color?: IColor;
        }
        interface ITextureInfo {
            path?: string;
            target: TextureTarget | string;
            width?: number;
            height?: number;
            frames?: number;
            params: ITextureParameters;
            elements: ITextureElement[];
        }
        class TextureLoadable extends Texture implements ILoadable {
            private readonly context;
            readonly url: string;
            private info;
            private frameCount;
            private nextElement;
            private readyFrameCount;
            private readyFrames;
            private frameHandles;
            private target;
            private filter;
            private mipmap;
            private level0Width;
            private level0Height;
            private loadProgress;
            constructor(context: WebGLRenderingContext, url: string);
            getLoadProgress(): number;
            hasMipLevel(level: number): boolean;
            isLoaded(): boolean;
            getWidth(level: number): number;
            getHeight(level: number): number;
            getFrameCount(): number;
            toString(): string;
            getTarget(): TextureTarget;
            getHandle(frame?: number): WebGLTexture;
            getLoadPriority(): number;
            private canLoadImmediately(index);
            private applyTexParameters();
            private getOrCreateHandle(frame);
            private static pixelBuffer;
            private loadColorElement(target, level, color);
            private loadImageElement(target, level, image);
            private loadElement(element, value?);
            loadFromInfo(info: ITextureInfo): void;
            loadNext(callback: (requeue: boolean) => void): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class TextureLoader extends Loader<TextureLoadable> {
            private readonly context;
            constructor(context: WebGLRenderingContext);
            protected onCreateItem(url: string): TextureLoadable;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IUniformCtor<TUniform extends Uniform> {
            new (program: ShaderProgram, name: string): TUniform;
        }
        abstract class Uniform {
            protected readonly context: WebGLRenderingContext;
            protected readonly program: ShaderProgram;
            private name;
            private location;
            private parameter;
            isSampler: boolean;
            constructor(program: ShaderProgram, name: string);
            toString(): string;
            getLocation(): WebGLUniformLocation;
            reset(): void;
            bufferParameter(buf: CommandBuffer, param: CommandBufferParameter): void;
        }
        class Uniform1F extends Uniform {
            private x;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number): void;
            set(x: number): void;
        }
        class Uniform1I extends Uniform {
            private x;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number): void;
            set(x: number): void;
        }
        class Uniform2F extends Uniform {
            private x;
            private y;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number, y: number): void;
            set(x: number, y: number): void;
        }
        class Uniform3F extends Uniform {
            private x;
            private y;
            private z;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number, y: number, z: number): void;
            set(x: number, y: number, z: number): void;
        }
        class Uniform4F extends Uniform {
            private x;
            private y;
            private z;
            private w;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number, y: number, z: number, w: number): void;
            set(x: number, y: number, z: number, w: number): void;
        }
        class UniformSampler extends Uniform {
            private value;
            private default;
            private texUnit;
            private sizeUniform;
            constructor(program: ShaderProgram, name: string);
            getSizeUniform(): Uniform4F;
            hasSizeUniform(): boolean;
            getTexUnit(): number;
            setDefault(tex: Texture): void;
            reset(): void;
            bufferValue(buf: CommandBuffer, tex: Texture): void;
            set(tex: Texture): void;
        }
        class UniformMatrix4 extends Uniform {
            private transpose;
            private values;
            reset(): void;
            bufferValue(buf: CommandBuffer, transpose: boolean, values: Float32Array): void;
            set(transpose: boolean, values: Float32Array): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum AttributeType {
            Float,
        }
        class VertexAttribute {
            private static nextId;
            static readonly position: VertexAttribute;
            static readonly normal: VertexAttribute;
            static readonly uv: VertexAttribute;
            static readonly uv2: VertexAttribute;
            static readonly rgb: VertexAttribute;
            static readonly rgba: VertexAttribute;
            static readonly alpha: VertexAttribute;
            static compare(a: VertexAttribute, b: VertexAttribute): number;
            readonly id: number;
            readonly size: number;
            readonly type: AttributeType;
            readonly normalized: boolean;
            constructor(size: number, type: AttributeType | string, normalized?: boolean);
        }
    }
}
