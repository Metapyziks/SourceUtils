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
        var Face = (function () {
            function Face() {
            }
            return Face;
        }());
        Api.Face = Face;
        var BspFacesResponse = (function () {
            function BspFacesResponse() {
            }
            return BspFacesResponse;
        }());
        Api.BspFacesResponse = BspFacesResponse;
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
/// <reference path="AppBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var VisNode = (function () {
        function VisNode(model, info) {
            this.isLeaf = false;
            var normal = info.plane.normal;
            var min = info.min;
            var max = info.max;
            this.plane = new THREE.Plane(new THREE.Vector3(normal.x, normal.y, normal.z), info.plane.dist);
            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
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
                return new VisLeaf(model, info);
            }
        };
        VisNode.prototype.getAllLeaves = function (dstArray) {
            this.children[0].getAllLeaves(dstArray);
            this.children[1].getAllLeaves(dstArray);
        };
        return VisNode;
    }());
    SourceUtils.VisNode = VisNode;
    var VisLeaf = (function (_super) {
        __extends(VisLeaf, _super);
        function VisLeaf(model, info) {
            _super.call(this, new THREE.BufferGeometry(), new THREE.MultiMaterial([new THREE.MeshPhongMaterial({ side: THREE.BackSide })]));
            this.isLeaf = true;
            this.loadedFaces = false;
            var min = info.min;
            var max = info.max;
            this.model = model;
            this.cluster = info.cluster === undefined ? -1 : info.cluster;
            this.numFaces = info.numFaces === undefined ? 0 : info.numFaces;
            this.firstFace = info.firstFace;
            this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
            this.visible = false;
        }
        VisLeaf.prototype.hasFaces = function () { return this.numFaces > 0; };
        VisLeaf.prototype.getAllLeaves = function (dstArray) {
            dstArray.push(this);
        };
        VisLeaf.prototype.loadFaces = function () {
            var _this = this;
            if (!this.hasFaces() || this.loadedFaces)
                return;
            var url = this.model.map.info.facesUrl
                .replace("{from}", this.firstFace.toString())
                .replace("{count}", this.numFaces.toString());
            var geom = this.geometry;
            $.getJSON(url, function (data) {
                // TODO
                _this.setDrawMode(THREE.TriangleFanDrawMode);
                geom.addAttribute("position", new THREE.BufferAttribute(SourceUtils.Utils.decompressFloat32Array(data.vertices), 3));
                geom.addAttribute("normal", new THREE.BufferAttribute(SourceUtils.Utils.decompressFloat32Array(data.normals), 3, true));
                geom.setIndex(new THREE.BufferAttribute(SourceUtils.Utils.decompressUint32Array(data.indices), 1));
                geom.clearGroups();
                for (var i = 0; i < data.faces.length; ++i) {
                    var face = data.faces[i];
                    geom.addGroup(face.offset, face.count);
                }
                _this.loadedFaces = true;
                _this.visible = true;
            });
        };
        return VisLeaf;
    }(THREE.Mesh));
    SourceUtils.VisLeaf = VisLeaf;
    var BspModel = (function (_super) {
        __extends(BspModel, _super);
        function BspModel(map, index) {
            _super.call(this);
            this.map = map;
            this.index = index;
            this.loadInfo(this.map.info.modelUrl.replace("{index}", "0"));
        }
        BspModel.prototype.loadInfo = function (url) {
            var _this = this;
            $.getJSON(url, function (data) {
                _this.info = data;
                _this.loadTree();
            });
        };
        BspModel.prototype.loadTree = function () {
            this.leaves = [];
            this.root = new VisNode(this, SourceUtils.Utils.decompress(this.info.tree));
            this.root.getAllLeaves(this.leaves);
            for (var i = 0; i < this.leaves.length; ++i) {
                if (this.leaves[i].hasFaces()) {
                    this.leaves[i].loadFaces();
                    this.add(this.leaves[i]);
                }
            }
        };
        return BspModel;
    }(SourceUtils.Entity));
    SourceUtils.BspModel = BspModel;
    var Map = (function (_super) {
        __extends(Map, _super);
        function Map(url) {
            _super.call(this);
            this.loadInfo(url);
        }
        Map.prototype.loadInfo = function (url) {
            var _this = this;
            $.getJSON(url, function (data) {
                _this.info = data;
                _this.models = new Array(data.numModels);
                _this.add(_this.models[0] = new BspModel(_this, 0));
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
            this.lookAngs = new THREE.Vector2();
            this.lookQuat = new THREE.Quaternion(0, 0, 0, 1);
            this.unitZ = new THREE.Vector3(0, 0, 1);
            this.unitX = new THREE.Vector3(1, 0, 0);
            this.tempQuat = new THREE.Quaternion();
            this.canLockPointer = true;
        }
        MapViewer.prototype.init = function (container) {
            this.camera = new THREE.PerspectiveCamera(60, container.innerWidth() / container.innerHeight(), 1, 4096);
            this.camera.up.set(0, 0, 1);
            _super.prototype.init.call(this, container);
            var ambient = new THREE.AmbientLight(0x7EABCF, 0.125);
            this.getScene().add(ambient);
            var directional = new THREE.DirectionalLight(0xFDF4D9);
            directional.position.set(3, -5, 7);
            this.getScene().add(directional);
        };
        MapViewer.prototype.loadMap = function (url) {
            if (this.map != null) {
                this.getScene().remove(this.map);
            }
            this.map = new SourceUtils.Map(url);
            this.getScene().add(this.map);
        };
        MapViewer.prototype.onMouseLook = function (delta) {
            _super.prototype.onMouseLook.call(this, delta);
            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            if (this.lookAngs.y < -Math.PI * 0.5)
                this.lookAngs.y = -Math.PI * 0.5;
            if (this.lookAngs.y > Math.PI * 0.5)
                this.lookAngs.y = Math.PI * 0.5;
            this.lookQuat.setFromAxisAngle(this.unitZ, this.lookAngs.x);
            this.tempQuat.setFromAxisAngle(this.unitX, this.lookAngs.y + Math.PI * 0.5);
            this.lookQuat.multiply(this.tempQuat);
            this.camera.rotation.setFromQuaternion(this.lookQuat);
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
            _super.apply(this, arguments);
            this.cameraAngle = 0;
            this.hullSize = new THREE.Vector3();
            this.hullCenter = new THREE.Vector3();
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
            var _loop_1 = function(i) {
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
                var _loop_2 = function(i) {
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
            var _loop_3 = function(i) {
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
