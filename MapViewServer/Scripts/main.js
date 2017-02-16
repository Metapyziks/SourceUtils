var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SourceUtils;
(function (SourceUtils) {
    var Api;
    (function (Api) {
        var BspIndexResponse = (function () {
            function BspIndexResponse() {
            }
            return BspIndexResponse;
        }());
        Api.BspIndexResponse = BspIndexResponse;
        var Vector3 = (function () {
            function Vector3() {
            }
            return Vector3;
        }());
        Api.Vector3 = Vector3;
        var Plane = (function () {
            function Plane() {
            }
            return Plane;
        }());
        Api.Plane = Plane;
        var BspModelResponse = (function () {
            function BspModelResponse() {
            }
            return BspModelResponse;
        }());
        Api.BspModelResponse = BspModelResponse;
        var BspElem = (function () {
            function BspElem() {
            }
            return BspElem;
        }());
        Api.BspElem = BspElem;
        var BspNode = (function (_super) {
            __extends(BspNode, _super);
            function BspNode() {
                _super.apply(this, arguments);
            }
            return BspNode;
        }(BspElem));
        Api.BspNode = BspNode;
        var BspLeaf = (function (_super) {
            __extends(BspLeaf, _super);
            function BspLeaf() {
                _super.apply(this, arguments);
            }
            return BspLeaf;
        }(BspElem));
        Api.BspLeaf = BspLeaf;
        (function (PrimitiveType) {
            PrimitiveType[PrimitiveType["TriangleList"] = 0] = "TriangleList";
            PrimitiveType[PrimitiveType["TriangleStrip"] = 1] = "TriangleStrip";
            PrimitiveType[PrimitiveType["TriangleFan"] = 2] = "TriangleFan";
        })(Api.PrimitiveType || (Api.PrimitiveType = {}));
        var PrimitiveType = Api.PrimitiveType;
        var Element = (function () {
            function Element() {
            }
            return Element;
        }());
        Api.Element = Element;
        (function (MeshComponent) {
            MeshComponent[MeshComponent["position"] = 1] = "position";
            MeshComponent[MeshComponent["normal"] = 2] = "normal";
            MeshComponent[MeshComponent["uv"] = 4] = "uv";
            MeshComponent[MeshComponent["uv2"] = 8] = "uv2";
        })(Api.MeshComponent || (Api.MeshComponent = {}));
        var MeshComponent = Api.MeshComponent;
        var Faces = (function () {
            function Faces() {
            }
            return Faces;
        }());
        Api.Faces = Faces;
        var BspFacesResponse = (function () {
            function BspFacesResponse() {
            }
            return BspFacesResponse;
        }());
        Api.BspFacesResponse = BspFacesResponse;
        var BspVisibilityResponse = (function () {
            function BspVisibilityResponse() {
            }
            return BspVisibilityResponse;
        }());
        Api.BspVisibilityResponse = BspVisibilityResponse;
        var Displacement = (function () {
            function Displacement() {
            }
            return Displacement;
        }());
        Api.Displacement = Displacement;
        var BspDisplacementsResponse = (function () {
            function BspDisplacementsResponse() {
            }
            return BspDisplacementsResponse;
        }());
        Api.BspDisplacementsResponse = BspDisplacementsResponse;
        (function (MaterialPropertyType) {
            MaterialPropertyType[MaterialPropertyType["boolean"] = 0] = "boolean";
            MaterialPropertyType[MaterialPropertyType["number"] = 1] = "number";
            MaterialPropertyType[MaterialPropertyType["texture2D"] = 2] = "texture2D";
            MaterialPropertyType[MaterialPropertyType["textureCube"] = 3] = "textureCube";
        })(Api.MaterialPropertyType || (Api.MaterialPropertyType = {}));
        var MaterialPropertyType = Api.MaterialPropertyType;
        var MaterialProperty = (function () {
            function MaterialProperty() {
            }
            return MaterialProperty;
        }());
        Api.MaterialProperty = MaterialProperty;
        var Material = (function () {
            function Material() {
            }
            return Material;
        }());
        Api.Material = Material;
        var BspMaterialsResponse = (function () {
            function BspMaterialsResponse() {
            }
            return BspMaterialsResponse;
        }());
        Api.BspMaterialsResponse = BspMaterialsResponse;
        (function (VtfFlags) {
            VtfFlags[VtfFlags["POINTSAMPLE"] = 1] = "POINTSAMPLE";
            VtfFlags[VtfFlags["TRILINEAR"] = 2] = "TRILINEAR";
            VtfFlags[VtfFlags["CLAMPS"] = 4] = "CLAMPS";
            VtfFlags[VtfFlags["CLAMPT"] = 8] = "CLAMPT";
            VtfFlags[VtfFlags["ANISOTROPIC"] = 16] = "ANISOTROPIC";
            VtfFlags[VtfFlags["HINT_DXT5"] = 32] = "HINT_DXT5";
            VtfFlags[VtfFlags["PWL_CORRECTED"] = 64] = "PWL_CORRECTED";
            VtfFlags[VtfFlags["NORMAL"] = 128] = "NORMAL";
            VtfFlags[VtfFlags["NOMIP"] = 256] = "NOMIP";
            VtfFlags[VtfFlags["NOLOD"] = 512] = "NOLOD";
            VtfFlags[VtfFlags["ALL_MIPS"] = 1024] = "ALL_MIPS";
            VtfFlags[VtfFlags["PROCEDURAL"] = 2048] = "PROCEDURAL";
            VtfFlags[VtfFlags["ONEBITALPHA"] = 4096] = "ONEBITALPHA";
            VtfFlags[VtfFlags["EIGHTBITALPHA"] = 8192] = "EIGHTBITALPHA";
            VtfFlags[VtfFlags["ENVMAP"] = 16384] = "ENVMAP";
            VtfFlags[VtfFlags["RENDERTARGET"] = 32768] = "RENDERTARGET";
            VtfFlags[VtfFlags["DEPTHRENDERTARGET"] = 65536] = "DEPTHRENDERTARGET";
            VtfFlags[VtfFlags["NODEBUGOVERRIDE"] = 131072] = "NODEBUGOVERRIDE";
            VtfFlags[VtfFlags["SINGLECOPY"] = 262144] = "SINGLECOPY";
            VtfFlags[VtfFlags["PRE_SRGB"] = 524288] = "PRE_SRGB";
            VtfFlags[VtfFlags["UNUSED_00100000"] = 1048576] = "UNUSED_00100000";
            VtfFlags[VtfFlags["UNUSED_00200000"] = 2097152] = "UNUSED_00200000";
            VtfFlags[VtfFlags["UNUSED_00400000"] = 4194304] = "UNUSED_00400000";
            VtfFlags[VtfFlags["NODEPTHBUFFER"] = 8388608] = "NODEPTHBUFFER";
            VtfFlags[VtfFlags["UNUSED_01000000"] = 16777216] = "UNUSED_01000000";
            VtfFlags[VtfFlags["CLAMPU"] = 33554432] = "CLAMPU";
            VtfFlags[VtfFlags["VERTEXTEXTURE"] = 67108864] = "VERTEXTEXTURE";
            VtfFlags[VtfFlags["SSBUMP"] = 134217728] = "SSBUMP";
            VtfFlags[VtfFlags["UNUSED_10000000"] = 268435456] = "UNUSED_10000000";
            VtfFlags[VtfFlags["BORDER"] = 536870912] = "BORDER";
            VtfFlags[VtfFlags["UNUSED_40000000"] = 1073741824] = "UNUSED_40000000";
            VtfFlags[VtfFlags["UNUSED_80000000"] = 2147483648] = "UNUSED_80000000";
        })(Api.VtfFlags || (Api.VtfFlags = {}));
        var VtfFlags = Api.VtfFlags;
        var VtfResponse = (function () {
            function VtfResponse() {
            }
            return VtfResponse;
        }());
        Api.VtfResponse = VtfResponse;
        var Color32 = (function () {
            function Color32() {
            }
            return Color32;
        }());
        Api.Color32 = Color32;
        var FogParams = (function () {
            function FogParams() {
            }
            return FogParams;
        }());
        Api.FogParams = FogParams;
    })(Api = SourceUtils.Api || (SourceUtils.Api = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="typings/lz-string/lz-string.d.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.decompressFloat32Array = function (value) {
            return new Float32Array(Utils.decompress(value));
        };
        Utils.decompressUint16Array = function (value) {
            return new Uint16Array(Utils.decompress(value));
        };
        Utils.decompressUint32Array = function (value) {
            return new Uint32Array(Utils.decompress(value));
        };
        Utils.decompress = function (value) {
            return typeof value === "string"
                ? JSON.parse(LZString.decompressFromBase64(value))
                : value;
        };
        return Utils;
    }());
    SourceUtils.Utils = Utils;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/threejs/three.d.ts" />
/// <reference path="Utils.ts"/>
var SourceUtils;
(function (SourceUtils) {
    (function (MouseButton) {
        MouseButton[MouseButton["Left"] = 1] = "Left";
        MouseButton[MouseButton["Middle"] = 2] = "Middle";
        MouseButton[MouseButton["Right"] = 3] = "Right";
    })(SourceUtils.MouseButton || (SourceUtils.MouseButton = {}));
    var MouseButton = SourceUtils.MouseButton;
    (function (Key) {
        Key[Key["Backspace"] = 8] = "Backspace";
        Key[Key["Tab"] = 9] = "Tab";
        Key[Key["Enter"] = 13] = "Enter";
        Key[Key["Shift"] = 16] = "Shift";
        Key[Key["Ctrl"] = 17] = "Ctrl";
        Key[Key["Alt"] = 18] = "Alt";
        Key[Key["PauseBreak"] = 19] = "PauseBreak";
        Key[Key["CapsLock"] = 20] = "CapsLock";
        Key[Key["Escape"] = 27] = "Escape";
        Key[Key["PageUp"] = 33] = "PageUp";
        Key[Key["PageDown"] = 34] = "PageDown";
        Key[Key["End"] = 35] = "End";
        Key[Key["Home"] = 36] = "Home";
        Key[Key["LeftArrow"] = 37] = "LeftArrow";
        Key[Key["UpArrow"] = 38] = "UpArrow";
        Key[Key["RightArrow"] = 39] = "RightArrow";
        Key[Key["DownArrow"] = 40] = "DownArrow";
        Key[Key["Insert"] = 45] = "Insert";
        Key[Key["Delete"] = 46] = "Delete";
        Key[Key["D0"] = 48] = "D0";
        Key[Key["D1"] = 49] = "D1";
        Key[Key["D2"] = 50] = "D2";
        Key[Key["D3"] = 51] = "D3";
        Key[Key["D4"] = 52] = "D4";
        Key[Key["D5"] = 53] = "D5";
        Key[Key["D6"] = 54] = "D6";
        Key[Key["D7"] = 55] = "D7";
        Key[Key["D8"] = 56] = "D8";
        Key[Key["D9"] = 57] = "D9";
        Key[Key["A"] = 65] = "A";
        Key[Key["B"] = 66] = "B";
        Key[Key["C"] = 67] = "C";
        Key[Key["D"] = 68] = "D";
        Key[Key["E"] = 69] = "E";
        Key[Key["F"] = 70] = "F";
        Key[Key["G"] = 71] = "G";
        Key[Key["H"] = 72] = "H";
        Key[Key["I"] = 73] = "I";
        Key[Key["J"] = 74] = "J";
        Key[Key["K"] = 75] = "K";
        Key[Key["L"] = 76] = "L";
        Key[Key["M"] = 77] = "M";
        Key[Key["N"] = 78] = "N";
        Key[Key["O"] = 79] = "O";
        Key[Key["P"] = 80] = "P";
        Key[Key["Q"] = 81] = "Q";
        Key[Key["R"] = 82] = "R";
        Key[Key["S"] = 83] = "S";
        Key[Key["T"] = 84] = "T";
        Key[Key["U"] = 85] = "U";
        Key[Key["V"] = 86] = "V";
        Key[Key["W"] = 87] = "W";
        Key[Key["X"] = 88] = "X";
        Key[Key["Y"] = 89] = "Y";
        Key[Key["Z"] = 90] = "Z";
        Key[Key["LeftWindowKey"] = 91] = "LeftWindowKey";
        Key[Key["RightWindowKey"] = 92] = "RightWindowKey";
        Key[Key["Select"] = 93] = "Select";
        Key[Key["Numpad0"] = 96] = "Numpad0";
        Key[Key["Numpad1"] = 97] = "Numpad1";
        Key[Key["Numpad2"] = 98] = "Numpad2";
        Key[Key["Numpad3"] = 99] = "Numpad3";
        Key[Key["Numpad4"] = 100] = "Numpad4";
        Key[Key["Numpad5"] = 101] = "Numpad5";
        Key[Key["Numpad6"] = 102] = "Numpad6";
        Key[Key["Numpad7"] = 103] = "Numpad7";
        Key[Key["Numpad8"] = 104] = "Numpad8";
        Key[Key["Numpad9"] = 105] = "Numpad9";
        Key[Key["Multiply"] = 106] = "Multiply";
        Key[Key["Add"] = 107] = "Add";
        Key[Key["Subtract"] = 109] = "Subtract";
        Key[Key["DecimalPoint"] = 110] = "DecimalPoint";
        Key[Key["Divide"] = 111] = "Divide";
        Key[Key["F1"] = 112] = "F1";
        Key[Key["F2"] = 113] = "F2";
        Key[Key["F3"] = 114] = "F3";
        Key[Key["F4"] = 115] = "F4";
        Key[Key["F5"] = 116] = "F5";
        Key[Key["F6"] = 117] = "F6";
        Key[Key["F7"] = 118] = "F7";
        Key[Key["F8"] = 119] = "F8";
        Key[Key["F9"] = 120] = "F9";
        Key[Key["F10"] = 121] = "F10";
        Key[Key["F11"] = 122] = "F11";
        Key[Key["F12"] = 123] = "F12";
        Key[Key["NumLock"] = 144] = "NumLock";
        Key[Key["ScrollLock"] = 145] = "ScrollLock";
        Key[Key["SemiColon"] = 186] = "SemiColon";
        Key[Key["EqualSign"] = 187] = "EqualSign";
        Key[Key["Comma"] = 188] = "Comma";
        Key[Key["Dash"] = 189] = "Dash";
        Key[Key["Period"] = 190] = "Period";
        Key[Key["ForwardSlash"] = 191] = "ForwardSlash";
        Key[Key["GraveAccent"] = 192] = "GraveAccent";
        Key[Key["OpenBracket"] = 219] = "OpenBracket";
        Key[Key["BackSlash"] = 220] = "BackSlash";
        Key[Key["CloseBraket"] = 221] = "CloseBraket";
        Key[Key["SingleQuote"] = 222] = "SingleQuote";
    })(SourceUtils.Key || (SourceUtils.Key = {}));
    var Key = SourceUtils.Key;
    var AppBase = (function () {
        function AppBase() {
            this.canLockPointer = false;
            this.previousTime = 0;
            this.mouseScreenPos = new THREE.Vector2();
            this.mouseLookDelta = new THREE.Vector2();
            this.dragStartScreenPos = new THREE.Vector2();
            this.heldKeys = new Array(128);
            this.heldMouseButtons = new Array(8);
        }
        AppBase.prototype.init = function (container) {
            var _this = this;
            this.container = container;
            this.camera = this.camera || new THREE.OrthographicCamera(-1, 1, -1, 1, -1, 1);
            this.canvas = $("<canvas/>")[0];
            this.context = this.canvas.getContext("webgl");
            this.onWindowResize();
            this.animateCallback = function (time) {
                var deltaTime = time - _this.previousTime;
                _this.previousTime = time;
                _this.animate(deltaTime * 0.001);
            };
            this.container.append(this.canvas);
            this.container.bind("mousewheel DOMMouseScroll", function (e) {
                if (e.type === "mousewheel") {
                    _this.onMouseScroll(e.originalEvent.wheelDelta / 400);
                }
                else if (e.type === "DOMMouseScroll") {
                    _this.onMouseScroll(e.originalEvent.detail / -10);
                }
            });
            this.container.mousedown(function (e) {
                _this.heldMouseButtons[e.which] = true;
                _this.onMouseDown(e.which, _this.getScreenPos(e.pageX, e.pageY, _this.mouseScreenPos));
                if (_this.canLockPointer)
                    _this.container[0].requestPointerLock();
                return false;
            });
            $(window).mouseup(function (e) {
                _this.heldMouseButtons[e.which] = false;
                _this.onMouseUp(e.which, _this.getScreenPos(e.pageX, e.pageY, _this.mouseScreenPos));
            });
            $(window).mousemove(function (e) {
                _this.onMouseMove(_this.getScreenPos(e.pageX, e.pageY, _this.mouseScreenPos));
                if (_this.isPointerLocked()) {
                    _this.mouseLookDelta.set(e.originalEvent.movementX, e.originalEvent.movementY);
                    _this.onMouseLook(_this.mouseLookDelta);
                }
            });
            $(window).keydown(function (e) {
                if (e.which < 0 || e.which >= 128)
                    return true;
                _this.heldKeys[e.which] = true;
                _this.onKeyDown(e.which);
                if (_this.isPointerLocked() && e.which === Key.Escape) {
                    document.exitPointerLock();
                }
                return e.which !== Key.Tab;
            });
            $(window).keyup(function (e) {
                if (e.which < 0 || e.which >= 128)
                    return true;
                _this.heldKeys[e.which] = false;
                _this.onKeyUp(e.which);
            });
            this.container.contextmenu(function () { return false; });
            window.addEventListener("resize", function () { return _this.onWindowResize(); }, false);
        };
        AppBase.prototype.isPointerLocked = function () {
            return document.pointerLockElement === this.container[0];
        };
        AppBase.prototype.toggleFullscreen = function () {
            var container = this.getContainer();
            if (document.fullscreenElement === container || document.webkitFullscreenElement === container) {
                if (document.exitFullscreen)
                    document.exitFullscreen();
                else if (document.webkitExitFullscreen)
                    document.webkitExitFullscreen();
            }
            else if (container.requestFullscreen) {
                container.requestFullscreen();
            }
            else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
        };
        AppBase.prototype.getContainer = function () {
            return this.container[0];
        };
        AppBase.prototype.getContext = function () {
            return this.context;
        };
        AppBase.prototype.getCanvas = function () {
            return this.canvas;
        };
        AppBase.prototype.getWidth = function () {
            return this.container.innerWidth();
        };
        AppBase.prototype.getHeight = function () {
            return this.container.innerHeight();
        };
        AppBase.prototype.getMouseScreenPos = function (out) {
            if (out == null)
                out = new THREE.Vector2();
            out.copy(this.mouseScreenPos);
            return out;
        };
        AppBase.prototype.getMouseViewPos = function (out) {
            if (out == null)
                out = new THREE.Vector2();
            this.getMouseScreenPos(out);
            out.x = out.x / this.getWidth() - 0.5;
            out.y = out.y / this.getHeight() - 0.5;
            return out;
        };
        AppBase.prototype.getScreenPos = function (pageX, pageY, out) {
            if (out == null)
                out = new THREE.Vector2();
            out.x = pageX - this.container.offset().left;
            out.y = pageY - this.container.offset().top;
            return out;
        };
        AppBase.prototype.onMouseScroll = function (delta) { };
        AppBase.prototype.onMouseDown = function (button, screenPos) {
            if (button === MouseButton.Left) {
                this.dragStartScreenPos = screenPos;
            }
        };
        AppBase.prototype.onMouseUp = function (button, screenPos) {
            if (button === MouseButton.Left && this.isDragging) {
                this.isDragging = false;
                this.onDragEnd();
            }
        };
        AppBase.prototype.onMouseMove = function (screenPos) {
            if (this.isMouseButtonDown(MouseButton.Left)) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.onDragStart(this.dragStartScreenPos);
                }
                this.onDragUpdate(screenPos);
            }
        };
        AppBase.prototype.onMouseLook = function (delta) { };
        AppBase.prototype.onDragStart = function (screenPos) { };
        AppBase.prototype.onDragUpdate = function (screenPos) { };
        AppBase.prototype.onDragEnd = function () { };
        AppBase.prototype.onKeyDown = function (key) { };
        AppBase.prototype.onKeyUp = function (key) { };
        AppBase.prototype.isKeyDown = function (key) {
            return key >= 0 && key < 128 && this.heldKeys[key];
        };
        AppBase.prototype.isMouseButtonDown = function (button) {
            return button >= 0 && button < this.heldMouseButtons.length && this.heldMouseButtons[button];
        };
        AppBase.prototype.onWindowResize = function () {
            this.canvas.width = this.container.innerWidth();
            this.canvas.height = this.container.innerHeight();
            this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.onUpdateCamera();
        };
        AppBase.prototype.onUpdateCamera = function () { };
        AppBase.prototype.animate = function (dt) {
            dt = dt || 0;
            requestAnimationFrame(this.animateCallback);
            this.onUpdateFrame(dt);
            this.onRenderFrame(dt);
        };
        AppBase.prototype.onUpdateFrame = function (dt) { };
        AppBase.prototype.onRenderFrame = function (dt) { };
        return AppBase;
    }());
    SourceUtils.AppBase = AppBase;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="AppBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Entity = (function (_super) {
        __extends(Entity, _super);
        function Entity() {
            _super.apply(this, arguments);
        }
        return Entity;
    }(THREE.Object3D));
    SourceUtils.Entity = Entity;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="Entity.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var BspModel = (function (_super) {
        __extends(BspModel, _super);
        function BspModel(map, index) {
            _super.call(this);
            this.map = map;
            this.index = index;
            this.drawList = new SourceUtils.DrawList(map);
            this.loadInfo(this.map.info.modelUrl.replace("{index}", index.toString()));
        }
        BspModel.prototype.getDrawList = function () {
            return this.drawList;
        };
        BspModel.prototype.loadInfo = function (url) {
            var _this = this;
            $.getJSON(url, function (data) {
                _this.info = data;
                _this.loadTree();
                _this.map.onModelLoaded(_this);
            });
        };
        BspModel.prototype.loadTree = function () {
            this.leaves = [];
            this.root = new SourceUtils.VisNode(this, SourceUtils.Utils.decompress(this.info.tree));
            this.root.getAllLeaves(this.leaves);
            if (this.index !== 0) {
                for (var i = 0; i < this.leaves.length; ++i) {
                    this.drawList.addItem(this.leaves[i]);
                }
            }
            this.map.refreshPvs();
        };
        BspModel.prototype.getLeaves = function () {
            return this.leaves;
        };
        BspModel.prototype.findLeaf = function (pos) {
            if (this.root == null)
                return null;
            var elem = this.root;
            while (!elem.isLeaf) {
                var node = elem;
                var index = node.plane.normal.dot(pos) >= node.plane.constant ? 0 : 1;
                elem = node.children[index];
            }
            return elem;
        };
        BspModel.prototype.render = function (camera) {
            camera.updateMatrixWorld(true);
            this.drawList.render(camera);
        };
        return BspModel;
    }(SourceUtils.Entity));
    SourceUtils.BspModel = BspModel;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var DrawListItem = (function () {
        function DrawListItem(tokenPrefix, tokenIndex) {
            this.loadedFaces = false;
            this.tokenPrefix = tokenPrefix;
            this.tokenIndex = tokenIndex;
        }
        DrawListItem.prototype.getIsVisible = function () {
            return this.drawList != null;
        };
        DrawListItem.prototype.onAddToDrawList = function (list) {
            this.drawList = list;
        };
        DrawListItem.prototype.onRemoveFromDrawList = function (list) {
            if (this.drawList === list)
                this.drawList = null;
        };
        DrawListItem.prototype.getMeshHandles = function (loader) {
            if (!this.loadedFaces) {
                this.loadedFaces = true;
                loader.loadFaces(this);
            }
            return this.meshHandles;
        };
        DrawListItem.prototype.faceLoadPriority = function (map) {
            if (!this.getIsVisible())
                return Number.POSITIVE_INFINITY;
            if (this.bounds == null)
                return Number.MAX_VALUE;
            var root = map.getPvsRoot();
            if (this === root || root == null)
                return 0;
            root.bounds.getCenter(DrawListItem.rootCenter);
            this.bounds.getCenter(DrawListItem.thisCenter);
            DrawListItem.rootCenter.sub(DrawListItem.thisCenter);
            return DrawListItem.rootCenter.lengthSq();
        };
        DrawListItem.prototype.onLoadFaces = function (handles) {
            this.meshHandles = handles;
            if (this.getIsVisible())
                this.drawList.updateItem(this);
        };
        DrawListItem.prototype.getApiQueryToken = function () { return "" + this.tokenPrefix + this.tokenIndex; };
        DrawListItem.rootCenter = new THREE.Vector3();
        DrawListItem.thisCenter = new THREE.Vector3();
        return DrawListItem;
    }());
    SourceUtils.DrawListItem = DrawListItem;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="DrawListItem.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Displacement = (function (_super) {
        __extends(Displacement, _super);
        function Displacement(info) {
            _super.call(this, "d", info.index);
            this.clusters = info.clusters;
            var min = info.min;
            var max = info.max;
            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
        }
        return Displacement;
    }(SourceUtils.DrawListItem));
    SourceUtils.Displacement = Displacement;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var DrawList = (function () {
        function DrawList(map) {
            this.items = [];
            this.handles = [];
            this.merged = [];
            this.map = map;
        }
        DrawList.prototype.clear = function () {
            for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                this.items[i].onRemoveFromDrawList(this);
            }
            this.items = [];
            this.handles = [];
        };
        DrawList.prototype.getDrawCalls = function () {
            return this.items.length;
        };
        DrawList.prototype.addItem = function (item) {
            this.items.push(item);
            this.updateItem(item);
            item.onAddToDrawList(this);
        };
        DrawList.prototype.updateItem = function (item) {
            this.handles = null;
        };
        DrawList.prototype.renderHandle = function (handle, camera) {
            var changedProgram = false;
            if (this.lastMaterialIndex !== handle.materialIndex) {
                this.lastMaterialIndex = handle.materialIndex;
                this.lastMaterial = this.map.getMaterial(handle.materialIndex);
                if (this.lastMaterial == null) {
                    this.canRender = false;
                    return;
                }
                if (this.lastProgram !== this.lastMaterial.getProgram()) {
                    if (this.lastProgram != null)
                        this.lastProgram.cleanupPostRender(this.map, camera);
                    this.lastProgram = this.lastMaterial.getProgram();
                    this.lastProgram.prepareForRendering(this.map, camera);
                    changedProgram = true;
                }
                this.canRender = this.lastProgram.isCompiled() && this.lastMaterial.prepareForRendering();
            }
            if (!this.canRender)
                return;
            if (this.lastGroup !== handle.group || changedProgram) {
                this.lastGroup = handle.group;
                this.lastGroup.prepareForRendering(this.lastMaterial.getProgram());
            }
            this.lastGroup.renderElements(handle.drawMode, handle.offset, handle.count);
        };
        DrawList.compareHandles = function (a, b) {
            return a.compareTo(b);
        };
        DrawList.prototype.buildHandleList = function () {
            this.handles = [];
            var loader = this.map.faceLoader;
            for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                var handles = this.items[i].getMeshHandles(loader);
                if (handles == null)
                    continue;
                for (var j = 0, jEnd = handles.length; j < jEnd; ++j) {
                    var handle = handles[j];
                    if (handle.count === 0)
                        continue;
                    if (handle.material == null) {
                        if ((handle.material = this.map.getMaterial(handle.materialIndex)) == null)
                            continue;
                    }
                    this.handles.push(handle);
                }
            }
            this.handles.sort(DrawList.compareHandles);
            this.merged = [];
            var last = null;
            for (var i = 0, iEnd = this.handles.length; i < iEnd; ++i) {
                var next = this.handles[i];
                if (last != null && last.canMerge(next)) {
                    last.merge(next);
                    continue;
                }
                last = new SourceUtils.WorldMeshHandle();
                this.merged.push(last);
                last.group = next.group;
                last.drawMode = next.drawMode;
                last.materialIndex = next.materialIndex;
                last.offset = next.offset;
                last.count = next.count;
            }
            if (this.map.getApp().logDrawCalls)
                console.log("Draw calls: " + this.merged.length);
        };
        DrawList.prototype.render = function (camera) {
            this.lastGroup = undefined;
            this.lastProgram = undefined;
            this.lastMaterial = undefined;
            this.lastMaterialIndex = undefined;
            this.lastIndex = undefined;
            if (this.handles == null)
                this.buildHandleList();
            for (var i = 0, iEnd = this.merged.length; i < iEnd; ++i) {
                this.renderHandle(this.merged[i], camera);
            }
            if (this.lastProgram != null)
                this.lastProgram.cleanupPostRender(this.map, camera);
        };
        return DrawList;
    }());
    SourceUtils.DrawList = DrawList;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var FaceData = (function () {
        function FaceData(faces) {
            this.components = faces.components;
            this.elements = faces.elements;
            this.vertices = SourceUtils.Utils.decompressFloat32Array(faces.vertices);
            this.indices = SourceUtils.Utils.decompressUint16Array(faces.indices);
        }
        return FaceData;
    }());
    SourceUtils.FaceData = FaceData;
    var FaceLoader = (function () {
        function FaceLoader(map) {
            this.queue = [];
            this.active = [];
            this.maxConcurrentRequests = 2;
            this.maxLeavesPerRequest = 512;
            this.map = map;
        }
        FaceLoader.prototype.loadFaces = function (target) {
            this.queue.push(target);
            this.update();
        };
        FaceLoader.prototype.getNextTask = function () {
            var bestScore = Number.POSITIVE_INFINITY;
            var bestIndex = -1;
            for (var i = 0; i < this.queue.length; ++i) {
                var task = this.queue[i];
                var score = task.faceLoadPriority(this.map);
                if (bestIndex > -1 && score >= bestScore)
                    continue;
                bestScore = score;
                bestIndex = i;
            }
            if (bestIndex === -1)
                return null;
            var result = this.queue[bestIndex];
            this.queue.splice(bestIndex, 1);
            return result;
        };
        FaceLoader.prototype.update = function () {
            var _this = this;
            if (this.queue.length <= 0 || this.active.length >= this.maxConcurrentRequests)
                return;
            var query = "";
            var tasks = [];
            while (tasks.length < this.maxLeavesPerRequest && this.queue.length > 0 && query.length < 1536) {
                var next = this.getNextTask();
                if (next == null)
                    break;
                if (query.length > 0)
                    query += "+";
                query += next.getApiQueryToken();
                tasks.push(next);
            }
            if (tasks.length === 0)
                return;
            this.active.push(tasks);
            var url = this.map.info.facesUrl
                .replace("{tokens}", query);
            $.getJSON(url, function (data) {
                for (var i = 0; i < data.facesList.length; ++i) {
                    var faces = data.facesList[i];
                    var task = tasks[i];
                    var handles = _this.map.meshManager.addFaces(new FaceData(faces));
                    task.onLoadFaces(handles);
                }
            }).fail(function () {
                var rangesStr = query.replace("+", ", ");
                console.log("Failed to load leaf faces [" + rangesStr + "].");
            }).always(function () {
                var index = _this.active.indexOf(tasks);
                _this.active.splice(index, 1);
                _this.update();
            });
        };
        return FaceLoader;
    }());
    SourceUtils.FaceLoader = FaceLoader;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="AppBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Map = (function (_super) {
        __extends(Map, _super);
        function Map(app, url) {
            _super.call(this);
            this.models = [];
            this.displacements = [];
            this.materials = [];
            this.pvsOrigin = new THREE.Vector3();
            this.pvs = [];
            this.app = app;
            this.frustumCulled = false;
            this.faceLoader = new SourceUtils.FaceLoader(this);
            this.textureLoader = new SourceUtils.TextureLoader(app.getContext());
            this.meshManager = new SourceUtils.WorldMeshManager(app.getContext());
            this.shaderManager = new SourceUtils.ShaderManager(app.getContext());
            this.blankTexture = new SourceUtils.BlankTexture(app.getContext(), new THREE.Color(1, 1, 1));
            this.blankMaterial = new SourceUtils.Material(this, "LightmappedGeneric");
            this.blankMaterial.properties.baseTexture = this.blankTexture;
            this.errorMaterial = new SourceUtils.Material(this, "LightmappedGeneric");
            this.errorMaterial.properties.baseTexture = new SourceUtils.ErrorTexture(app.getContext());
            this.loadInfo(url);
        }
        Map.prototype.getApp = function () {
            return this.app;
        };
        Map.prototype.getLightmap = function () {
            return this.lightmap || this.blankTexture;
        };
        Map.prototype.getBlankTexture = function () {
            return this.blankTexture;
        };
        Map.prototype.getPvsRoot = function () {
            return this.pvsRoot;
        };
        Map.prototype.getPvs = function () {
            return this.pvs;
        };
        Map.prototype.getWorldSpawn = function () {
            return this.models.length > 0 ? this.models[0] : null;
        };
        Map.prototype.getMaterial = function (index) {
            return index === -1 ? this.skyMaterial : (index < this.materials.length ? this.materials[index] : this.blankMaterial) || this.errorMaterial;
        };
        Map.prototype.loadInfo = function (url) {
            var _this = this;
            $.getJSON(url, function (data) {
                _this.info = data;
                _this.models = new Array(data.numModels);
                _this.clusters = new Array(data.numClusters);
                _this.pvsArray = new Array(data.numClusters);
                _this.add(_this.models[0] = new SourceUtils.BspModel(_this, 0));
                _this.loadDisplacements();
                _this.loadMaterials();
                _this.lightmap = new SourceUtils.Lightmap(_this.app.getContext(), data.lightmapUrl);
                _this.skyMaterial = new SourceUtils.Material(_this, data.skyMaterial);
                var spawnPos = data.playerStarts[0];
                _this.app.camera.position.set(spawnPos.x, spawnPos.y, spawnPos.z + 64);
                if (_this.info.fog != null && _this.info.fog.farZ !== -1) {
                    _this.app.camera.far = _this.info.fog.farZ;
                    _this.app.camera.updateProjectionMatrix();
                }
            });
        };
        Map.prototype.loadDisplacements = function () {
            var _this = this;
            $.getJSON(this.info.displacementsUrl, function (data) {
                _this.displacements = [];
                for (var i = 0; i < data.displacements.length; ++i) {
                    _this.displacements.push(new SourceUtils.Displacement(data.displacements[i]));
                }
                _this.refreshPvs();
            });
        };
        Map.prototype.loadMaterials = function () {
            var _this = this;
            $.getJSON(this.info.materialsUrl, function (data) {
                _this.materials = [];
                for (var i = 0; i < data.materials.length; ++i) {
                    var mat = data.materials[i];
                    if (mat == null) {
                        _this.materials.push(null);
                    }
                    else {
                        _this.materials.push(new SourceUtils.Material(_this, data.materials[i]));
                    }
                }
                _this.refreshPvs();
            });
        };
        Map.prototype.onModelLoaded = function (model) {
            if (model !== this.getWorldSpawn())
                return;
            var leaves = model.getLeaves();
            for (var i = 0; i < leaves.length; ++i) {
                var leaf = leaves[i];
                if (leaf.cluster === -1)
                    continue;
                this.clusters[leaf.cluster] = leaf;
            }
        };
        Map.prototype.replacePvs = function (pvs) {
            var drawList = this.getWorldSpawn().getDrawList();
            this.pvs = [];
            drawList.clear();
            for (var i = pvs.length - 1; i >= 0; --i) {
                drawList.addItem(pvs[i]);
                this.pvs.push(pvs[i]);
            }
            for (var i = this.displacements.length - 1; i >= 0; --i) {
                var disp = this.displacements[i];
                var clusters = disp.clusters;
                for (var j = 0, jEnd = clusters.length; j < jEnd; ++j) {
                    if (this.clusters[clusters[j]].getIsVisible()) {
                        drawList.addItem(disp);
                        break;
                    }
                }
            }
            this.faceLoader.update();
        };
        Map.prototype.render = function (camera) {
            this.textureLoader.update();
            var worldSpawn = this.getWorldSpawn();
            if (worldSpawn != null)
                worldSpawn.render(camera);
        };
        Map.prototype.updatePvs = function (position, force) {
            var worldSpawn = this.getWorldSpawn();
            if (worldSpawn == null)
                return;
            this.pvsOrigin.copy(position);
            var root = worldSpawn.findLeaf(position);
            if (root === this.pvsRoot && !force)
                return;
            this.pvsRoot = root;
            if (root == null || root.cluster === -1)
                return;
            var pvs = this.pvsArray[root.cluster];
            if (pvs !== null && pvs !== undefined) {
                if (pvs.length > 0)
                    this.replacePvs(pvs);
                return;
            }
            this.loadPvsArray(root.cluster);
        };
        Map.prototype.refreshPvs = function () {
            this.updatePvs(this.pvsOrigin, true);
        };
        Map.prototype.loadPvsArray = function (cluster) {
            var _this = this;
            var pvs = this.pvsArray[cluster] = [];
            var url = this.info.visibilityUrl.replace("{index}", cluster.toString());
            $.getJSON(url, function (data) {
                var indices = SourceUtils.Utils.decompress(data.pvs);
                for (var i = 0; i < indices.length; ++i) {
                    var leaf = _this.clusters[indices[i]];
                    if (leaf !== undefined)
                        pvs.push(leaf);
                }
                if (_this.pvsRoot != null && _this.pvsRoot.cluster === cluster) {
                    _this.replacePvs(pvs);
                }
            });
        };
        return Map;
    }(SourceUtils.Entity));
    SourceUtils.Map = Map;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="AppBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var MapViewer = (function (_super) {
        __extends(MapViewer, _super);
        function MapViewer() {
            _super.call(this);
            this.logFrameTime = false;
            this.logDrawCalls = false;
            this.lookAngs = new THREE.Vector2();
            this.lookQuat = new THREE.Quaternion(0, 0, 0, 1);
            this.countedFrames = 0;
            this.totalFrameTime = 0;
            this.unitZ = new THREE.Vector3(0, 0, 1);
            this.unitX = new THREE.Vector3(1, 0, 0);
            this.tempQuat = new THREE.Quaternion();
            this.canLockPointer = true;
        }
        MapViewer.prototype.init = function (container) {
            this.camera = new THREE.PerspectiveCamera(75, container.innerWidth() / container.innerHeight(), 1, 8192);
            this.camera.up.set(0, 0, 1);
            _super.prototype.init.call(this, container);
            this.getContext().clearColor(100 / 255, 149 / 255, 237 / 255, 1);
            this.updateCameraAngles();
        };
        MapViewer.prototype.loadMap = function (url) {
            this.map = new SourceUtils.Map(this, url);
        };
        MapViewer.prototype.onKeyDown = function (key) {
            _super.prototype.onKeyDown.call(this, key);
            if (key === SourceUtils.Key.F) {
                this.toggleFullscreen();
            }
        };
        MapViewer.prototype.onUpdateCamera = function () {
            var camera = this.camera;
            camera.aspect = this.getWidth() / this.getHeight();
            camera.updateProjectionMatrix();
        };
        MapViewer.prototype.updateCameraAngles = function () {
            if (this.lookAngs.y < -Math.PI * 0.5)
                this.lookAngs.y = -Math.PI * 0.5;
            if (this.lookAngs.y > Math.PI * 0.5)
                this.lookAngs.y = Math.PI * 0.5;
            this.lookQuat.setFromAxisAngle(this.unitZ, this.lookAngs.x);
            this.tempQuat.setFromAxisAngle(this.unitX, this.lookAngs.y + Math.PI * 0.5);
            this.lookQuat.multiply(this.tempQuat);
            this.camera.rotation.setFromQuaternion(this.lookQuat);
        };
        MapViewer.prototype.onMouseLook = function (delta) {
            _super.prototype.onMouseLook.call(this, delta);
            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.updateCameraAngles();
        };
        MapViewer.prototype.onUpdateFrame = function (dt) {
            _super.prototype.onUpdateFrame.call(this, dt);
            var move = new THREE.Vector3();
            var moveSpeed = 512 * dt;
            if (this.isKeyDown(SourceUtils.Key.W))
                move.z -= moveSpeed;
            if (this.isKeyDown(SourceUtils.Key.S))
                move.z += moveSpeed;
            if (this.isKeyDown(SourceUtils.Key.A))
                move.x -= moveSpeed;
            if (this.isKeyDown(SourceUtils.Key.D))
                move.x += moveSpeed;
            if (move.lengthSq() > 0) {
                move.applyEuler(this.camera.rotation);
                this.camera.position.add(move);
            }
            this.map.updatePvs(this.camera.position);
        };
        MapViewer.prototype.onRenderFrame = function (dt) {
            var gl = this.getContext();
            var t0 = performance.now();
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);
            this.map.shaderManager.setCurrentProgram(null);
            this.map.render(this.camera);
            var t1 = performance.now();
            if (this.logFrameTime) {
                this.totalFrameTime += (t1 - t0);
                this.countedFrames += 1;
                if (this.countedFrames > 100) {
                    var avgFrameTime = this.totalFrameTime / this.countedFrames;
                    console.log("Frametime: " + avgFrameTime + " ms (" + 1000 / avgFrameTime + " FPS)");
                    this.totalFrameTime = 0;
                    this.countedFrames = 0;
                }
            }
        };
        return MapViewer;
    }(SourceUtils.AppBase));
    SourceUtils.MapViewer = MapViewer;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var MaterialProperties = (function () {
        function MaterialProperties() {
            this.baseTexture = null;
            this.alphaTest = false;
            this.alpha = 1;
            this.noCull = false;
        }
        return MaterialProperties;
    }());
    SourceUtils.MaterialProperties = MaterialProperties;
    var Material = (function () {
        function Material(map, infoOrShader) {
            this.properties = new MaterialProperties();
            this.map = map;
            this.sortIndex = Material.nextSortIndex++;
            if (typeof infoOrShader == "string") {
                this.program = map.shaderManager.get(infoOrShader);
            }
            else {
                this.info = infoOrShader;
                this.program = map.shaderManager.get(this.info.shader);
                for (var i = 0; i < this.info.properties.length; ++i) {
                    this.addPropertyFromInfo(this.info.properties[i]);
                }
            }
        }
        Material.prototype.addPropertyFromInfo = function (info) {
            switch (info.type) {
                case SourceUtils.Api.MaterialPropertyType.boolean:
                case SourceUtils.Api.MaterialPropertyType.number:
                    this.properties[info.name] = info.value;
                    break;
                case SourceUtils.Api.MaterialPropertyType.texture2D:
                    this.properties[info.name] = this.map.textureLoader.load2D(info.value);
                    break;
                case SourceUtils.Api.MaterialPropertyType.textureCube:
                    this.properties[info.name] = this.map.textureLoader.loadCube(info.value);
                    break;
            }
        };
        Material.prototype.compareTo = function (other) {
            if (other === this)
                return 0;
            var programCompare = this.program.compareTo(other.program);
            if (programCompare !== 0)
                return programCompare;
            return this.sortIndex - other.sortIndex;
        };
        Material.prototype.getMap = function () {
            return this.map;
        };
        Material.prototype.getProgram = function () {
            return this.program;
        };
        Material.prototype.prepareForRendering = function () {
            return this.program.changeMaterial(this);
        };
        Material.nextSortIndex = 0;
        return Material;
    }());
    SourceUtils.Material = Material;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var ShaderManager = (function () {
        function ShaderManager(gl) {
            this.programs = {};
            this.gl = gl;
        }
        ShaderManager.prototype.getContext = function () {
            return this.gl;
        };
        ShaderManager.prototype.getCurrentProgram = function () {
            return this.currentProgram;
        };
        ShaderManager.prototype.setCurrentProgram = function (program) {
            if (this.currentProgram != null) {
                this.currentProgram.disableMeshComponents();
            }
            this.currentProgram = program;
        };
        ShaderManager.prototype.get = function (name) {
            var program = this.programs[name];
            if (program !== undefined)
                return program;
            var Type = Shaders[name];
            if (Type === undefined)
                throw "Unknown shader name '" + name + "'.";
            return this.programs[name] = new Type(this);
        };
        ShaderManager.prototype.dispose = function () {
            for (var name_1 in this.programs) {
                if (this.programs.hasOwnProperty(name_1)) {
                    this.programs[name_1].dispose();
                }
            }
            this.programs = {};
        };
        return ShaderManager;
    }());
    SourceUtils.ShaderManager = ShaderManager;
    var ShaderProgramAttributes = (function () {
        function ShaderProgramAttributes() {
        }
        return ShaderProgramAttributes;
    }());
    SourceUtils.ShaderProgramAttributes = ShaderProgramAttributes;
    var Uniform = (function () {
        function Uniform(program, name) {
            this.program = program;
            this.name = name;
            this.gl = program.getContext();
        }
        Uniform.prototype.getLocation = function () {
            if (this.location !== undefined)
                return this.location;
            if (!this.program.isCompiled())
                return undefined;
            this.location = this.gl.getUniformLocation(this.program.getProgram(), this.name);
        };
        Uniform.prototype.set1i = function (x) {
            this.gl.uniform1i(this.getLocation(), x);
        };
        Uniform.prototype.set1f = function (x) {
            this.gl.uniform1f(this.getLocation(), x);
        };
        Uniform.prototype.set2f = function (x, y) {
            this.gl.uniform2f(this.getLocation(), x, y);
        };
        Uniform.prototype.set3f = function (x, y, z) {
            this.gl.uniform3f(this.getLocation(), x, y, z);
        };
        Uniform.prototype.set4f = function (x, y, z, w) {
            this.gl.uniform4f(this.getLocation(), x, y, z, w);
        };
        Uniform.prototype.setMatrix4f = function (value, transpose) {
            if (transpose === void 0) { transpose = false; }
            this.gl.uniformMatrix4fv(this.getLocation(), transpose, value);
        };
        return Uniform;
    }());
    SourceUtils.Uniform = Uniform;
    var ShaderProgram = (function () {
        function ShaderProgram(manager) {
            this.compiled = false;
            this.attribNames = {};
            this.attribs = {};
            this.sortOrder = 0;
            this.enabledComponents = 0;
            this.modelViewMatrixValue = new THREE.Matrix4();
            this.manager = manager;
            this.sortIndex = ShaderProgram.nextSortIndex++;
            this.projectionMatrix = new Uniform(this, "uProjection");
            this.modelViewMatrix = new Uniform(this, "uModelView");
        }
        ShaderProgram.prototype.dispose = function () {
            if (this.program !== undefined) {
                this.getContext().deleteProgram(this.program);
                this.program = undefined;
            }
        };
        ShaderProgram.prototype.compareTo = function (other) {
            if (other === this)
                return 0;
            var orderCompare = this.sortOrder - other.sortOrder;
            if (orderCompare !== 0)
                return orderCompare;
            return this.sortIndex - other.sortIndex;
        };
        ShaderProgram.prototype.getProgram = function () {
            if (this.program === undefined) {
                return this.program = this.getContext().createProgram();
            }
            return this.program;
        };
        ShaderProgram.prototype.setVertexAttribPointer = function (component, size, type, normalized, stride, offset) {
            var loc = this.attribs[component];
            if (loc === undefined)
                return;
            this.getContext().vertexAttribPointer(loc, size, type, normalized, stride, offset);
        };
        ShaderProgram.prototype.isCompiled = function () {
            return this.compiled;
        };
        ShaderProgram.prototype.use = function () {
            if (this.program === undefined)
                return false;
            if (this.manager.getCurrentProgram() === this)
                return true;
            this.manager.setCurrentProgram(this);
            this.getContext().useProgram(this.program);
            return true;
        };
        ShaderProgram.prototype.addAttribute = function (name, component) {
            this.attribNames[name] = component;
        };
        ShaderProgram.prototype.getContext = function () {
            return this.manager.getContext();
        };
        ShaderProgram.prototype.loadShaderSource = function (type, url) {
            var _this = this;
            $.get(url + "?v=" + Math.random(), function (source) { return _this.onLoadShaderSource(type, source); });
        };
        ShaderProgram.prototype.hasAllSources = function () {
            return this.vertSource !== undefined && this.fragSource !== undefined;
        };
        ShaderProgram.prototype.onLoadShaderSource = function (type, source) {
            switch (type) {
                case WebGLRenderingContext.VERTEX_SHADER:
                    this.vertSource = source;
                    break;
                case WebGLRenderingContext.FRAGMENT_SHADER:
                    this.fragSource = source;
                    break;
                default:
                    return;
            }
            if (this.hasAllSources()) {
                this.compile();
            }
        };
        ShaderProgram.prototype.compileShader = function (type, source) {
            var gl = this.getContext();
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                var error = "Shader compilation error:\n" + gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                throw error;
            }
            return shader;
        };
        ShaderProgram.prototype.findAttribLocation = function (name, component) {
            var gl = this.getContext();
            var loc = gl.getAttribLocation(this.program, name);
            if (loc === -1)
                throw "Unable to find attribute with name '" + name + "'.";
            this.attribs[component] = loc;
        };
        ShaderProgram.prototype.compile = function () {
            var gl = this.getContext();
            var vert = this.compileShader(gl.VERTEX_SHADER, this.vertSource);
            var frag = this.compileShader(gl.FRAGMENT_SHADER, this.fragSource);
            var prog = this.getProgram();
            gl.attachShader(prog, vert);
            gl.attachShader(prog, frag);
            gl.linkProgram(prog);
            gl.deleteShader(vert);
            gl.deleteShader(frag);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                throw "Program linking error: " + gl.getProgramInfoLog(prog);
            }
            this.attribs = new ShaderProgramAttributes();
            for (var name_2 in this.attribNames) {
                if (this.attribNames.hasOwnProperty(name_2)) {
                    this.findAttribLocation(name_2, this.attribNames[name_2]);
                }
            }
            this.compiled = true;
        };
        ShaderProgram.prototype.enableMeshComponents = function (components) {
            var gl = this.getContext();
            var diff = this.enabledComponents ^ components;
            var component = 1;
            while (diff >= component) {
                if ((diff & component) === component) {
                    var attrib = this.attribs[component];
                    if (attrib !== undefined) {
                        if ((components & component) === component)
                            gl.enableVertexAttribArray(attrib);
                        else
                            gl.disableVertexAttribArray(attrib);
                    }
                }
                component <<= 1;
            }
            this.enabledComponents = components;
        };
        ShaderProgram.prototype.disableMeshComponents = function () {
            this.enableMeshComponents(0);
        };
        ShaderProgram.prototype.prepareForRendering = function (map, camera) {
            if (!this.isCompiled())
                return;
            this.modelViewMatrixValue.getInverse(camera.matrixWorld);
            this.use();
            this.projectionMatrix.setMatrix4f(camera.projectionMatrix.elements);
            this.modelViewMatrix.setMatrix4f(this.modelViewMatrixValue.elements);
            this.noCull = false;
        };
        ShaderProgram.prototype.cleanupPostRender = function (map, camera) {
            var gl = this.getContext();
            if (this.noCull)
                gl.enable(gl.CULL_FACE);
        };
        ShaderProgram.prototype.changeMaterial = function (material) {
            var gl = this.getContext();
            if (this.noCull !== material.properties.noCull) {
                this.noCull = material.properties.noCull;
                if (this.noCull)
                    gl.disable(gl.CULL_FACE);
                else
                    gl.enable(gl.CULL_FACE);
            }
            return true;
        };
        ShaderProgram.nextSortIndex = 0;
        return ShaderProgram;
    }());
    SourceUtils.ShaderProgram = ShaderProgram;
    var Shaders;
    (function (Shaders) {
        var LightmappedBase = (function (_super) {
            __extends(LightmappedBase, _super);
            function LightmappedBase(manager) {
                _super.call(this, manager);
                this.addAttribute("aPosition", SourceUtils.Api.MeshComponent.position);
                this.addAttribute("aTextureCoord", SourceUtils.Api.MeshComponent.uv);
                this.addAttribute("aLightmapCoord", SourceUtils.Api.MeshComponent.uv2);
                this.baseTexture = new Uniform(this, "uBaseTexture");
                this.lightmap = new Uniform(this, "uLightmap");
                this.fogParams = new Uniform(this, "uFogParams");
                this.fogColor = new Uniform(this, "uFogColor");
            }
            LightmappedBase.prototype.prepareForRendering = function (map, camera) {
                _super.prototype.prepareForRendering.call(this, map, camera);
                var perspCamera = camera;
                var fog = map.info.fog;
                if (fog.enabled) {
                    var densMul = fog.maxDensity / ((fog.end - fog.start) * (perspCamera.far - perspCamera.near));
                    var nearDensity = (perspCamera.near - fog.start) * densMul;
                    var farDensity = (perspCamera.far - fog.start) * densMul;
                    var clrMul = 1 / 255;
                    this.fogParams.set2f(nearDensity, farDensity);
                    this.fogColor.set3f(fog.color.r * clrMul, fog.color.g * clrMul, fog.color.b * clrMul);
                }
                else {
                    this.fogParams.set2f(0, 0);
                }
                var gl = this.getContext();
                var lightmap = map.getLightmap();
                if (lightmap == null || !lightmap.isLoaded()) {
                    lightmap = map.getBlankTexture();
                }
                gl.activeTexture(gl.TEXTURE0 + 2);
                gl.bindTexture(gl.TEXTURE_2D, lightmap.getHandle());
                this.lightmap.set1i(2);
            };
            LightmappedBase.prototype.changeMaterial = function (material) {
                if (!_super.prototype.changeMaterial.call(this, material))
                    return false;
                var gl = this.getContext();
                var tex = material.properties.baseTexture;
                if (tex == null || !tex.isLoaded()) {
                    tex = material.getMap().getBlankTexture();
                }
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, tex.getHandle());
                this.baseTexture.set1i(0);
                return true;
            };
            return LightmappedBase;
        }(ShaderProgram));
        Shaders.LightmappedBase = LightmappedBase;
        var LightmappedGeneric = (function (_super) {
            __extends(LightmappedGeneric, _super);
            function LightmappedGeneric(manager) {
                _super.call(this, manager);
                this.sortOrder = 0;
                var gl = this.getContext();
                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedGeneric.frag.txt");
                this.alphaTest = new Uniform(this, "uAlphaTest");
            }
            LightmappedGeneric.prototype.changeMaterial = function (material) {
                if (!_super.prototype.changeMaterial.call(this, material))
                    return false;
                this.alphaTest.set1f(material.properties.alphaTest ? 1 : 0);
                return true;
            };
            return LightmappedGeneric;
        }(LightmappedBase));
        Shaders.LightmappedGeneric = LightmappedGeneric;
        var LightmappedTranslucent = (function (_super) {
            __extends(LightmappedTranslucent, _super);
            function LightmappedTranslucent(manager) {
                _super.call(this, manager);
                this.sortOrder = 2000;
                var gl = this.getContext();
                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedTranslucent.frag.txt");
                this.alpha = new Uniform(this, "uAlpha");
            }
            LightmappedTranslucent.prototype.prepareForRendering = function (map, camera) {
                _super.prototype.prepareForRendering.call(this, map, camera);
                var gl = this.getContext();
                gl.depthMask(false);
                gl.enable(gl.BLEND);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            };
            LightmappedTranslucent.prototype.changeMaterial = function (material) {
                if (!_super.prototype.changeMaterial.call(this, material))
                    return false;
                this.alpha.set1f(material.properties.alpha);
                return true;
            };
            LightmappedTranslucent.prototype.cleanupPostRender = function (map, camera) {
                var gl = this.getContext();
                gl.depthMask(true);
                gl.disable(gl.BLEND);
                _super.prototype.cleanupPostRender.call(this, map, camera);
            };
            return LightmappedTranslucent;
        }(LightmappedBase));
        Shaders.LightmappedTranslucent = LightmappedTranslucent;
        var Sky = (function (_super) {
            __extends(Sky, _super);
            function Sky(manager) {
                _super.call(this, manager);
                this.sortOrder = 1000;
                var gl = this.getContext();
                this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Sky.vert.txt");
                this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Sky.frag.txt");
                this.addAttribute("aPosition", SourceUtils.Api.MeshComponent.position);
                this.cameraPos = new Uniform(this, "uCameraPos");
                this.skyCube = new Uniform(this, "uSkyCube");
            }
            Sky.prototype.prepareForRendering = function (map, camera) {
                _super.prototype.prepareForRendering.call(this, map, camera);
                this.cameraPos.set3f(camera.position.x, camera.position.y, camera.position.z);
            };
            Sky.prototype.changeMaterial = function (material) {
                _super.prototype.changeMaterial.call(this, material);
                var gl = this.getContext();
                var tex = material.properties.baseTexture;
                if (tex == null || !tex.isLoaded())
                    return false;
                gl.activeTexture(gl.TEXTURE0 + 1);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex.getHandle());
                this.skyCube.set1i(1);
                return true;
            };
            return Sky;
        }(ShaderProgram));
        Shaders.Sky = Sky;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var Texture = (function () {
        function Texture(gl, target) {
            this.highestLevel = Number.MIN_VALUE;
            this.lowestLevel = Number.MAX_VALUE;
            this.context = gl;
            this.target = target;
        }
        Texture.prototype.isLoaded = function () {
            return this.getHandle() !== undefined;
        };
        Texture.prototype.getContext = function () {
            return this.context;
        };
        Texture.prototype.getHandle = function () {
            this.onGetHandle();
            return this.handle;
        };
        Texture.prototype.getHighestMipLevel = function () {
            return this.highestLevel;
        };
        Texture.prototype.getLowestMipLevel = function () {
            return this.lowestLevel;
        };
        Texture.prototype.onGetHandle = function () { };
        Texture.prototype.loadLevel = function (url, mipLevel, callBack) {
            var _this = this;
            var image = new Image();
            image.src = url;
            image.onload = function () { return _this.onLoad(image, mipLevel, callBack); };
        };
        Texture.prototype.setupTexParams = function (target) {
            var gl = this.context;
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            var anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
            if (anisoExt != null) {
                gl.texParameterf(target, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, 4);
            }
        };
        Texture.prototype.getOrCreateHandle = function () {
            var gl = this.context;
            var firstTime = false;
            if (this.handle === undefined) {
                this.handle = gl.createTexture();
                firstTime = true;
            }
            gl.bindTexture(this.target, this.handle);
            if (firstTime)
                this.setupTexParams(this.target);
            return this.handle;
        };
        Texture.prototype.onLoad = function (image, mipLevel, callBack) {
            var gl = this.context;
            this.getOrCreateHandle();
            gl.texImage2D(this.target, mipLevel, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            if (mipLevel > this.highestLevel) {
                this.highestLevel = mipLevel;
            }
            if (mipLevel < this.lowestLevel) {
                this.lowestLevel = mipLevel;
                if (mipLevel !== 0) {
                    gl.texImage2D(this.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }
            }
            if (callBack != null)
                callBack();
        };
        Texture.prototype.loadPixels = function (width, height, values) {
            var gl = this.context;
            this.getOrCreateHandle();
            gl.texImage2D(this.target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
        };
        return Texture;
    }());
    SourceUtils.Texture = Texture;
    var Lightmap = (function (_super) {
        __extends(Lightmap, _super);
        function Lightmap(gl, url) {
            _super.call(this, gl, gl.TEXTURE_2D);
            this.loadLevel(url, 0);
        }
        return Lightmap;
    }(Texture));
    SourceUtils.Lightmap = Lightmap;
    var BlankTexture = (function (_super) {
        __extends(BlankTexture, _super);
        function BlankTexture(gl, color) {
            _super.call(this, gl, gl.TEXTURE_2D);
            this.loadPixels(1, 1, new Uint8Array([Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), 255]));
        }
        return BlankTexture;
    }(Texture));
    SourceUtils.BlankTexture = BlankTexture;
    var ErrorTexture = (function (_super) {
        __extends(ErrorTexture, _super);
        function ErrorTexture(gl) {
            _super.call(this, gl, gl.TEXTURE_2D);
            var resolution = 64;
            var pixels = new Uint8Array(resolution * resolution * 4);
            for (var y = 0; y < resolution; ++y)
                for (var x = 0; x < resolution; ++x) {
                    if (((x * 4 / resolution) & 1) === ((y * 4 / resolution) & 1)) {
                        pixels[(x + y * resolution) * 4 + 0] = 0xff;
                        pixels[(x + y * resolution) * 4 + 2] = 0xff;
                    }
                    else {
                        pixels[(x + y * resolution) * 4 + 0] = 0x00;
                        pixels[(x + y * resolution) * 4 + 2] = 0x00;
                    }
                    pixels[(x + y * resolution) * 4 + 1] = 0x00;
                    pixels[(x + y * resolution) * 4 + 3] = 0xff;
                }
            this.loadPixels(resolution, resolution, pixels);
        }
        return ErrorTexture;
    }(Texture));
    SourceUtils.ErrorTexture = ErrorTexture;
    var ValveTexture = (function (_super) {
        __extends(ValveTexture, _super);
        function ValveTexture(gl, target) {
            _super.call(this, gl, target);
            this.usesSinceLastLoad = 0;
        }
        ValveTexture.prototype.onGetHandle = function () {
            ++this.usesSinceLastLoad;
        };
        ValveTexture.prototype.getUsesSinceLastLoad = function () {
            return this.usesSinceLastLoad;
        };
        ValveTexture.prototype.loadNext = function (callback) {
            this.usesSinceLastLoad = 0;
        };
        return ValveTexture;
    }(Texture));
    SourceUtils.ValveTexture = ValveTexture;
    var ValveTexture2D = (function (_super) {
        __extends(ValveTexture2D, _super);
        function ValveTexture2D(gl, url) {
            _super.call(this, gl, gl.TEXTURE_2D);
            this.vtfUrl = url;
        }
        ValveTexture2D.prototype.loadNext = function (callback) {
            var _this = this;
            _super.prototype.loadNext.call(this, null);
            if (this.info == null) {
                this.loadInfo(function () { return callback(true); });
                return;
            }
            this.loadLevel(this.info.pngUrl.replace("{mipmap}", this.nextLevel.toString()), this.nextLevel, function () {
                --_this.nextLevel;
                callback(_this.nextLevel >= 0);
            });
        };
        ValveTexture2D.prototype.loadInfo = function (callback) {
            var _this = this;
            $.getJSON(this.vtfUrl, function (data) {
                _this.info = data;
                _this.nextLevel = Math.max(0, data.mipmaps - 1);
            }).always(function () {
                if (callback != null)
                    callback();
            });
        };
        ValveTexture2D.prototype.onLoad = function (image, mipLevel, callBack) {
            _super.prototype.onLoad.call(this, image, mipLevel);
            if (this.getLowestMipLevel() === 0 &&
                this.getHighestMipLevel() === this.info.mipmaps - 1 &&
                this.info.width === this.info.height) {
                var gl = this.getContext();
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }
            if (callBack != null)
                callBack();
        };
        return ValveTexture2D;
    }(ValveTexture));
    SourceUtils.ValveTexture2D = ValveTexture2D;
    var ValveTextureCube = (function (_super) {
        __extends(ValveTextureCube, _super);
        function ValveTextureCube(gl, urls) {
            _super.call(this, gl, gl.TEXTURE_CUBE_MAP);
            this.infos = [];
            this.loadedInfo = false;
            this.nextFace = 0;
            this.vtfUrls = urls;
        }
        ValveTextureCube.prototype.isLoaded = function () { return _super.prototype.isLoaded.call(this) && this.loadedInfo && this.nextFace >= 6; };
        ValveTextureCube.prototype.loadNext = function (callback) {
            var _this = this;
            _super.prototype.loadNext.call(this, null);
            if (!this.loadedInfo) {
                this.loadInfo(this.nextFace, function (success) { return callback(success); });
                return;
            }
            this.loadLevel(this.infos[this.nextFace].pngUrl.replace("{mipmap}", "0"), this.nextFace, function () {
                ++_this.nextFace;
                callback(_this.nextFace < 6);
            });
        };
        ValveTextureCube.prototype.loadInfo = function (face, callback) {
            var _this = this;
            $.getJSON(this.vtfUrls[face], function (data) {
                _this.infos[face] = data;
                _this.nextFace++;
                if (_this.nextFace >= 6) {
                    _this.nextFace = 0;
                    _this.faceSize = _this.infos[0].width;
                    _this.loadedInfo = true;
                }
                if (callback != null)
                    callback(true);
            }).fail(function () {
                if (callback != null)
                    callback(false);
            });
        };
        ValveTextureCube.prototype.setupTexParams = function (target) {
            var gl = this.getContext();
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
        ValveTextureCube.prototype.onLoad = function (image, face, callBack) {
            var gl = this.getContext();
            this.getOrCreateHandle();
            var target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + face;
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            if (image.width === image.height && image.width === this.faceSize) {
                gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            }
            else if (image.height > image.width) {
                console.warn("Cubemap texture has height > width (" + this.infos[face].pngUrl + ").");
            }
            else {
                gl.texImage2D(target, 0, gl.RGBA, this.faceSize, this.faceSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                // Ignore bottom face
                if (face !== 2) {
                    gl.texSubImage2D(target, 0, 0, this.faceSize - image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }
            }
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
            if (callBack != null)
                callBack();
        };
        return ValveTextureCube;
    }(ValveTexture));
    SourceUtils.ValveTextureCube = ValveTextureCube;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var TextureLoader = (function () {
        function TextureLoader(gl) {
            this.maxConcurrentRequests = 2;
            this.queue = [];
            this.active = 0;
            this.context = gl;
        }
        TextureLoader.prototype.load2D = function (url) {
            var vtf = new SourceUtils.ValveTexture2D(this.context, url);
            this.queue.push(vtf);
            this.update();
            return vtf;
        };
        TextureLoader.prototype.loadCube = function (urls) {
            var vtf = new SourceUtils.ValveTextureCube(this.context, urls);
            this.queue.push(vtf);
            this.update();
            return vtf;
        };
        TextureLoader.prototype.getNextToLoad = function () {
            if (this.queue.length <= 0 || this.active >= this.maxConcurrentRequests)
                return null;
            var bestIndex = -1;
            var bestScore = 0;
            var bestMip = -1;
            for (var i = 0, iEnd = this.queue.length; i < iEnd; ++i) {
                var item = this.queue[i];
                var mipLevel = item.getLowestMipLevel();
                if (mipLevel < bestMip)
                    continue;
                var score = item.getUsesSinceLastLoad();
                if (score > bestScore || mipLevel > bestMip && score > 0) {
                    bestIndex = i;
                    bestScore = score;
                    bestMip = mipLevel;
                }
            }
            if (bestIndex === -1)
                return null;
            return this.queue.splice(bestIndex, 1)[0];
        };
        TextureLoader.prototype.update = function () {
            var _this = this;
            var next;
            var _loop_1 = function() {
                ++this_1.active;
                var nextCopy = next;
                next.loadNext(function (requeue) {
                    --_this.active;
                    if (requeue)
                        _this.queue.push(nextCopy);
                    _this.update();
                });
            };
            var this_1 = this;
            while ((next = this.getNextToLoad()) != null) {
                _loop_1();
            }
        };
        return TextureLoader;
    }());
    SourceUtils.TextureLoader = TextureLoader;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var VisLeaf = (function (_super) {
        __extends(VisLeaf, _super);
        function VisLeaf(info) {
            _super.call(this, "l", info.index);
            this.isLeaf = true;
            var min = info.min;
            var max = info.max;
            this.leafIndex = info.index;
            this.cluster = info.cluster === undefined ? -1 : info.cluster;
            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
        }
        VisLeaf.prototype.getAllLeaves = function (dstArray) {
            dstArray.push(this);
        };
        return VisLeaf;
    }(SourceUtils.DrawListItem));
    SourceUtils.VisLeaf = VisLeaf;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var VisNode = (function () {
        function VisNode(model, info) {
            this.isLeaf = false;
            var normal = info.plane.normal;
            var min = info.min;
            var max = info.max;
            this.plane = new THREE.Plane(new THREE.Vector3(normal.x, normal.y, normal.z), info.plane.dist);
            this.bounds = new THREE.Box3(new THREE.Vector3(min
                .x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
            this.children = [
                VisNode.createVisElem(model, info.children[0]),
                VisNode.createVisElem(model, info.children[1])
            ];
        }
        VisNode.createVisElem = function (model, info) {
            if (info.children != undefined) {
                return new VisNode(model, info);
            }
            else {
                return new SourceUtils.VisLeaf(info);
            }
        };
        VisNode.prototype.getAllLeaves = function (dstArray) {
            this.children[0].getAllLeaves(dstArray);
            this.children[1].getAllLeaves(dstArray);
        };
        return VisNode;
    }());
    SourceUtils.VisNode = VisNode;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WorldMeshHandle = (function () {
        function WorldMeshHandle(group, drawMode, material, offset, count) {
            this.group = group;
            this.drawMode = drawMode;
            if (typeof material === "number") {
                this.materialIndex = material;
            }
            else {
                this.material = material;
            }
            this.offset = offset;
            this.count = count;
        }
        WorldMeshHandle.prototype.compareTo = function (other) {
            var matComp = this.material.compareTo(other.material);
            if (matComp !== 0)
                return matComp;
            var groupComp = this.group.compareTo(other.group);
            if (groupComp !== 0)
                return groupComp;
            return this.offset - other.offset;
        };
        WorldMeshHandle.prototype.canMerge = function (other) {
            return this.group === other.group
                && this.drawMode === other.drawMode
                && this.materialIndex === other.materialIndex
                && this.offset + this.count === other.offset;
        };
        WorldMeshHandle.prototype.merge = function (other) {
            this.count += other.count;
        };
        return WorldMeshHandle;
    }());
    SourceUtils.WorldMeshHandle = WorldMeshHandle;
    var WorldMeshGroup = (function () {
        function WorldMeshGroup(gl, components) {
            this.vertCount = 0;
            this.indexCount = 0;
            this.hasPositions = false;
            this.hasNormals = false;
            this.hasUvs = false;
            this.hasUv2s = false;
            this.id = WorldMeshGroup.nextId++;
            this.gl = gl;
            this.vertices = gl.createBuffer();
            this.indices = gl.createBuffer();
            this.components = components;
            this.vertexSize = 0;
            if ((components & SourceUtils.Api.MeshComponent.position) === SourceUtils.Api.MeshComponent.position) {
                this.hasPositions = true;
                this.positionOffset = this.vertexSize;
                this.vertexSize += 3;
            }
            if ((components & SourceUtils.Api.MeshComponent.normal) === SourceUtils.Api.MeshComponent.normal) {
                this.hasNormals = true;
                this.normalOffset = this.vertexSize;
                this.vertexSize += 3;
            }
            if ((components & SourceUtils.Api.MeshComponent.uv) === SourceUtils.Api.MeshComponent.uv) {
                this.hasUvs = true;
                this.uvOffset = this.vertexSize;
                this.vertexSize += 2;
            }
            if ((components & SourceUtils.Api.MeshComponent.uv2) === SourceUtils.Api.MeshComponent.uv2) {
                this.hasUv2s = true;
                this.uv2Offset = this.vertexSize;
                this.vertexSize += 2;
            }
            this.maxVertLength = this.vertexSize * 65536;
        }
        WorldMeshGroup.prototype.compareTo = function (other) {
            return this.id - other.id;
        };
        WorldMeshGroup.prototype.getId = function () { return this.id; };
        WorldMeshGroup.prototype.getVertexCount = function () {
            return this.vertCount / this.vertexSize;
        };
        WorldMeshGroup.prototype.getTriangleCount = function () {
            return this.indexCount / 3;
        };
        WorldMeshGroup.prototype.ensureCapacity = function (array, length, ctor) {
            if (array != null && array.length >= length)
                return array;
            var newLength = 2048;
            while (newLength < length)
                newLength *= 2;
            var newArray = ctor(newLength);
            if (array != null)
                newArray.set(array, 0);
            return newArray;
        };
        WorldMeshGroup.prototype.canAddFaces = function (faces) {
            return this.components === faces.components && this.vertCount + faces.vertices.length <= this.maxVertLength &&
                this.indexCount + faces.indices.length <= WorldMeshGroup.maxIndices;
        };
        WorldMeshGroup.prototype.updateBuffer = function (target, buffer, data, newData, oldData, offset) {
            var gl = this.gl;
            gl.bindBuffer(target, buffer);
            if (data !== oldData) {
                gl.bufferData(target, data.byteLength, gl.STATIC_DRAW);
                gl.bufferSubData(target, 0, data);
            }
            else {
                gl.bufferSubData(target, offset * data.BYTES_PER_ELEMENT, newData);
            }
        };
        WorldMeshGroup.prototype.getDrawMode = function (primitiveType) {
            switch (primitiveType) {
                case SourceUtils.Api.PrimitiveType.TriangleList:
                    return this.gl.TRIANGLES;
                case SourceUtils.Api.PrimitiveType.TriangleStrip:
                    return this.gl.TRIANGLE_STRIP;
                case SourceUtils.Api.PrimitiveType.TriangleFan:
                    return this.gl.TRIANGLE_FAN;
                default:
                    throw new Error("Unknown primitive type '" + primitiveType + "'.");
            }
        };
        WorldMeshGroup.prototype.addFaces = function (faces) {
            if (!this.canAddFaces(faces)) {
                throw new Error("Can't add faces to WorldMeshGroup (would exceed size limit).");
            }
            var gl = this.gl;
            var newVertices = faces.vertices;
            var newIndices = faces.indices;
            var vertexOffset = this.vertCount;
            var oldVertices = this.vertexData;
            this.vertexData = this.ensureCapacity(this.vertexData, this.vertCount + newVertices.length, function (size) { return new Float32Array(size); });
            var indexOffset = this.indexCount;
            var oldIndices = this.indexData;
            this.indexData = this.ensureCapacity(this.indexData, this.indexCount + newIndices.length, function (size) { return new Uint16Array(size); });
            this.vertexData.set(newVertices, vertexOffset);
            this.vertCount += newVertices.length;
            var elementOffset = Math.round(vertexOffset / this.vertexSize);
            for (var i = 0, iEnd = newIndices.length; i < iEnd; ++i) {
                newIndices[i] += elementOffset;
            }
            this.indexData.set(newIndices, indexOffset);
            this.indexCount += newIndices.length;
            this.updateBuffer(gl.ARRAY_BUFFER, this.vertices, this.vertexData, newVertices, oldVertices, vertexOffset);
            this.updateBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.indexData, newIndices, oldIndices, indexOffset);
            var handles = new Array(faces.elements.length);
            for (var i = 0; i < faces.elements.length; ++i) {
                var element = faces.elements[i];
                handles[i] = new WorldMeshHandle(this, this.getDrawMode(element.type), element.material, element.offset + indexOffset, element.count);
            }
            return handles;
        };
        WorldMeshGroup.prototype.prepareForRendering = function (program) {
            var gl = this.gl;
            var stride = this.vertexSize * 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            program.enableMeshComponents(this.components);
            // TODO: Clean up
            program.setVertexAttribPointer(SourceUtils.Api.MeshComponent.position, 3, gl.FLOAT, false, stride, this.positionOffset * 4);
            program.setVertexAttribPointer(SourceUtils.Api.MeshComponent.uv, 2, gl.FLOAT, false, stride, this.uvOffset * 4);
            program.setVertexAttribPointer(SourceUtils.Api.MeshComponent.uv2, 2, gl.FLOAT, false, stride, this.uv2Offset * 4);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
        };
        WorldMeshGroup.prototype.renderElements = function (drawMode, offset, count) {
            var gl = this.gl;
            gl.drawElements(drawMode, count, gl.UNSIGNED_SHORT, offset * 2);
        };
        WorldMeshGroup.prototype.dispose = function () {
            if (this.vertices !== undefined) {
                this.gl.deleteBuffer(this.vertices);
                this.vertices = undefined;
            }
            if (this.indices !== undefined) {
                this.gl.deleteBuffer(this.indices);
                this.indices = undefined;
            }
        };
        WorldMeshGroup.maxIndices = 2147483647;
        WorldMeshGroup.nextId = 1;
        return WorldMeshGroup;
    }());
    SourceUtils.WorldMeshGroup = WorldMeshGroup;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WorldMeshManager = (function () {
        function WorldMeshManager(gl) {
            this.groups = [];
            this.gl = gl;
        }
        WorldMeshManager.prototype.getVertexCount = function () {
            var total = 0;
            for (var i = 0; i < this.groups.length; ++i) {
                total += this.groups[i].getVertexCount();
            }
            return total;
        };
        WorldMeshManager.prototype.getTriangleCount = function () {
            var total = 0;
            for (var i = 0; i < this.groups.length; ++i) {
                total += this.groups[i].getTriangleCount();
            }
            return total;
        };
        WorldMeshManager.prototype.addFaces = function (faces) {
            for (var i = 0; i < this.groups.length; ++i) {
                if (this.groups[i].canAddFaces(faces))
                    return this.groups[i].addFaces(faces);
            }
            var newGroup = new SourceUtils.WorldMeshGroup(this.gl, faces.components);
            var result = newGroup.addFaces(faces);
            this.groups.push(newGroup);
            return result;
        };
        WorldMeshManager.prototype.dispose = function () {
            for (var i = 0; i < this.groups.length; ++i) {
                this.groups[i].dispose();
            }
            this.groups = [];
        };
        return WorldMeshManager;
    }());
    SourceUtils.WorldMeshManager = WorldMeshManager;
})(SourceUtils || (SourceUtils = {}));
