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
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return BspNode;
        }(BspElem));
        Api.BspNode = BspNode;
        var BspLeaf = (function (_super) {
            __extends(BspLeaf, _super);
            function BspLeaf() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return BspLeaf;
        }(BspElem));
        Api.BspLeaf = BspLeaf;
        var PrimitiveType;
        (function (PrimitiveType) {
            PrimitiveType[PrimitiveType["TriangleList"] = 0] = "TriangleList";
            PrimitiveType[PrimitiveType["TriangleStrip"] = 1] = "TriangleStrip";
            PrimitiveType[PrimitiveType["TriangleFan"] = 2] = "TriangleFan";
        })(PrimitiveType = Api.PrimitiveType || (Api.PrimitiveType = {}));
        var Element = (function () {
            function Element() {
            }
            return Element;
        }());
        Api.Element = Element;
        var MeshComponents;
        (function (MeshComponents) {
            MeshComponents[MeshComponents["position"] = 1] = "position";
            MeshComponents[MeshComponents["normal"] = 2] = "normal";
            MeshComponents[MeshComponents["uv"] = 4] = "uv";
        })(MeshComponents = Api.MeshComponents || (Api.MeshComponents = {}));
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
    var MouseButton;
    (function (MouseButton) {
        MouseButton[MouseButton["Left"] = 1] = "Left";
        MouseButton[MouseButton["Middle"] = 2] = "Middle";
        MouseButton[MouseButton["Right"] = 3] = "Right";
    })(MouseButton = SourceUtils.MouseButton || (SourceUtils.MouseButton = {}));
    var Key;
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
    })(Key = SourceUtils.Key || (SourceUtils.Key = {}));
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
            this.scene = new THREE.Scene();
            this.camera = this.camera || new THREE.OrthographicCamera(-1, 1, -1, 1, -1, 1);
            this.scene.add(this.camera);
            this.renderer = new THREE.WebGLRenderer();
            this.onWindowResize();
            this.animateCallback = function (time) {
                var deltaTime = time - _this.previousTime;
                _this.previousTime = time;
                _this.animate(deltaTime * 0.001);
            };
            this.container.append(this.renderer.domElement);
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
        AppBase.prototype.getCanvas = function () {
            return this.renderer.domElement;
        };
        AppBase.prototype.getWidth = function () {
            return this.container.innerWidth();
        };
        AppBase.prototype.getHeight = function () {
            return this.container.innerHeight();
        };
        AppBase.prototype.getScene = function () { return this.scene; };
        AppBase.prototype.getRenderer = function () { return this.renderer; };
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
            this.renderer.setSize(this.container.innerWidth(), this.container.innerHeight());
            this.onUpdateCamera();
        };
        AppBase.prototype.onUpdateCamera = function () { };
        AppBase.prototype.animate = function (dt) {
            dt = dt || 0;
            requestAnimationFrame(this.animateCallback);
            this.onUpdateFrame(dt);
            this.onRenderFrame(dt);
        };
        AppBase.prototype.onUpdateFrame = function (dt) {
        };
        AppBase.prototype.onRenderFrame = function (dt) {
            this.renderer.render(this.scene, this.camera);
        };
        return AppBase;
    }());
    SourceUtils.AppBase = AppBase;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var BspModel = (function (_super) {
        __extends(BspModel, _super);
        function BspModel(map, index) {
            var _this = _super.call(this, new THREE.BufferGeometry(), map.getLightmapMaterial()) || this;
            _this.frustumCulled = false;
            _this.map = map;
            _this.index = index;
            _this.drawList = new SourceUtils.DrawList(map);
            _this.loadInfo(_this.map.info.modelUrl.replace("{index}", index.toString()));
            _this.geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(1), 2));
            // Hack
            _this.onAfterRender = _this.onAfterRenderImpl;
            return _this;
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
        BspModel.prototype.onAfterRenderImpl = function (renderer, scene, camera, geom, mat, group) {
            var webGlRenderer = renderer;
            var gl = webGlRenderer.context;
            var props = webGlRenderer.properties;
            var matProps = props.get(this.material);
            var program = matProps.program;
            var attribs = program.getAttributes();
            gl.enableVertexAttribArray(attribs.position);
            if (attribs.normal !== undefined)
                gl.enableVertexAttribArray(attribs.normal);
            if (attribs.uv !== undefined)
                gl.enableVertexAttribArray(attribs.uv);
            this.drawList.render(attribs);
        };
        return BspModel;
    }(THREE.Mesh));
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
        return DrawListItem;
    }());
    DrawListItem.rootCenter = new THREE.Vector3();
    DrawListItem.thisCenter = new THREE.Vector3();
    SourceUtils.DrawListItem = DrawListItem;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="DrawListItem.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Displacement = (function (_super) {
        __extends(Displacement, _super);
        function Displacement(info) {
            var _this = _super.call(this, "d", info.index) || this;
            _this.clusters = info.clusters;
            var min = info.min;
            var max = info.max;
            _this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
            return _this;
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
        DrawList.prototype.renderHandle = function (handle, attribs) {
            if (this.lastGroup !== handle.group) {
                this.lastGroup = handle.group;
                this.lastGroup.prepareForRendering(attribs);
            }
            this.lastGroup.renderElements(handle.drawMode, handle.offset, handle.count);
        };
        DrawList.compareHandles = function (a, b) {
            var idComp = a.group.getId() - b.group.getId();
            return idComp !== 0 ? idComp : a.offset - b.offset;
        };
        DrawList.prototype.buildHandleList = function () {
            this.handles = [];
            var loader = this.map.faceLoader;
            for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                var handles = this.items[i].getMeshHandles(loader);
                if (handles == null)
                    continue;
                for (var j = 0, jEnd = handles.length; j < jEnd; ++j) {
                    if (handles[j].count === 0)
                        continue;
                    this.handles.push(handles[j]);
                }
            }
            this.handles.sort(DrawList.compareHandles);
            this.merged = [];
            var last = null;
            // Go through adding to this.merged
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
                last.offset = next.offset;
                last.count = next.count;
            }
            console.log("Draw calls: " + this.merged.length);
        };
        DrawList.prototype.render = function (attribs) {
            this.lastGroup = undefined;
            this.lastIndex = undefined;
            if (this.handles == null)
                this.buildHandleList();
            for (var i = 0, iEnd = this.merged.length; i < iEnd; ++i) {
                this.renderHandle(this.merged[i], attribs);
            }
        };
        return DrawList;
    }());
    SourceUtils.DrawList = DrawList;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="AppBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Entity = (function (_super) {
        __extends(Entity, _super);
        function Entity() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Entity;
    }(THREE.Object3D));
    SourceUtils.Entity = Entity;
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
        function Map(url, renderer) {
            var _this = _super.call(this) || this;
            _this.faceLoader = new SourceUtils.FaceLoader(_this);
            _this.models = [];
            _this.displacements = [];
            _this.pvs = [];
            _this.renderer = renderer;
            _this.frustumCulled = false;
            _this.meshManager = new SourceUtils.WorldMeshManager(renderer.context);
            _this.textureLoader = new THREE.TextureLoader();
            _this.lightmapMaterial = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
            _this.loadInfo(url);
            return _this;
        }
        Map.prototype.getLightmapMaterial = function () {
            return this.lightmapMaterial;
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
        Map.prototype.loadInfo = function (url) {
            var _this = this;
            $.getJSON(url, function (data) {
                _this.info = data;
                _this.models = new Array(data.numModels);
                _this.clusters = new Array(data.numClusters);
                _this.pvsArray = new Array(data.numClusters);
                _this.add(_this.models[0] = new SourceUtils.BspModel(_this, 0));
                _this.loadDisplacements();
                _this.loadLightmap();
            });
        };
        Map.prototype.loadDisplacements = function () {
            var _this = this;
            $.getJSON(this.info.displacementsUrl, function (data) {
                _this.displacements = [];
                for (var i = 0; i < data.displacements.length; ++i) {
                    _this.displacements.push(new SourceUtils.Displacement(data.displacements[i]));
                }
            });
        };
        Map.prototype.loadLightmap = function () {
            var _this = this;
            this.textureLoader.load(this.info.lightmapUrl, function (image) {
                _this.lightmapMaterial.map = image;
                _this.lightmapMaterial.needsUpdate = true;
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
        Map.prototype.updatePvs = function (position) {
            var worldSpawn = this.getWorldSpawn();
            if (worldSpawn == null)
                return;
            var root = worldSpawn.findLeaf(position);
            if (root === this.pvsRoot)
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
            var _this = _super.call(this) || this;
            _this.lookAngs = new THREE.Vector2();
            _this.lookQuat = new THREE.Quaternion(0, 0, 0, 1);
            _this.unitZ = new THREE.Vector3(0, 0, 1);
            _this.unitX = new THREE.Vector3(1, 0, 0);
            _this.tempQuat = new THREE.Quaternion();
            _this.canLockPointer = true;
            return _this;
        }
        MapViewer.prototype.init = function (container) {
            this.camera = new THREE.PerspectiveCamera(60, container.innerWidth() / container.innerHeight(), 1, 8192);
            this.camera.up.set(0, 0, 1);
            _super.prototype.init.call(this, container);
            this.updateCameraAngles();
        };
        MapViewer.prototype.loadMap = function (url) {
            if (this.map != null) {
                this.getScene().remove(this.map);
            }
            this.map = new SourceUtils.Map(url, this.getRenderer());
            this.getScene().add(this.map);
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
        return MapViewer;
    }(SourceUtils.AppBase));
    SourceUtils.MapViewer = MapViewer;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="AppBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Vector3Data = (function () {
        function Vector3Data() {
        }
        return Vector3Data;
    }());
    var MdlData = (function () {
        function MdlData() {
        }
        return MdlData;
    }());
    var PropertyType;
    (function (PropertyType) {
        PropertyType[PropertyType["Boolean"] = 0] = "Boolean";
        PropertyType[PropertyType["Number"] = 1] = "Number";
        PropertyType[PropertyType["Texture"] = 2] = "Texture";
    })(PropertyType || (PropertyType = {}));
    var MaterialPropertiesData = (function () {
        function MaterialPropertiesData() {
        }
        return MaterialPropertiesData;
    }());
    var ShaderData = (function () {
        function ShaderData() {
        }
        return ShaderData;
    }());
    var VmtData = (function () {
        function VmtData() {
        }
        return VmtData;
    }());
    var VvdData = (function () {
        function VvdData() {
        }
        return VvdData;
    }());
    var MeshData = (function () {
        function MeshData() {
        }
        return MeshData;
    }());
    var VtxData = (function () {
        function VtxData() {
        }
        return VtxData;
    }());
    var VtfData = (function () {
        function VtfData() {
        }
        return VtfData;
    }());
    var ModelViewer = (function (_super) {
        __extends(ModelViewer, _super);
        function ModelViewer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.cameraAngle = 0;
            _this.hullSize = new THREE.Vector3();
            _this.hullCenter = new THREE.Vector3();
            return _this;
        }
        ModelViewer.prototype.init = function (container) {
            this.texLoader = new THREE.TextureLoader();
            this.camera = new THREE.PerspectiveCamera(60, container.innerWidth() / container.innerHeight(), 1, 2048);
            this.camera.up = new THREE.Vector3(0, 0, 1);
            _super.prototype.init.call(this, container);
            var ambient = new THREE.AmbientLight(0x7EABCF, 0.125);
            this.getScene().add(ambient);
            this.directionalA = new THREE.DirectionalLight(0xFDF4D9);
            this.directionalA.position.set(3, -5, 7);
            this.getScene().add(this.directionalA);
            this.directionalB = new THREE.DirectionalLight(0x7EABCF, 0.25);
            this.directionalB.position.set(-4, 6, -1);
            this.getScene().add(this.directionalB);
        };
        ModelViewer.prototype.loadModel = function (url) {
            var _this = this;
            $.getJSON(url, function (mdl, status) { return _this.onLoadMdl(mdl, status); });
            if (this.mesh != null) {
                this.getScene().remove(this.mesh);
            }
            this.geometry = new THREE.BufferGeometry();
            this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0xff00ff }));
            this.getScene().add(this.mesh);
        };
        ModelViewer.prototype.onLoadMdl = function (mdl, status) {
            var _this = this;
            this.vvd = null;
            this.vtx = null;
            this.hullSize.set(mdl.hullMax.x - mdl.hullMin.x, mdl.hullMax.y - mdl.hullMin.y, mdl.hullMax.z - mdl.hullMin.z);
            this.hullCenter.set(mdl.hullMin.x + this.hullSize.x * 0.5, mdl.hullMin.y + this.hullSize.y * 0.5, mdl.hullMin.z + this.hullSize.z * 0.5);
            this.geometry.boundingBox = new THREE.Box3(mdl.hullMin, mdl.hullMax);
            var _loop_1 = function (i) {
                $.getJSON(mdl.materials[i], function (vmt, status) { return _this.onLoadVmt(i, vmt, status); });
            };
            for (var i = 0; i < mdl.materials.length; ++i) {
                _loop_1(i);
            }
            $.getJSON(mdl.vertices.replace("{lod}", "0"), function (vvd, status) { return _this.onLoadVvd(vvd, status); });
            $.getJSON(mdl.triangles.replace("{lod}", "0"), function (vtx, status) { return _this.onLoadVtx(vtx, status); });
        };
        ModelViewer.prototype.loadVtf = function (url, action) {
            var _this = this;
            $.getJSON(url, function (vtf, status) {
                var minMipMap = Math.max(vtf.mipmaps - 4, 0);
                var bestMipMap = vtf.mipmaps;
                var _loop_2 = function (i) {
                    _this.texLoader.load(vtf.png.replace("{mipmap}", i.toString()), function (tex) {
                        if (i >= bestMipMap)
                            return;
                        bestMipMap = i;
                        tex.wrapS = THREE.RepeatWrapping;
                        tex.wrapT = THREE.RepeatWrapping;
                        action(tex);
                    });
                };
                for (var i = minMipMap; i >= 0; --i) {
                    _loop_2(i);
                }
            });
        };
        ModelViewer.prototype.onLoadVmt = function (index, vmt, status) {
            var shader = vmt.shaders[0];
            if (shader == null)
                return;
            var mat = new THREE[shader.material]();
            var _loop_3 = function (i) {
                var prop = shader.properties[i];
                switch (prop.type) {
                    case PropertyType.Texture:
                        this_1.loadVtf(prop.value, function (tex) {
                            mat[prop.name] = tex;
                            mat.needsUpdate = true;
                        });
                        break;
                    default:
                        mat[prop.name] = prop.value;
                        break;
                }
            };
            var this_1 = this;
            for (var i = 0; i < shader.properties.length; ++i) {
                _loop_3(i);
            }
            var hasMultiMat = this.mesh.material.materials != null;
            if (!hasMultiMat) {
                if (index === 0) {
                    this.mesh.material = mat;
                    return;
                }
                else {
                    var oldMat = this.mesh.material;
                    this.mesh.material = new THREE.MultiMaterial([oldMat]);
                }
            }
            var multiMat = this.mesh.material;
            multiMat.materials[index] = mat;
            multiMat.needsUpdate = true;
        };
        ModelViewer.prototype.onLoadVvd = function (vvd, status) {
            this.vvd = vvd;
            if (this.vtx != null)
                this.updateModel();
        };
        ModelViewer.prototype.onLoadVtx = function (vtx, status) {
            this.vtx = vtx;
            if (this.vvd != null)
                this.updateModel();
        };
        ModelViewer.prototype.updateModel = function () {
            if (this.vvd.vertices != null)
                this.geometry.addAttribute("position", new THREE.BufferAttribute(SourceUtils.Utils.decompressFloat32Array(this.vvd.vertices), 3));
            if (this.vvd.normals != null)
                this.geometry.addAttribute("normal", new THREE.BufferAttribute(SourceUtils.Utils.decompressFloat32Array(this.vvd.normals), 3, true));
            if (this.vvd.texcoords != null)
                this.geometry.addAttribute("uv", new THREE.BufferAttribute(SourceUtils.Utils.decompressFloat32Array(this.vvd.texcoords), 2));
            if (this.vvd.tangents != null)
                this.geometry.addAttribute("tangent", new THREE.BufferAttribute(SourceUtils.Utils.decompressFloat32Array(this.vvd.tangents), 4));
            this.geometry.setIndex(new THREE.BufferAttribute(SourceUtils.Utils.decompressUint32Array(this.vtx.indices), 1));
            for (var i = 0; i < this.vtx.meshes.length; ++i) {
                var mesh = this.vtx.meshes[i];
                this.geometry.addGroup(mesh.start, mesh.length, mesh.materialIndex);
            }
        };
        ModelViewer.prototype.onRenderFrame = function (dt) {
            this.cameraAngle += dt * 0.25;
            var radius = this.hullSize.length();
            this.camera.position.set(Math.cos(this.cameraAngle) * radius, Math.sin(this.cameraAngle) * radius, 0.5 * radius);
            this.directionalA.position.set(Math.cos(this.cameraAngle * 2.67), Math.sin(this.cameraAngle * 2.67), 0.75);
            this.directionalB.position.set(Math.cos(this.cameraAngle * 2.67 + 2.8), Math.sin(this.cameraAngle * 2.67 + 2.8), -0.5);
            this.camera.position.add(this.hullCenter);
            this.camera.lookAt(this.hullCenter);
            _super.prototype.onRenderFrame.call(this, dt);
        };
        return ModelViewer;
    }(SourceUtils.AppBase));
    SourceUtils.ModelViewer = ModelViewer;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var VisLeaf = (function (_super) {
        __extends(VisLeaf, _super);
        function VisLeaf(info) {
            var _this = _super.call(this, "l", info.index) || this;
            _this.isLeaf = true;
            var min = info.min;
            var max = info.max;
            _this.leafIndex = info.index;
            _this.cluster = info.cluster === undefined ? -1 : info.cluster;
            _this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
            return _this;
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
        function WorldMeshHandle(group, drawMode, offset, count) {
            this.group = group;
            this.drawMode = drawMode;
            this.offset = offset;
            this.count = count;
        }
        WorldMeshHandle.prototype.canMerge = function (other) {
            return this.group === other.group
                && this.drawMode === other.drawMode
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
            this.id = WorldMeshGroup.nextId++;
            this.gl = gl;
            this.vertices = gl.createBuffer();
            this.indices = gl.createBuffer();
            this.components = components;
            this.vertexSize = 0;
            if ((components & SourceUtils.Api.MeshComponents.position) === SourceUtils.Api.MeshComponents.position) {
                this.hasPositions = true;
                this.positionOffset = this.vertexSize;
                this.vertexSize += 3;
            }
            if ((components & SourceUtils.Api.MeshComponents.normal) === SourceUtils.Api.MeshComponents.normal) {
                this.hasNormals = true;
                this.normalOffset = this.vertexSize;
                this.vertexSize += 3;
            }
            if ((components & SourceUtils.Api.MeshComponents.uv) === SourceUtils.Api.MeshComponents.uv) {
                this.hasUvs = true;
                this.uvOffset = this.vertexSize;
                this.vertexSize += 2;
            }
            this.maxVertLength = this.vertexSize * 65536;
        }
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
                handles[i] = new WorldMeshHandle(this, this.getDrawMode(element.type), element.offset + indexOffset, element.count);
            }
            return handles;
        };
        WorldMeshGroup.prototype.prepareForRendering = function (attribs) {
            var gl = this.gl;
            var stride = this.vertexSize * 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            if (this.hasPositions && attribs.position !== undefined)
                gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, stride, this.positionOffset * 4);
            if (this.hasNormals && attribs.normal !== undefined)
                gl.vertexAttribPointer(attribs.normal, 3, gl.FLOAT, true, stride, this.normalOffset * 4);
            if (this.hasUvs && attribs.uv !== undefined)
                gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, stride, this.uvOffset * 4);
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
        return WorldMeshGroup;
    }());
    WorldMeshGroup.maxIndices = 2147483647;
    WorldMeshGroup.nextId = 1;
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
