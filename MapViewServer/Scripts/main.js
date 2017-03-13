var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SourceUtils;
(function (SourceUtils) {
    var Api;
    (function (Api) {
        var LeafFlags;
        (function (LeafFlags) {
            LeafFlags[LeafFlags["Sky"] = 1] = "Sky";
            LeafFlags[LeafFlags["Radial"] = 2] = "Radial";
            LeafFlags[LeafFlags["Sky2D"] = 4] = "Sky2D";
        })(LeafFlags = Api.LeafFlags || (Api.LeafFlags = {}));
        var PrimitiveType;
        (function (PrimitiveType) {
            PrimitiveType[PrimitiveType["TriangleList"] = 0] = "TriangleList";
            PrimitiveType[PrimitiveType["TriangleStrip"] = 1] = "TriangleStrip";
            PrimitiveType[PrimitiveType["TriangleFan"] = 2] = "TriangleFan";
        })(PrimitiveType = Api.PrimitiveType || (Api.PrimitiveType = {}));
        var MeshComponent;
        (function (MeshComponent) {
            MeshComponent[MeshComponent["Position"] = 1] = "Position";
            MeshComponent[MeshComponent["Normal"] = 2] = "Normal";
            MeshComponent[MeshComponent["Uv"] = 4] = "Uv";
            MeshComponent[MeshComponent["Uv2"] = 8] = "Uv2";
            MeshComponent[MeshComponent["Alpha"] = 16] = "Alpha";
            MeshComponent[MeshComponent["Rgb"] = 32] = "Rgb";
        })(MeshComponent = Api.MeshComponent || (Api.MeshComponent = {}));
        var MaterialPropertyType;
        (function (MaterialPropertyType) {
            MaterialPropertyType[MaterialPropertyType["boolean"] = 0] = "boolean";
            MaterialPropertyType[MaterialPropertyType["number"] = 1] = "number";
            MaterialPropertyType[MaterialPropertyType["texture2D"] = 2] = "texture2D";
            MaterialPropertyType[MaterialPropertyType["textureCube"] = 3] = "textureCube";
        })(MaterialPropertyType = Api.MaterialPropertyType || (Api.MaterialPropertyType = {}));
        var StaticPropFlags;
        (function (StaticPropFlags) {
            StaticPropFlags[StaticPropFlags["Fades"] = 1] = "Fades";
            StaticPropFlags[StaticPropFlags["UseLightingOrigin"] = 2] = "UseLightingOrigin";
            StaticPropFlags[StaticPropFlags["NoDraw"] = 4] = "NoDraw";
            StaticPropFlags[StaticPropFlags["IgnoreNormals"] = 8] = "IgnoreNormals";
            StaticPropFlags[StaticPropFlags["NoShadow"] = 16] = "NoShadow";
            StaticPropFlags[StaticPropFlags["Unused"] = 32] = "Unused";
            StaticPropFlags[StaticPropFlags["NoPerVertexLighting"] = 64] = "NoPerVertexLighting";
            StaticPropFlags[StaticPropFlags["NoSelfShadowing"] = 128] = "NoSelfShadowing";
        })(StaticPropFlags = Api.StaticPropFlags || (Api.StaticPropFlags = {}));
        var VtfFlags;
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
        })(VtfFlags = Api.VtfFlags || (Api.VtfFlags = {}));
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
            if (value == null)
                return null;
            return typeof value === "string"
                ? JSON.parse(LZString.decompressFromBase64(value))
                : value;
        };
        Utils.decompressOrClone = function (value) {
            if (value == null)
                return null;
            return typeof value === "string"
                ? JSON.parse(LZString.decompressFromBase64(value))
                : value.slice(0);
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
            this.doubleClickPeriod = 0.3;
            this.previousTime = 0;
            this.lastClickTime = 0;
            this.mouseScreenPos = new THREE.Vector2();
            this.mouseLookDelta = new THREE.Vector2();
            this.dragStartScreenPos = new THREE.Vector2();
            this.heldKeys = new Array(128);
            this.heldMouseButtons = new Array(8);
        }
        AppBase.prototype.init = function (container) {
            var _this = this;
            this.container = container;
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
            var deltaAngles = new THREE.Vector3();
            var lastRotationSampleTime = new Date().getTime() / 1000;
            var deviceRotate = function (x, y, z, period, toRadians) {
                x *= toRadians / period;
                y *= toRadians / period;
                z *= toRadians / period;
                var sampleTime = new Date().getTime() / 1000;
                var deltaTime = sampleTime - lastRotationSampleTime;
                lastRotationSampleTime = sampleTime;
                deltaAngles.x = x * deltaTime;
                deltaAngles.y = y * deltaTime;
                deltaAngles.z = z * deltaTime;
                _this.onDeviceRotate(deltaAngles);
            };
            var wind = window;
            if (wind.DeviceMotionEvent) {
                window.addEventListener("devicemotion", function (evnt) {
                    var rate = evnt.rotationRate;
                    deviceRotate(rate.beta, rate.gamma, rate.alpha, 1.0, 1.0);
                }, true);
            }
            this.container.contextmenu(function () { return false; });
            window.addEventListener("resize", function () { return _this.onWindowResize(); }, false);
        };
        AppBase.prototype.getLastUpdateTime = function () {
            return this.previousTime * 0.001;
        };
        AppBase.prototype.onDeviceRotate = function (delta) { };
        AppBase.prototype.isPointerLocked = function () {
            return document.pointerLockElement === this.container[0];
        };
        AppBase.prototype.toggleFullscreen = function () {
            var container = this.getContainer();
            var cont = container;
            var doc = document;
            if (document.fullscreenElement === container || document.webkitFullscreenElement === container || doc.mozFullScreenElement === container) {
                if (document.exitFullscreen)
                    document.exitFullscreen();
                else if (document.webkitExitFullscreen)
                    document.webkitExitFullscreen();
                else if (doc.mozCancelFullScreen)
                    doc.mozCancelFullScreen();
            }
            else if (container.requestFullscreen) {
                container.requestFullscreen();
            }
            else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
            else if (cont.mozRequestFullScreen) {
                cont.mozRequestFullScreen();
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
                var time = new Date().getTime() / 1000;
                var sinceLast = time - this.lastClickTime;
                this.lastClickTime = time;
                if (sinceLast < this.doubleClickPeriod) {
                    this.onDoubleClick(button, screenPos);
                }
            }
        };
        AppBase.prototype.onDoubleClick = function (button, screenPos) { };
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
            this.onUpdateFrame(dt);
            this.onRenderFrame(dt);
            requestAnimationFrame(this.animateCallback);
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
    var Entity = (function () {
        function Entity() {
            this.position = new THREE.Vector3();
            this.rotation = new THREE.Quaternion(0, 0, 0, 1);
            this.scale = new THREE.Vector3(1, 1, 1);
            this.matrix = new THREE.Matrix4();
            this.matrixInvalid = true;
            this.inverseMatrix = new THREE.Matrix4();
            this.inverseMatrixInvalid = true;
            this.sortIndex = Entity.nextSortIndex++;
        }
        Entity.prototype.compareTo = function (other) {
            if (other == null)
                return 1;
            return this.sortIndex - other.sortIndex;
        };
        Entity.prototype.invalidateMatrices = function () {
            this.matrixInvalid = true;
            this.inverseMatrixInvalid = true;
        };
        Entity.prototype.getMatrix = function (target) {
            if (this.matrixInvalid) {
                this.matrixInvalid = false;
                this.matrix.compose(this.position, this.rotation, this.scale);
            }
            if (target != null)
                target.copy(this.matrix);
        };
        Entity.prototype.getMatrixElements = function () {
            this.getMatrix();
            return this.matrix.elements;
        };
        Entity.prototype.getInverseMatrix = function (target) {
            if (this.inverseMatrixInvalid) {
                this.inverseMatrixInvalid = false;
                this.getMatrix();
                this.inverseMatrix.getInverse(this.matrix);
            }
            if (target != null)
                target.copy(this.inverseMatrix);
        };
        Entity.prototype.setPosition = function (valueOrX, y, z) {
            if (y !== undefined) {
                var x = valueOrX;
                this.position.set(x, y, z);
            }
            else {
                var value = valueOrX;
                this.position.set(value.x, value.y, value.z);
            }
            this.invalidateMatrices();
        };
        Entity.prototype.getPosition = function (target) {
            target.x = this.position.x;
            target.y = this.position.y;
            target.z = this.position.z;
        };
        Entity.prototype.translate = function (valueOrX, y, z) {
            if (typeof valueOrX === "number") {
                this.position.x += valueOrX;
                this.position.y += y;
                this.position.z += z;
            }
            else {
                this.position.add(valueOrX);
            }
            this.invalidateMatrices();
        };
        Entity.prototype.setRotation = function (value) {
            this.rotation.copy(value);
            this.invalidateMatrices();
        };
        Entity.prototype.setAngles = function (valueOrPitch, yaw, roll) {
            var pitch;
            if (typeof valueOrPitch === "number") {
                pitch = valueOrPitch;
            }
            else {
                pitch = valueOrPitch.x;
                yaw = valueOrPitch.y;
                roll = valueOrPitch.z;
            }
            Entity.tempEuler.x = roll * Math.PI / 180;
            Entity.tempEuler.y = pitch * Math.PI / 180;
            Entity.tempEuler.z = yaw * Math.PI / 180;
            this.rotation.setFromEuler(Entity.tempEuler, true);
        };
        Entity.prototype.copyRotation = function (other) {
            this.setRotation(other.rotation);
        };
        Entity.prototype.applyRotationTo = function (vector) {
            vector.applyQuaternion(this.rotation);
        };
        Entity.prototype.setScale = function (value) {
            if (typeof value === "number") {
                this.scale.set(value, value, value);
            }
            else {
                this.scale.set(value.x, value.y, value.z);
            }
            this.invalidateMatrices();
        };
        return Entity;
    }());
    Entity.nextSortIndex = 0;
    Entity.tempEuler = new THREE.Euler(0, 0, 0, "ZYX");
    SourceUtils.Entity = Entity;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="Entity.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var BspModel = (function (_super) {
        __extends(BspModel, _super);
        function BspModel(map, info) {
            var _this = _super.call(this) || this;
            _this.map = map;
            _this.index = info.model;
            _this.clusters = info.clusters;
            _this.setPosition(info.origin);
            _this.loadInfo(_this.map.info.modelUrl.replace("{index}", _this.index.toString()));
            return _this;
        }
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
            return elem.isLeaf ? elem : null;
        };
        return BspModel;
    }(SourceUtils.Entity));
    SourceUtils.BspModel = BspModel;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var Camera = (function (_super) {
        __extends(Camera, _super);
        function Camera() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.projectionInvalid = true;
            _this.projectionMatrix = new THREE.Matrix4();
            return _this;
        }
        Camera.prototype.getProjectionMatrix = function (target) {
            if (this.projectionInvalid) {
                this.projectionInvalid = false;
                this.onUpdateProjectionMatrix(this.projectionMatrix);
            }
            target.copy(this.projectionMatrix);
        };
        Camera.prototype.invalidateProjectionMatrix = function () {
            this.projectionInvalid = true;
        };
        Camera.prototype.onUpdateProjectionMatrix = function (matrix) {
            throw "Method 'onUpdateProjectionMatrix' not implemented.";
        };
        return Camera;
    }(SourceUtils.Entity));
    SourceUtils.Camera = Camera;
    var PerspectiveCamera = (function (_super) {
        __extends(PerspectiveCamera, _super);
        function PerspectiveCamera(fov, aspect, near, far) {
            var _this = _super.call(this) || this;
            _this.fov = fov;
            _this.aspect = aspect;
            _this.near = near;
            _this.far = far;
            return _this;
        }
        PerspectiveCamera.prototype.setFov = function (value) { this.fov = value; this.invalidateProjectionMatrix(); };
        PerspectiveCamera.prototype.getFov = function () { return this.fov; };
        PerspectiveCamera.prototype.setAspect = function (value) { this.aspect = value; this.invalidateProjectionMatrix(); };
        PerspectiveCamera.prototype.getAspect = function () { return this.aspect; };
        PerspectiveCamera.prototype.setNear = function (value) { this.near = value; this.invalidateProjectionMatrix(); };
        PerspectiveCamera.prototype.getNear = function () { return this.near; };
        PerspectiveCamera.prototype.setFar = function (value) { this.far = value; this.invalidateProjectionMatrix(); };
        PerspectiveCamera.prototype.getFar = function () { return this.far; };
        PerspectiveCamera.prototype.onUpdateProjectionMatrix = function (matrix) {
            var near = this.near, top = near * Math.tan(THREE.Math.DEG2RAD * 0.5 * this.fov), height = 2 * top, width = this.aspect * height, left = -0.5 * width;
            matrix.makePerspective(left, left + width, top, top - height, near, this.far);
        };
        return PerspectiveCamera;
    }(Camera));
    SourceUtils.PerspectiveCamera = PerspectiveCamera;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var Texture = (function () {
        function Texture(gl, target) {
            this.highestLevel = Number.MIN_VALUE;
            this.lowestLevel = Number.MAX_VALUE;
            this.allowAnisotropicFiltering = true;
            this.sortIndex = Texture.nextSortIndex++;
            this.context = gl;
            this.target = target;
            this.wrapS = gl.REPEAT;
            this.wrapT = gl.REPEAT;
            this.minFilter = gl.LINEAR;
            this.magFilter = gl.LINEAR;
        }
        Texture.prototype.compareTo = function (other) {
            return this.sortIndex - other.sortIndex;
        };
        Texture.prototype.getTarget = function () {
            return this.target;
        };
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
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, this.wrapT);
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, this.magFilter);
            if (this.allowAnisotropicFiltering && this.minFilter !== gl.NEAREST) {
                var anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
                if (anisoExt != null) {
                    gl.texParameterf(target, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, 4);
                }
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
                else {
                    this.width = image.width;
                    this.height = image.height;
                }
            }
            if (callBack != null)
                callBack();
        };
        Texture.prototype.loadPixels = function (width, height, values, target) {
            var gl = this.context;
            this.getOrCreateHandle();
            this.width = width;
            this.height = height;
            if (target === undefined) {
                target = this.target;
            }
            gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
        };
        Texture.prototype.dispose = function () {
            if (this.handle !== undefined) {
                this.context.deleteTexture(this.handle);
                this.handle = undefined;
            }
        };
        return Texture;
    }());
    Texture.nextSortIndex = 0;
    SourceUtils.Texture = Texture;
    var RenderTexture = (function (_super) {
        __extends(RenderTexture, _super);
        function RenderTexture(gl, width, height, format, type) {
            var _this = _super.call(this, gl, gl.TEXTURE_2D) || this;
            _this.format = format;
            _this.type = type;
            _this.wrapS = gl.CLAMP_TO_EDGE;
            _this.wrapT = gl.CLAMP_TO_EDGE;
            _this.minFilter = gl.NEAREST;
            _this.magFilter = gl.NEAREST;
            _this.allowAnisotropicFiltering = false;
            _this.resize(width, height);
            return _this;
        }
        RenderTexture.prototype.resize = function (width, height) {
            if (this.width === width && this.height === height)
                return;
            var gl = this.getContext();
            this.width = width;
            this.height = height;
            this.getOrCreateHandle();
            gl.texImage2D(this.getTarget(), 0, this.format, this.width, this.height, 0, this.format, this.type, null);
            gl.bindTexture(this.getTarget(), null);
        };
        return RenderTexture;
    }(Texture));
    SourceUtils.RenderTexture = RenderTexture;
    var Lightmap = (function (_super) {
        __extends(Lightmap, _super);
        function Lightmap(gl, url) {
            var _this = _super.call(this, gl, gl.TEXTURE_2D) || this;
            _this.minFilter = gl.NEAREST;
            _this.magFilter = gl.NEAREST;
            _this.loadLevel(url, 0);
            return _this;
        }
        return Lightmap;
    }(Texture));
    SourceUtils.Lightmap = Lightmap;
    var BlankTexture2D = (function (_super) {
        __extends(BlankTexture2D, _super);
        function BlankTexture2D(gl, r, g, b, a) {
            var _this = _super.call(this, gl, gl.TEXTURE_2D) || this;
            if (a === undefined)
                a = 1.0;
            _this.loadPixels(1, 1, new Uint8Array([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255)]));
            return _this;
        }
        return BlankTexture2D;
    }(Texture));
    SourceUtils.BlankTexture2D = BlankTexture2D;
    var BlankTextureCube = (function (_super) {
        __extends(BlankTextureCube, _super);
        function BlankTextureCube(gl, r, g, b, a) {
            var _this = _super.call(this, gl, gl.TEXTURE_CUBE_MAP) || this;
            var pixels = new Uint8Array([
                Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), Math.round(a * 255)
            ]);
            _this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
            _this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
            _this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
            _this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_POSITIVE_X);
            _this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
            _this.loadPixels(1, 1, pixels, gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
            return _this;
        }
        return BlankTextureCube;
    }(Texture));
    SourceUtils.BlankTextureCube = BlankTextureCube;
    var ErrorTexture2D = (function (_super) {
        __extends(ErrorTexture2D, _super);
        function ErrorTexture2D(gl) {
            var _this = _super.call(this, gl, gl.TEXTURE_2D) || this;
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
            _this.loadPixels(resolution, resolution, pixels);
            return _this;
        }
        return ErrorTexture2D;
    }(Texture));
    SourceUtils.ErrorTexture2D = ErrorTexture2D;
    var ValveTexture = (function (_super) {
        __extends(ValveTexture, _super);
        function ValveTexture(gl, target) {
            var _this = _super.call(this, gl, target) || this;
            _this.usesSinceLastLoad = 0;
            _this.wasLoaded = false;
            return _this;
        }
        ValveTexture.prototype.shouldLoadBefore = function (other) {
            if (this.usesSinceLastLoad === 0)
                return false;
            if (other == null)
                return true;
            var mipCompare = this.getLowestMipLevel() - other.getLowestMipLevel();
            if (mipCompare !== 0)
                return mipCompare > 0;
            var scoreCompare = this.usesSinceLastLoad - other.getUsesSinceLastLoad();
            return scoreCompare > 0;
        };
        ValveTexture.prototype.onGetHandle = function () {
            ++this.usesSinceLastLoad;
        };
        ValveTexture.prototype.firstTimeLoaded = function () {
            if (this.wasLoaded || !this.isLoaded())
                return false;
            this.wasLoaded = true;
            return true;
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
            var _this = _super.call(this, gl, gl.TEXTURE_2D) || this;
            _this.vtfUrl = url;
            return _this;
        }
        ValveTexture2D.prototype.loadNext = function (callback) {
            var _this = this;
            _super.prototype.loadNext.call(this, null);
            if (this.info == null) {
                this.loadInfo(function () { return callback(_this.info != null); });
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
                this.getHighestMipLevel() === this.info.mipmaps - 1) {
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
            var _this = _super.call(this, gl, gl.TEXTURE_CUBE_MAP) || this;
            _this.infos = [];
            _this.loadedInfo = false;
            _this.nextFace = 0;
            _this.vtfUrls = urls;
            return _this;
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
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, this.magFilter);
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
/// <reference path="Texture.ts"/>>
var SourceUtils;
(function (SourceUtils) {
    var CommandBufferParameter;
    (function (CommandBufferParameter) {
        CommandBufferParameter[CommandBufferParameter["ProjectionMatrix"] = 0] = "ProjectionMatrix";
        CommandBufferParameter[CommandBufferParameter["InverseProjectionMatrix"] = 1] = "InverseProjectionMatrix";
        CommandBufferParameter[CommandBufferParameter["ViewMatrix"] = 2] = "ViewMatrix";
        CommandBufferParameter[CommandBufferParameter["InverseViewMatrix"] = 3] = "InverseViewMatrix";
        CommandBufferParameter[CommandBufferParameter["CameraPos"] = 4] = "CameraPos";
        CommandBufferParameter[CommandBufferParameter["ScreenParams"] = 5] = "ScreenParams";
        CommandBufferParameter[CommandBufferParameter["ClipParams"] = 6] = "ClipParams";
        CommandBufferParameter[CommandBufferParameter["TimeParams"] = 7] = "TimeParams";
        CommandBufferParameter[CommandBufferParameter["RefractColorMap"] = 8] = "RefractColorMap";
        CommandBufferParameter[CommandBufferParameter["RefractDepthMap"] = 9] = "RefractDepthMap";
    })(CommandBufferParameter = SourceUtils.CommandBufferParameter || (SourceUtils.CommandBufferParameter = {}));
    var CommandBuffer = (function () {
        function CommandBuffer(context) {
            this.parameters = {};
            this.cameraPos = new Float32Array(3);
            this.timeParams = new Float32Array(4);
            this.screenParams = new Float32Array(4);
            this.clipParams = new Float32Array(4);
            this.context = context;
            this.clearCommands();
        }
        CommandBuffer.prototype.clearCommands = function () {
            this.boundTextures = {};
            this.boundBuffers = {};
            this.capStates = {};
            this.commands = [];
            this.lastCommand = null;
        };
        CommandBuffer.prototype.setParameter = function (param, value) {
            this.parameters[param] = value;
        };
        CommandBuffer.prototype.run = function (renderContext) {
            var gl = this.context;
            this.app = renderContext.getMap().getApp();
            this.cameraPos[0] = renderContext.origin.x;
            this.cameraPos[1] = renderContext.origin.y;
            this.cameraPos[2] = renderContext.origin.z;
            this.timeParams[0] = renderContext.time;
            this.screenParams[0] = this.app.getWidth();
            this.screenParams[1] = this.app.getHeight();
            this.screenParams[2] = 1 / this.app.getWidth();
            this.screenParams[3] = 1 / this.app.getHeight();
            this.clipParams[0] = renderContext.near;
            this.clipParams[1] = renderContext.far;
            this.clipParams[2] = 1 / (renderContext.far - renderContext.near);
            this.setParameter(CommandBufferParameter.InverseProjectionMatrix, renderContext.getInverseProjectionMatrix());
            this.setParameter(CommandBufferParameter.ProjectionMatrix, renderContext.getProjectionMatrix());
            this.setParameter(CommandBufferParameter.ViewMatrix, renderContext.getViewMatrix());
            this.setParameter(CommandBufferParameter.InverseViewMatrix, renderContext.getInverseViewMatrix());
            this.setParameter(CommandBufferParameter.CameraPos, this.cameraPos);
            this.setParameter(CommandBufferParameter.TimeParams, this.timeParams);
            this.setParameter(CommandBufferParameter.ScreenParams, this.screenParams);
            this.setParameter(CommandBufferParameter.ClipParams, this.clipParams);
            var colorTexture = renderContext.getOpaqueColorTexture();
            var depthTexture = renderContext.getOpaqueDepthTexture();
            this.setParameter(CommandBufferParameter.RefractColorMap, colorTexture);
            this.setParameter(CommandBufferParameter.RefractDepthMap, depthTexture);
            for (var i = 0, iEnd = this.commands.length; i < iEnd; ++i) {
                var command = this.commands[i];
                command.action(gl, command);
            }
        };
        CommandBuffer.prototype.push = function (action, args) {
            args.action = action;
            this.commands.push(args);
            this.lastCommand = args;
        };
        CommandBuffer.prototype.clear = function (mask) {
            this.push(this.onClear, { mask: mask });
        };
        CommandBuffer.prototype.onClear = function (gl, args) {
            gl.clear(args.mask);
        };
        CommandBuffer.prototype.setCap = function (cap, enabled) {
            if (this.capStates[cap] === enabled)
                return;
            this.capStates[cap] = enabled;
            this.push(enabled ? this.onEnable : this.onDisable, { cap: cap });
        };
        CommandBuffer.prototype.enable = function (cap) {
            this.setCap(cap, true);
        };
        CommandBuffer.prototype.onEnable = function (gl, args) {
            gl.enable(args.cap);
        };
        CommandBuffer.prototype.disable = function (cap) {
            this.setCap(cap, false);
        };
        CommandBuffer.prototype.onDisable = function (gl, args) {
            gl.disable(args.cap);
        };
        CommandBuffer.prototype.depthMask = function (flag) {
            this.push(this.onDepthMask, { enabled: flag });
        };
        CommandBuffer.prototype.onDepthMask = function (gl, args) {
            gl.depthMask(args.enabled);
        };
        CommandBuffer.prototype.blendFuncSeparate = function (srcRgb, dstRgb, srcAlpha, dstAlpha) {
            this.push(this.onBlendFuncSeparate, { x: srcRgb, y: dstRgb, z: srcAlpha, w: dstAlpha });
        };
        CommandBuffer.prototype.onBlendFuncSeparate = function (gl, args) {
            gl.blendFuncSeparate(args.x, args.y, args.z, args.w);
        };
        CommandBuffer.prototype.useProgram = function (program) {
            this.push(this.onUseProgram, { program: program.getProgram() });
        };
        CommandBuffer.prototype.onUseProgram = function (gl, args) {
            gl.useProgram(args.program);
        };
        CommandBuffer.prototype.setUniformParameter = function (uniform, parameter) {
            if (uniform == null)
                return;
            var loc = uniform.getLocation();
            if (loc == null)
                return;
            var args = { uniform: loc, parameters: this.parameters, parameter: parameter };
            if (uniform.isSampler) {
                var sampler = uniform;
                this.setUniform1I(loc, sampler.getTexUnit());
                args.unit = sampler.getTexUnit();
            }
            this.push(this.onSetUniformParameter, args);
        };
        CommandBuffer.prototype.onSetUniformParameter = function (gl, args) {
            var value = args.parameters[args.parameter];
            if (value === undefined)
                return;
            switch (args.parameter) {
                case CommandBufferParameter.ProjectionMatrix:
                case CommandBufferParameter.InverseProjectionMatrix:
                case CommandBufferParameter.ViewMatrix:
                case CommandBufferParameter.InverseViewMatrix:
                    gl.uniformMatrix4fv(args.uniform, false, value);
                    break;
                case CommandBufferParameter.CameraPos:
                    gl.uniform3f(args.uniform, value[0], value[1], value[2]);
                    break;
                case CommandBufferParameter.TimeParams:
                case CommandBufferParameter.ScreenParams:
                case CommandBufferParameter.ClipParams:
                    gl.uniform4f(args.uniform, value[0], value[1], value[2], value[3]);
                    break;
                case CommandBufferParameter.RefractColorMap:
                case CommandBufferParameter.RefractDepthMap:
                    var tex = value;
                    gl.activeTexture(gl.TEXTURE0 + args.unit);
                    gl.bindTexture(tex.getTarget(), tex.getHandle());
                    break;
            }
        };
        CommandBuffer.prototype.setUniform1F = function (uniform, x) {
            if (uniform == null)
                return;
            this.push(this.onSetUniform1F, { uniform: uniform, x: x });
        };
        CommandBuffer.prototype.onSetUniform1F = function (gl, args) {
            gl.uniform1f(args.uniform, args.x);
        };
        CommandBuffer.prototype.setUniform1I = function (uniform, x) {
            if (uniform == null)
                return;
            this.push(this.onSetUniform1I, { uniform: uniform, x: x });
        };
        CommandBuffer.prototype.onSetUniform1I = function (gl, args) {
            gl.uniform1i(args.uniform, args.x);
        };
        CommandBuffer.prototype.setUniform2F = function (uniform, x, y) {
            if (uniform == null)
                return;
            this.push(this.onSetUniform2F, { uniform: uniform, x: x, y: y });
        };
        CommandBuffer.prototype.onSetUniform2F = function (gl, args) {
            gl.uniform2f(args.uniform, args.x, args.y);
        };
        CommandBuffer.prototype.setUniform3F = function (uniform, x, y, z) {
            if (uniform == null)
                return;
            this.push(this.onSetUniform3F, { uniform: uniform, x: x, y: y, z: z });
        };
        CommandBuffer.prototype.onSetUniform3F = function (gl, args) {
            gl.uniform3f(args.uniform, args.x, args.y, args.z);
        };
        CommandBuffer.prototype.setUniform4F = function (uniform, x, y, z, w) {
            if (uniform == null)
                return;
            this.push(this.onSetUniform4F, { uniform: uniform, x: x, y: y, z: z, w: w });
        };
        CommandBuffer.prototype.onSetUniform4F = function (gl, args) {
            gl.uniform4f(args.uniform, args.x, args.y, args.z, args.w);
        };
        CommandBuffer.prototype.setUniformMatrix4 = function (uniform, transpose, values) {
            if (uniform == null)
                return;
            this.push(this.onSetUniformMatrix4, { uniform: uniform, transpose: transpose, values: values });
        };
        CommandBuffer.prototype.onSetUniformMatrix4 = function (gl, args) {
            gl.uniformMatrix4fv(args.uniform, args.transpose, args.values);
        };
        CommandBuffer.prototype.bindTexture = function (unit, value) {
            if (this.boundTextures[unit] === value)
                return;
            this.boundTextures[unit] = value;
            this.push(this.onBindTexture, { unit: unit + this.context.TEXTURE0, target: value.getTarget(), texture: value.getHandle() });
        };
        CommandBuffer.prototype.onBindTexture = function (gl, args) {
            gl.activeTexture(args.unit);
            gl.bindTexture(args.target, args.texture);
        };
        CommandBuffer.prototype.bindBuffer = function (target, buffer) {
            if (this.boundBuffers[target] === buffer)
                return;
            this.boundBuffers[target] = buffer;
            this.push(this.onBindBuffer, { target: target, buffer: buffer });
        };
        CommandBuffer.prototype.onBindBuffer = function (gl, args) {
            gl.bindBuffer(args.target, args.buffer);
        };
        CommandBuffer.prototype.enableVertexAttribArray = function (index) {
            this.push(this.onEnableVertexAttribArray, { index: index });
        };
        CommandBuffer.prototype.onEnableVertexAttribArray = function (gl, args) {
            gl.enableVertexAttribArray(args.index);
        };
        CommandBuffer.prototype.disableVertexAttribArray = function (index) {
            this.push(this.onDisableVertexAttribArray, { index: index });
        };
        CommandBuffer.prototype.onDisableVertexAttribArray = function (gl, args) {
            gl.disableVertexAttribArray(args.index);
        };
        CommandBuffer.prototype.vertexAttribPointer = function (index, size, type, normalized, stride, offset) {
            this.push(this.onVertexAttribPointer, { index: index, size: size, type: type, normalized: normalized, stride: stride, offset: offset });
        };
        CommandBuffer.prototype.onVertexAttribPointer = function (gl, args) {
            gl.vertexAttribPointer(args.index, args.size, args.type, args.normalized, args.stride, args.offset);
        };
        CommandBuffer.prototype.drawElements = function (mode, count, type, offset, elemSize) {
            if (this.lastCommand.action === this.onDrawElements &&
                this.lastCommand.type === type &&
                this.lastCommand.offset + this.lastCommand.count * elemSize === offset) {
                this.lastCommand.count += count;
                return;
            }
            this.push(this.onDrawElements, { mode: mode, count: count, type: type, offset: offset });
        };
        CommandBuffer.prototype.onDrawElements = function (gl, args) {
            gl.drawElements(args.mode, args.count, args.type, args.offset);
        };
        CommandBuffer.prototype.bindFramebuffer = function (buffer, fitView) {
            this.push(this.onBindFramebuffer, { framebuffer: buffer, fitView: fitView, app: this.app });
        };
        CommandBuffer.prototype.onBindFramebuffer = function (gl, args) {
            var buffer = args.framebuffer;
            if (buffer == null) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                return;
            }
            if (args.fitView) {
                buffer.resize(args.app.getWidth(), args.app.getHeight());
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.getHandle());
        };
        return CommandBuffer;
    }());
    SourceUtils.CommandBuffer = CommandBuffer;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var DrawListItem = (function () {
        function DrawListItem() {
            this.isStatic = false;
            this.drawLists = [];
        }
        DrawListItem.prototype.addMeshHandles = function (handles) {
            if (this.meshHandles == null)
                this.meshHandles = [];
            for (var i = 0, iEnd = handles.length; i < iEnd; ++i) {
                this.meshHandles.push(handles[i].clone(!this.isStatic ? this.parent : null));
            }
            this.invalidateDrawLists();
        };
        DrawListItem.prototype.invalidateDrawLists = function () {
            if (!this.getIsVisible())
                return;
            for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                this.drawLists[i].updateItem(this);
            }
        };
        DrawListItem.prototype.getIsVisible = function () {
            return this.drawLists.length > 0;
        };
        DrawListItem.prototype.getIsInDrawList = function (drawList) {
            for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                if (this.drawLists[i] === drawList) {
                    return true;
                }
            }
            return false;
        };
        DrawListItem.prototype.onAddToDrawList = function (list) {
            if (this.getIsInDrawList(list))
                throw "Item added to a draw list twice.";
            this.drawLists.push(list);
        };
        DrawListItem.prototype.onRemoveFromDrawList = function (list) {
            for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                if (this.drawLists[i] === list) {
                    this.drawLists.splice(i, 1);
                    return;
                }
            }
            throw "Item removed from a draw list it isn't a member of.";
        };
        DrawListItem.prototype.onRequestMeshHandles = function () { };
        DrawListItem.prototype.getMeshHandles = function () {
            if (this.meshHandles == null) {
                this.onRequestMeshHandles();
            }
            return this.meshHandles;
        };
        return DrawListItem;
    }());
    DrawListItem.rootCenter = new THREE.Vector3();
    DrawListItem.thisCenter = new THREE.Vector3();
    SourceUtils.DrawListItem = DrawListItem;
    var BspDrawListItem = (function (_super) {
        __extends(BspDrawListItem, _super);
        function BspDrawListItem(map, tokenPrefix, tokenIndex) {
            var _this = _super.call(this) || this;
            _this.loadingFaces = false;
            _this.map = map;
            _this.tokenPrefix = tokenPrefix;
            _this.tokenIndex = tokenIndex;
            return _this;
        }
        BspDrawListItem.prototype.onRequestMeshHandles = function () {
            if (this.loadingFaces)
                return;
            this.loadingFaces = true;
            this.map.faceLoader.loadFaces(this);
        };
        BspDrawListItem.prototype.faceLoadPriority = function (map) {
            if (!this.getIsVisible())
                return Number.POSITIVE_INFINITY;
            if (this.bounds == null)
                return Number.MAX_VALUE;
            return 0;
        };
        BspDrawListItem.prototype.onLoadFaces = function (handles) {
            this.addMeshHandles(handles);
        };
        BspDrawListItem.prototype.getApiQueryToken = function () { return "" + this.tokenPrefix + this.tokenIndex; };
        return BspDrawListItem;
    }(DrawListItem));
    SourceUtils.BspDrawListItem = BspDrawListItem;
    var DrawListItemComponent = (function () {
        function DrawListItemComponent() {
            this.usages = [];
        }
        DrawListItemComponent.prototype.addUsage = function (item) {
            this.usages.push(item);
        };
        DrawListItemComponent.prototype.getIsVisible = function () {
            for (var i = 0, iEnd = this.usages.length; i < iEnd; ++i) {
                if (this.usages[i].getIsVisible())
                    return true;
            }
            return false;
        };
        return DrawListItemComponent;
    }());
    SourceUtils.DrawListItemComponent = DrawListItemComponent;
    var StudioModelDrawListItem = (function (_super) {
        __extends(StudioModelDrawListItem, _super);
        function StudioModelDrawListItem(map, mdlUrl, vhvUrl) {
            var _this = _super.call(this) || this;
            _this.bodyPartModels = (_a = {}, _a[0] = 0, _a);
            _this.albedoRgb = 0xffffff;
            _this.map = map;
            _this.mdlUrl = mdlUrl;
            _this.vhvUrl = vhvUrl;
            return _this;
            var _a;
        }
        StudioModelDrawListItem.prototype.shouldDisplayModel = function (model) {
            return this.bodyPartModels[model.bodyPart.index] === model.index;
        };
        StudioModelDrawListItem.prototype.onRequestMeshHandles = function () {
            var _this = this;
            if (this.mdl != null)
                return;
            this.mdl = this.map.modelLoader.load(this.mdlUrl);
            this.mdl.addUsage(this);
            var queuedToLoad = [];
            if (this.vhvUrl != null) {
                this.vhv = this.map.hardwareVertsLoader.load(this.vhvUrl);
                this.vhv.addUsage(this);
                this.vhv.setLoadCallback(function () {
                    for (var i = 0; i < queuedToLoad.length; ++i) {
                        _this.onModelLoad(queuedToLoad[i]);
                    }
                    queuedToLoad = [];
                });
            }
            this.mdl.addModelLoadCallback(function (model) {
                if (!_this.shouldDisplayModel(model))
                    return;
                if (_this.vhv != null && !_this.vhv.hasLoaded()) {
                    queuedToLoad.push(model);
                }
                else {
                    _this.onModelLoad(model);
                }
            });
        };
        StudioModelDrawListItem.prototype.onModelLoad = function (model) {
            this.addMeshHandles(model.createMeshHandles(this.isStatic ? this.parent : null, model === this.mdl.getModel(0, 0) ? this.vhv : null, this.albedoRgb));
        };
        return StudioModelDrawListItem;
    }(DrawListItem));
    SourceUtils.StudioModelDrawListItem = StudioModelDrawListItem;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="DrawListItem.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Displacement = (function (_super) {
        __extends(Displacement, _super);
        function Displacement(model, info) {
            var _this = _super.call(this, model.map, "d", info.index) || this;
            _this.parent = model;
            _this.clusters = info.clusters;
            var min = info.min;
            var max = info.max;
            _this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
            return _this;
        }
        return Displacement;
    }(SourceUtils.BspDrawListItem));
    SourceUtils.Displacement = Displacement;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var DrawList = (function () {
        function DrawList(context) {
            this.items = [];
            this.opaque = [];
            this.translucent = [];
            this.isBuildingList = false;
            this.context = context;
            this.map = context.getMap();
        }
        DrawList.prototype.clear = function () {
            for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                this.items[i].onRemoveFromDrawList(this);
            }
            this.items = [];
            this.opaque = [];
            this.translucent = [];
        };
        DrawList.prototype.getDrawCalls = function () {
            return this.opaque.length + this.translucent.length;
        };
        DrawList.prototype.addItem = function (item) {
            this.items.push(item);
            this.updateItem(item);
            item.onAddToDrawList(this);
        };
        DrawList.prototype.invalidate = function (geom) {
            if (this.isBuildingList)
                return;
            if (geom)
                this.invalid = true;
            this.context.invalidate();
        };
        DrawList.prototype.updateItem = function (item) {
            this.invalidate(true);
        };
        DrawList.prototype.bufferHandle = function (buf, handle, context) {
            var changedMaterial = false;
            var changedProgram = false;
            var changedTransform = false;
            if (this.lastParent !== handle.parent) {
                this.lastParent = handle.parent;
                context.setModelTransform(this.lastParent);
                changedTransform = true;
            }
            if (handle.materialIndex !== undefined && this.lastMaterialIndex !== handle.materialIndex) {
                changedMaterial = true;
                this.lastMaterialIndex = handle.materialIndex;
                this.lastMaterial = this.map.getMaterial(handle.materialIndex);
            }
            else if (handle.materialIndex === undefined && this.lastMaterial !== handle.material) {
                changedMaterial = true;
                this.lastMaterialIndex = undefined;
                this.lastMaterial = handle.material;
            }
            if (changedMaterial) {
                if (this.lastMaterial == null) {
                    this.canRender = false;
                    return;
                }
                if (this.lastProgram !== this.lastMaterial.getProgram()) {
                    if (this.lastProgram !== undefined) {
                        this.lastProgram.bufferDisableMeshComponents(buf);
                    }
                    this.lastProgram = this.lastMaterial.getProgram();
                    changedProgram = true;
                    changedTransform = true;
                }
                this.canRender = this.lastProgram.isCompiled() && this.lastMaterial.enabled;
            }
            if (!this.canRender)
                return;
            if (changedProgram) {
                this.lastProgram.bufferSetup(buf, context);
            }
            if (changedMaterial) {
                this.lastProgram.bufferMaterial(buf, this.lastMaterial);
            }
            if (changedTransform) {
                this.lastProgram.bufferModelMatrix(buf, context.getModelMatrix());
            }
            if (this.lastGroup !== handle.group || changedProgram) {
                this.lastGroup = handle.group;
                this.lastVertexOffset = undefined;
                this.lastGroup.bufferBindBuffers(buf, this.lastProgram);
            }
            if (this.lastVertexOffset !== handle.vertexOffset) {
                this.lastVertexOffset = handle.vertexOffset;
                this.lastGroup.bufferAttribPointers(buf, this.lastProgram, this.lastVertexOffset);
            }
            this.lastGroup.bufferRenderElements(buf, handle.drawMode, handle.indexOffset, handle.indexCount);
        };
        DrawList.compareHandles = function (a, b) {
            return a.compareTo(b);
        };
        DrawList.prototype.buildHandleList = function () {
            this.opaque = [];
            this.translucent = [];
            this.hasRefraction = false;
            this.isBuildingList = true;
            for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                var handles = this.items[i].getMeshHandles();
                if (handles == null)
                    continue;
                for (var j = 0, jEnd = handles.length; j < jEnd; ++j) {
                    var handle = handles[j];
                    if (handle.indexCount === 0)
                        continue;
                    if (handle.material == null) {
                        if ((handle.material = this.map.getMaterial(handle.materialIndex)) == null)
                            continue;
                    }
                    if (handle.material.properties.translucent || handle.material.properties.refract) {
                        if (handle.material.properties.refract)
                            this.hasRefraction = true;
                        this.translucent.push(handle);
                    }
                    else
                        this.opaque.push(handle);
                }
            }
            this.isBuildingList = false;
            this.opaque.sort(DrawList.compareHandles);
            this.translucent.sort(DrawList.compareHandles);
            this.map.getApp().invalidateDebugPanel();
        };
        DrawList.prototype.appendToBuffer = function (buf, context) {
            this.lastParent = undefined;
            this.lastGroup = undefined;
            this.lastVertexOffset = undefined;
            this.lastProgram = undefined;
            this.lastMaterial = undefined;
            this.lastMaterialIndex = undefined;
            this.lastIndex = undefined;
            if (this.invalid)
                this.buildHandleList();
            context.getShaderManager().resetUniformCache();
            if (this.hasRefraction)
                context.bufferOpaqueTargetBegin(buf);
            for (var i = 0, iEnd = this.opaque.length; i < iEnd; ++i) {
                this.bufferHandle(buf, this.opaque[i], context);
            }
            if (this.hasRefraction) {
                context.bufferRenderTargetEnd(buf);
                this.bufferHandle(buf, this.map.getComposeFrameMeshHandle(), context);
            }
            for (var i = 0, iEnd = this.translucent.length; i < iEnd; ++i) {
                this.bufferHandle(buf, this.translucent[i], context);
            }
            if (this.lastProgram !== undefined) {
                this.lastProgram.bufferDisableMeshComponents(buf);
            }
        };
        DrawList.prototype.logState = function (writer) {
            writer.writeProperty("itemCount", this.items.length);
            writer.writeProperty("opaqueCount", this.opaque.length);
            writer.writeProperty("translucentCount", this.translucent.length);
            writer.writeProperty("hasRefraction", this.hasRefraction);
        };
        return DrawList;
    }());
    SourceUtils.DrawList = DrawList;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var MeshData = (function () {
        function MeshData(facesOrVertData, indexData) {
            var vertData = facesOrVertData;
            if (indexData == null) {
                indexData = facesOrVertData;
            }
            this.components = vertData.components;
            this.elements = indexData.elements;
            this.vertices = SourceUtils.Utils.decompressOrClone(vertData.vertices);
            this.indices = SourceUtils.Utils.decompressOrClone(indexData.indices);
        }
        return MeshData;
    }());
    SourceUtils.MeshData = MeshData;
    var FaceLoader = (function () {
        function FaceLoader(map) {
            this.queue = [];
            this.active = [];
            this.maxLeavesPerRequest = 512;
            this.map = map;
        }
        FaceLoader.prototype.loadFaces = function (target) {
            this.queue.push(target);
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
        FaceLoader.prototype.update = function (requestQuota) {
            var _this = this;
            if (this.queue.length <= 0 || this.active.length >= requestQuota)
                return this.active.length;
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
                return this.active.length;
            this.active.push(tasks);
            var url = this.map.info.facesUrl
                .replace("{tokens}", query);
            $.getJSON(url, function (data) {
                for (var i = 0; i < data.facesList.length; ++i) {
                    var faces = data.facesList[i];
                    var task = tasks[i];
                    var handles = _this.map.meshManager.addMeshData(new MeshData(faces));
                    task.onLoadFaces(handles);
                }
            }).fail(function () {
                var rangesStr = query.replace("+", ", ");
                console.log("Failed to load leaf faces [" + rangesStr + "].");
            }).always(function () {
                var index = _this.active.indexOf(tasks);
                _this.active.splice(index, 1);
            });
            return this.active.length;
        };
        return FaceLoader;
    }());
    SourceUtils.FaceLoader = FaceLoader;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var FormattedWriter = (function () {
        function FormattedWriter() {
            this.indentation = "";
            this.lines = [];
        }
        FormattedWriter.prototype.clear = function () {
            this.lines = [];
        };
        FormattedWriter.prototype.writeLine = function (value) {
            this.lines.push(this.indentation + value);
        };
        FormattedWriter.prototype.beginBlock = function (label) {
            this.writeLine("+ " + label);
            this.indentation += "  ";
        };
        FormattedWriter.prototype.writeProperty = function (key, value) {
            this.writeLine("- " + key + ": " + value);
        };
        FormattedWriter.prototype.endBlock = function () {
            this.indentation = this.indentation.substr(0, this.indentation.length - 2);
        };
        FormattedWriter.prototype.getValue = function () {
            return this.lines.join("\r\n");
        };
        return FormattedWriter;
    }());
    SourceUtils.FormattedWriter = FormattedWriter;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var FrameBuffer = (function () {
        function FrameBuffer(gl, width, height) {
            this.context = gl;
            this.width = width;
            this.height = height;
            this.frameTexture = new SourceUtils.RenderTexture(gl, width, height, gl.RGBA, gl.UNSIGNED_BYTE);
            this.frameBuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTexture.getHandle(), 0);
            this.unbindAndCheckState();
        }
        FrameBuffer.prototype.unbindAndCheckState = function () {
            var gl = this.context;
            var state = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            if (state !== gl.FRAMEBUFFER_COMPLETE) {
                throw new Error("Unexpected framebuffer state: " + state + ".");
            }
        };
        FrameBuffer.prototype.addDepthAttachment = function (existing) {
            var gl = this.context;
            if (existing == null) {
                this.depthTexture = new SourceUtils.RenderTexture(gl, this.width, this.height, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT);
            }
            else {
                this.depthTexture = existing;
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.getHandle(), 0);
            this.unbindAndCheckState();
        };
        FrameBuffer.prototype.getColorTexture = function () { return this.frameTexture; };
        FrameBuffer.prototype.getDepthTexture = function () { return this.depthTexture; };
        FrameBuffer.prototype.dispose = function () {
            if (this.frameBuffer !== undefined) {
                this.context.deleteFramebuffer(this.frameBuffer);
                this.frameBuffer = undefined;
            }
            if (this.frameTexture !== undefined) {
                this.frameTexture.dispose();
                this.frameTexture = undefined;
            }
            if (this.depthTexture !== undefined) {
                this.depthTexture.dispose();
                this.depthTexture = undefined;
            }
        };
        FrameBuffer.prototype.resize = function (width, height) {
            if (this.width === width && this.height === height)
                return;
            this.width = width;
            this.height = height;
            this.frameTexture.resize(width, height);
            if (this.depthTexture !== undefined) {
                this.depthTexture.resize(width, height);
            }
        };
        FrameBuffer.prototype.getHandle = function () {
            return this.frameBuffer;
        };
        FrameBuffer.prototype.begin = function () {
            var gl = this.context;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        };
        FrameBuffer.prototype.end = function () {
            var gl = this.context;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        };
        return FrameBuffer;
    }());
    SourceUtils.FrameBuffer = FrameBuffer;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var Loader = (function () {
        function Loader() {
            this.queue = [];
            this.loaded = {};
            this.active = 0;
            this.completed = 0;
        }
        Loader.prototype.load = function (url) {
            var loaded = this.loaded[url];
            if (loaded != null)
                return loaded;
            loaded = this.onCreateItem(url);
            this.loaded[url] = loaded;
            this.enqueueItem(loaded);
            return loaded;
        };
        Loader.prototype.getQueueCount = function () {
            return this.queue.length;
        };
        Loader.prototype.getActiveCount = function () {
            return this.active;
        };
        Loader.prototype.getCompletedCount = function () {
            return this.completed;
        };
        Loader.prototype.getTotalCount = function () {
            return this.queue.length + this.active + this.completed;
        };
        Loader.prototype.enqueueItem = function (item) {
            this.queue.push(item);
        };
        Loader.prototype.onFinishedLoadStep = function (item) { };
        Loader.prototype.getNextToLoad = function () {
            if (this.queue.length <= 0)
                return null;
            var bestIndex = 0;
            var bestItem = this.queue[0];
            for (var i = 1, iEnd = this.queue.length; i < iEnd; ++i) {
                var item = this.queue[i];
                if (!item.shouldLoadBefore(bestItem))
                    continue;
                bestIndex = i;
                bestItem = item;
            }
            return this.queue.splice(bestIndex, 1)[0];
        };
        Loader.prototype.update = function (requestQuota) {
            var _this = this;
            var next;
            var _loop_1 = function () {
                ++this_1.active;
                var nextCopy = next;
                next.loadNext(function (requeue) {
                    --_this.active;
                    if (requeue)
                        _this.queue.push(nextCopy);
                    else
                        ++_this.completed;
                    _this.onFinishedLoadStep(nextCopy);
                });
            };
            var this_1 = this;
            while (this.active < requestQuota && (next = this.getNextToLoad()) != null) {
                _loop_1();
            }
            return this.active;
        };
        return Loader;
    }());
    SourceUtils.Loader = Loader;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="Loader.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var HardwareVertsLoader = (function (_super) {
        __extends(HardwareVertsLoader, _super);
        function HardwareVertsLoader() {
            return _super.call(this) || this;
        }
        HardwareVertsLoader.prototype.onCreateItem = function (url) {
            return new SourceUtils.HardwareVerts(url);
        };
        return HardwareVertsLoader;
    }(SourceUtils.Loader));
    SourceUtils.HardwareVertsLoader = HardwareVertsLoader;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="AppBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Map = (function (_super) {
        __extends(Map, _super);
        function Map(app, url) {
            var _this = _super.call(this) || this;
            _this.loaders = [];
            _this.models = [];
            _this.displacements = [];
            _this.staticProps = [];
            _this.materials = [];
            _this.drawListInvalidationHandlers = [];
            _this.app = app;
            _this.faceLoader = _this.addLoader(new SourceUtils.FaceLoader(_this));
            _this.modelLoader = _this.addLoader(new SourceUtils.StudioModelLoader(_this));
            _this.hardwareVertsLoader = _this.addLoader(new SourceUtils.HardwareVertsLoader());
            _this.textureLoader = _this.addLoader(new SourceUtils.TextureLoader(_this, app.getContext()));
            _this.meshManager = new SourceUtils.WorldMeshManager(app.getContext());
            _this.shaderManager = new SourceUtils.ShaderManager(app.getContext());
            _this.blankMaterial = new SourceUtils.Material(_this, "LightmappedGeneric");
            _this.blankMaterial.properties.baseTexture = _this.shaderManager.getWhiteTexture();
            _this.errorMaterial = new SourceUtils.Material(_this, "LightmappedGeneric");
            _this.errorMaterial.properties.baseTexture = new SourceUtils.ErrorTexture2D(app.getContext());
            _this.loadInfo(url);
            return _this;
        }
        Map.prototype.addLoader = function (loader) {
            this.loaders.push(loader);
            return loader;
        };
        Map.prototype.getApp = function () {
            return this.app;
        };
        Map.prototype.getLightmap = function () {
            return this.lightmap || this.shaderManager.getWhiteTexture();
        };
        Map.prototype.getWorldSpawn = function () {
            return this.models.length > 0 ? this.models[0] : null;
        };
        Map.prototype.setSkyMaterialEnabled = function (value) {
            if (this.skyMaterial != null)
                this.skyMaterial.enabled = value;
        };
        Map.prototype.getMaterial = function (index) {
            return index === -1
                ? this.skyMaterial
                : (index < this.materials.length ? this.materials[index] : this.blankMaterial) || this.errorMaterial;
        };
        Map.prototype.generateComposeFrameMeshData = function () {
            return new SourceUtils.MeshData({
                components: SourceUtils.Api.MeshComponent.Uv,
                vertices: [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0],
                indices: [0, 1, 2, 0, 2, 3],
                elements: [
                    {
                        type: SourceUtils.Api.PrimitiveType.TriangleList,
                        material: undefined,
                        indexOffset: 0,
                        indexCount: 6
                    }
                ]
            });
        };
        Map.prototype.getComposeFrameMeshHandle = function () {
            if (this.composeFrameHandle !== undefined)
                return this.composeFrameHandle;
            this.composeFrameHandle = this.meshManager.addMeshData(this.generateComposeFrameMeshData())[0];
            this.composeFrameHandle.parent = null;
            this.composeFrameHandle.material = new SourceUtils.Material(this, "ComposeFrame");
            this.composeFrameHandle.material.properties.noCull = true;
            return this.composeFrameHandle;
        };
        Map.prototype.loadInfo = function (url) {
            var _this = this;
            $.getJSON(url, function (data) {
                _this.info = data;
                _this.models = new Array(data.numModels);
                _this.clusters = new Array(data.numClusters);
                for (var i = 0; i < data.numClusters; ++i) {
                    _this.clusters[i] = new Array();
                }
                _this.pvsArray = new Array(data.numClusters);
                _this.lightmap = new SourceUtils.Lightmap(_this.app.getContext(), data.lightmapUrl);
                _this.loadDisplacements();
                _this.loadMaterials();
                _this.loadStaticProps();
                _this.skyMaterial = new SourceUtils.Material(_this, data.skyMaterial);
                for (var i = 0; i < data.brushEnts.length; ++i) {
                    var ent = data.brushEnts[i];
                    if (_this.models[ent.model] !== undefined)
                        throw "Multiple models with the same index.";
                    _this.models[ent.model] = new SourceUtils.BspModel(_this, ent);
                }
            });
        };
        Map.prototype.loadDisplacements = function () {
            var _this = this;
            $.getJSON(this.info.displacementsUrl, function (data) {
                _this.displacements = [];
                for (var i = 0; i < data.displacements.length; ++i) {
                    _this.displacements.push(new SourceUtils.Displacement(_this.getWorldSpawn(), data.displacements[i]));
                }
                _this.forceDrawListInvalidation(true);
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
                _this.forceDrawListInvalidation(false);
            });
        };
        Map.prototype.loadStaticProps = function () {
            var _this = this;
            $.getJSON(this.info.staticPropsUrl, function (data) {
                _this.staticProps = [];
                for (var i = 0; i < data.props.length; ++i) {
                    var prop = data.props[i];
                    if (typeof prop.model === "number") {
                        prop.model = data.models[prop.model];
                    }
                    _this.staticProps.push(new SourceUtils.PropStatic(_this, prop));
                }
                _this.forceDrawListInvalidation(true);
            });
        };
        Map.prototype.addDrawListInvalidationHandler = function (action) {
            this.drawListInvalidationHandlers.push(action);
        };
        Map.prototype.forceDrawListInvalidation = function (geom) {
            for (var i = 0; i < this.drawListInvalidationHandlers.length; ++i) {
                this.drawListInvalidationHandlers[i](geom);
            }
        };
        Map.prototype.onModelLoaded = function (model) {
            if (model !== this.getWorldSpawn())
                return;
            var leaves = model.getLeaves();
            for (var i = 0; i < leaves.length; ++i) {
                var leaf = leaves[i];
                if (leaf.cluster === -1)
                    continue;
                this.clusters[leaf.cluster].push(leaf);
            }
        };
        Map.prototype.update = function () {
            for (var i = 0; i < this.loaders.length; ++i) {
                this.loaders[i].update(4);
            }
        };
        Map.prototype.getPvsArray = function (root, callback) {
            var pvs = this.pvsArray[root.cluster];
            if (pvs != null) {
                callback(pvs);
                return;
            }
            this.loadPvsArray(root, callback);
        };
        Map.prototype.isAnyClusterVisible = function (clusters, drawList) {
            for (var j = 0, jEnd = clusters.length; j < jEnd; ++j) {
                if (this.clusters[clusters[j]][0].getIsInDrawList(drawList))
                    return true;
            }
            return false;
        };
        Map.prototype.appendToDrawList = function (drawList, pvs) {
            for (var i = 0, iEnd = pvs.length; i < iEnd; ++i) {
                drawList.addItem(pvs[i]);
            }
            for (var i = this.displacements.length - 1; i >= 0; --i) {
                var disp = this.displacements[i];
                if (this.isAnyClusterVisible(disp.clusters, drawList)) {
                    drawList.addItem(disp);
                }
            }
            for (var i = 1, iEnd = this.models.length; i < iEnd; ++i) {
                var model = this.models[i];
                if (model == null)
                    continue;
                if (!this.isAnyClusterVisible(model.clusters, drawList))
                    continue;
                var leaves = model.getLeaves();
                for (var j = 0, jEnd = leaves.length; j < jEnd; ++j) {
                    drawList.addItem(leaves[j]);
                }
            }
            for (var i = 0, iEnd = this.staticProps.length; i < iEnd; ++i) {
                var prop = this.staticProps[i];
                if (prop == null)
                    continue;
                if (!this.isAnyClusterVisible(prop.clusters, drawList))
                    continue;
                drawList.addItem(prop.getDrawListItem());
            }
        };
        Map.prototype.loadPvsArray = function (root, callback) {
            var _this = this;
            var pvs = this.pvsArray[root.cluster] = [];
            var url = this.info.visibilityUrl.replace("{index}", root.cluster.toString());
            $.getJSON(url, function (data) {
                var indices = SourceUtils.Utils.decompress(data.pvs);
                for (var i = 0; i < indices.length; ++i) {
                    var cluster = _this.clusters[indices[i]];
                    for (var j = 0; j < cluster.length; ++j) {
                        pvs.push(cluster[j]);
                    }
                }
                if (callback != null)
                    callback(pvs);
            });
        };
        Map.prototype.logState = function (writer) {
            writer.beginBlock("meshManager");
            this.meshManager.logState(writer);
            writer.endBlock();
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
            _this.countedFrames = 0;
            _this.frameCountStart = 0;
            _this.totalRenderTime = 0;
            _this.lastAvgRenderTime = 0;
            _this.lastAvgFrameTime = 0;
            _this.lastHashChangeTime = -1;
            _this.debugPanelInvalid = false;
            _this.spawned = false;
            _this.unitZ = new THREE.Vector3(0, 0, 1);
            _this.unitX = new THREE.Vector3(1, 0, 0);
            _this.tempQuat = new THREE.Quaternion();
            _this.skyCameraPos = new THREE.Vector3();
            _this.canLockPointer = true;
            _this.frameCountStart = performance.now();
            return _this;
        }
        MapViewer.prototype.enableExtension = function (name) {
            var gl = this.getContext();
            if (gl.getExtension(name) == null) {
                console.warn("WebGL extension '" + name + "' is unsupported.");
            }
        };
        MapViewer.prototype.init = function (container) {
            var _this = this;
            this.camera = new SourceUtils.PerspectiveCamera(75, container.innerWidth() / container.innerHeight(), 1, 8192);
            _super.prototype.init.call(this, container);
            this.enableExtension("EXT_frag_depth");
            this.enableExtension("WEBGL_depth_texture");
            window.onhashchange = function () {
                _this.onHashChange(window.location.hash);
            };
            this.updateCameraAngles();
        };
        MapViewer.prototype.loadMap = function (url) {
            this.map = new SourceUtils.Map(this, url);
            this.mainRenderContext = new SourceUtils.RenderContext(this.map, this.camera);
        };
        MapViewer.prototype.onKeyDown = function (key) {
            _super.prototype.onKeyDown.call(this, key);
            if (key === SourceUtils.Key.F) {
                this.toggleFullscreen();
            }
        };
        MapViewer.prototype.onDeviceRotate = function (delta) {
            this.lookAngs.x += delta.z;
            this.lookAngs.y -= delta.x;
            this.updateCameraAngles();
        };
        MapViewer.prototype.onUpdateCamera = function () {
            this.camera.setAspect(this.getWidth() / this.getHeight());
            if (this.skyCamera != null)
                this.skyCamera.setAspect(this.camera.getAspect());
        };
        MapViewer.prototype.updateCameraAngles = function () {
            if (this.lookAngs.y < -Math.PI * 0.5)
                this.lookAngs.y = -Math.PI * 0.5;
            if (this.lookAngs.y > Math.PI * 0.5)
                this.lookAngs.y = Math.PI * 0.5;
            this.lookQuat.setFromAxisAngle(this.unitZ, this.lookAngs.x);
            this.tempQuat.setFromAxisAngle(this.unitX, this.lookAngs.y + Math.PI * 0.5);
            this.lookQuat.multiply(this.tempQuat);
            this.camera.setRotation(this.lookQuat);
        };
        MapViewer.prototype.onMouseLook = function (delta) {
            _super.prototype.onMouseLook.call(this, delta);
            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.updateCameraAngles();
            this.lastHashChangeTime = this.getLastUpdateTime();
        };
        MapViewer.prototype.onHashChange = function (hash) {
            if (hash == null || hash === this.lastSetHash)
                return;
            var coords = {
                x: 0,
                y: 0,
                z: 0,
                u: this.lookAngs.x * 180 / Math.PI,
                v: this.lookAngs.y * 180 / Math.PI
            };
            this.camera.getPosition(coords);
            var spawnPosRegexp = /([xyzuv]-?[0-9]+(?:\.[0-9]+)?)/ig;
            var match = spawnPosRegexp.exec(hash);
            while (match != null) {
                var component = match[0].charAt(0);
                var value = parseFloat(match[0].substr(1));
                coords[component] = value;
                match = spawnPosRegexp.exec(hash);
            }
            this.camera.setPosition(coords.x, coords.y, coords.z);
            this.lookAngs.x = coords.u * Math.PI / 180;
            this.lookAngs.y = coords.v * Math.PI / 180;
            this.updateCameraAngles();
        };
        MapViewer.prototype.updateHash = function () {
            var coords = {
                x: 0,
                y: 0,
                z: 0,
                u: this.lookAngs.x * 180 / Math.PI,
                v: this.lookAngs.y * 180 / Math.PI
            };
            this.camera.getPosition(coords);
            var round10 = function (x) { return Math.round(x * 10) / 10; };
            this.lastSetHash = "#x" + round10(coords.x) + "y" + round10(coords.y) + "z" + round10(coords.z) + "u" + round10(coords.u) + "v" + round10(coords.v);
            location.hash = this.lastSetHash;
        };
        MapViewer.prototype.onUpdateFrame = function (dt) {
            _super.prototype.onUpdateFrame.call(this, dt);
            if (!this.spawned) {
                if (this.map.info == null)
                    return;
                this.spawned = true;
                var playerStart = this.map.info.playerStarts[0];
                this.camera.setPosition(playerStart);
                this.camera.translate(0, 0, 64);
                this.onHashChange(location.hash);
                this.mainRenderContext.fogParams = this.map.info.fog;
                if (this.map.info.fog.fogEnabled && this.map.info.fog.farZ !== -1) {
                    this.camera.setFar(this.map.info.fog.farZ);
                }
                if (this.map.info.skyCamera.enabled) {
                    this.skyCamera = new SourceUtils.PerspectiveCamera(this.camera.getFov(), this.camera.getAspect(), this.camera.getNear(), this.camera.getFar());
                    this.skyRenderContext = new SourceUtils.RenderContext(this.map, this.skyCamera);
                    this.skyRenderContext.setPvsOrigin(this.map.info.skyCamera.origin);
                    this.skyRenderContext.fogParams = this.map.info.skyCamera;
                }
            }
            this.map.update();
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
                this.camera.applyRotationTo(move);
                this.camera.translate(move);
                this.invalidateDebugPanel();
                this.lastHashChangeTime = this.getLastUpdateTime();
            }
            if (this.debugPanelInvalid) {
                this.debugPanelInvalid = false;
                this.updateDebugPanel();
            }
            if (this.lastHashChangeTime !== -1 && this.getLastUpdateTime() - this.lastHashChangeTime > 0.25) {
                this.lastHashChangeTime = -1;
                this.updateHash();
            }
        };
        MapViewer.prototype.invalidateDebugPanel = function () {
            this.debugPanelInvalid = true;
        };
        MapViewer.prototype.initDebugPanel = function () {
            this.debugPanel
                .html('<span class="debug-label">Render time:</span>&nbsp;<span class="debug-value" id="debug-render-time"></span><br/>'
                + '<span class="debug-label">Frame time:</span>&nbsp;<span class="debug-value" id="debug-frame-time"></span><br/>'
                + '<span class="debug-label">Frame rate:</span>&nbsp;<span class="debug-value" id="debug-frame-rate"></span><br/>'
                + '<span class="debug-label">Draw calls:</span>&nbsp;<span class="debug-value" id="debug-draw-calls"></span><br/>'
                + '<span class="debug-label">Camera pos:</span>&nbsp;<span class="debug-value" id="debug-camera-pos"></span><br/>'
                + '<span class="debug-label">Cluster id:</span>&nbsp;<span class="debug-value" id="debug-cluster-id"></span>');
        };
        MapViewer.prototype.updateDebugPanel = function () {
            if (this.debugPanel == null)
                return;
            if (this.lastDebugPanel !== this.debugPanel) {
                this.lastDebugPanel = this.debugPanel;
                this.initDebugPanel();
            }
            var drawCalls = this.mainRenderContext.getDrawCallCount();
            if (this.skyRenderContext != null) {
                drawCalls += this.skyRenderContext.getDrawCallCount();
            }
            var cameraPos = new THREE.Vector3();
            this.camera.getPosition(cameraPos);
            this.debugPanel.find("#debug-render-time").text(this.lastAvgRenderTime.toPrecision(5) + " ms");
            this.debugPanel.find("#debug-frame-time").text(this.lastAvgFrameTime.toPrecision(5) + " ms");
            this.debugPanel.find("#debug-frame-rate").text((1000 / this.lastAvgFrameTime).toPrecision(5) + " fps");
            this.debugPanel.find("#debug-draw-calls").text("" + drawCalls);
            this.debugPanel.find("#debug-camera-pos").text(Math.round(cameraPos.x) + ", " + Math.round(cameraPos.y) + ", " + Math.round(cameraPos.z));
            this.debugPanel.find("#debug-cluster-id").text("" + this.mainRenderContext.getClusterIndex());
        };
        MapViewer.prototype.onRenderFrame = function (dt) {
            var gl = this.getContext();
            var t0 = performance.now();
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            gl.cullFace(gl.FRONT);
            if (this.skyRenderContext != null && this.mainRenderContext.canSeeSky3D()) {
                this.map.setSkyMaterialEnabled(true);
                this.camera.getPosition(this.skyCameraPos);
                this.skyCameraPos.divideScalar(this.map.info.skyCamera.scale);
                this.skyCameraPos.add(this.map.info.skyCamera.origin);
                this.skyCamera.copyRotation(this.camera);
                this.skyCamera.setPosition(this.skyCameraPos);
                this.skyRenderContext.render();
                gl.depthMask(true);
                gl.clear(gl.DEPTH_BUFFER_BIT);
                this.map.setSkyMaterialEnabled(false);
            }
            else if (this.mainRenderContext.canSeeSky2D()) {
                this.map.setSkyMaterialEnabled(true);
            }
            if (this.mainRenderContext != null) {
                this.mainRenderContext.render();
            }
            var t1 = performance.now();
            this.totalRenderTime += (t1 - t0);
            this.countedFrames += 1;
            if (this.countedFrames > 100) {
                this.lastAvgRenderTime = this.totalRenderTime / this.countedFrames;
                this.lastAvgFrameTime = (t1 - this.frameCountStart) / this.countedFrames;
                this.frameCountStart = t1;
                this.invalidateDebugPanel();
                this.totalRenderTime = 0;
                this.countedFrames = 0;
            }
        };
        MapViewer.prototype.debug = function () {
            var writer = new SourceUtils.FormattedWriter();
            this.logState(writer);
            console.log(writer.getValue());
        };
        MapViewer.prototype.logState = function (writer) {
            writer.beginBlock("map");
            this.map.logState(writer);
            writer.endBlock();
            writer.beginBlock("mainRenderContext");
            this.mainRenderContext.logState(writer);
            writer.endBlock();
            if (this.skyRenderContext != null) {
                writer.beginBlock("skyRenderContext");
                this.skyRenderContext.logState(writer);
                writer.endBlock();
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
            this.translucent = false;
            this.refract = false;
            this.baseTexture = null;
            this.baseTexture2 = null;
            this.blendModulateTexture = null;
            this.normalMap = null;
            this.simpleOverlay = null;
            this.noFog = false;
            this.alphaTest = false;
            this.alpha = 1;
            this.noCull = false;
            this.noTint = false;
            this.baseAlphaTint = false;
            this.fogStart = 0;
            this.fogEnd = 65535;
            this.fogColor = { r: 0, g: 0, b: 0, a: 255 };
            this.reflectTint = { r: 255, g: 255, b: 255, a: 255 };
            this.refractAmount = 1.0;
        }
        return MaterialProperties;
    }());
    SourceUtils.MaterialProperties = MaterialProperties;
    var Material = (function () {
        function Material(map, infoOrShader) {
            this.properties = new MaterialProperties();
            this.enabled = true;
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
        Material.prototype.drawOrderCompareTo = function (other) {
            return this.program.sortOrder - other.program.sortOrder;
        };
        Material.prototype.compareTo = function (other) {
            if (other === this)
                return 0;
            var thisTex = this.properties.baseTexture;
            var thatTex = other.properties.baseTexture;
            var texComp = thisTex != null && thatTex != null ? thisTex.compareTo(thatTex) : thisTex != null ? 1 : thatTex != null ? -1 : 0;
            return texComp !== 0 ? texComp : this.sortIndex - other.sortIndex;
        };
        Material.prototype.getMap = function () {
            return this.map;
        };
        Material.prototype.getProgram = function () {
            return this.program;
        };
        return Material;
    }());
    Material.nextSortIndex = 0;
    SourceUtils.Material = Material;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var PropStatic = (function (_super) {
        __extends(PropStatic, _super);
        function PropStatic(map, info) {
            var _this = _super.call(this) || this;
            _this.clusters = [];
            _this.setPosition(info.origin);
            _this.setAngles(info.angles);
            _this.info = info;
            if ((info.flags & SourceUtils.Api.StaticPropFlags.NoDraw) !== 0 || typeof info.model !== "string")
                return _this;
            _this.clusters = info.clusters;
            _this.drawListItem = new SourceUtils.StudioModelDrawListItem(map, info.model, info.vertLightingUrl);
            _this.drawListItem.parent = _this;
            _this.drawListItem.isStatic = true;
            _this.drawListItem.albedoRgb = info.albedo;
            return _this;
        }
        PropStatic.prototype.getDrawListItem = function () {
            return this.drawListItem;
        };
        return PropStatic;
    }(SourceUtils.Entity));
    SourceUtils.PropStatic = PropStatic;
    var HardwareVerts = (function (_super) {
        __extends(HardwareVerts, _super);
        function HardwareVerts(url) {
            var _this = _super.call(this) || this;
            _this.vhvUrl = url;
            return _this;
        }
        HardwareVerts.prototype.setLoadCallback = function (callback) {
            this.loadCallback = callback;
            if (this.hasLoaded())
                callback();
        };
        HardwareVerts.prototype.hasLoaded = function () {
            return this.info != null;
        };
        HardwareVerts.prototype.getSamples = function (meshId) {
            return SourceUtils.Utils.decompress(this.info.meshes[meshId]);
        };
        HardwareVerts.prototype.shouldLoadBefore = function (other) { return this.getIsVisible(); };
        HardwareVerts.prototype.loadNext = function (callback) {
            var _this = this;
            if (this.info != null) {
                callback(false);
                return;
            }
            $.getJSON(this.vhvUrl, function (data) {
                _this.info = data;
                if (_this.loadCallback != null)
                    _this.loadCallback();
            }).always(function () { return callback(false); });
        };
        return HardwareVerts;
    }(SourceUtils.DrawListItemComponent));
    SourceUtils.HardwareVerts = HardwareVerts;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var RenderContext = (function () {
        function RenderContext(map, camera) {
            var _this = this;
            this.projectionMatrix = new THREE.Matrix4();
            this.inverseProjectionMatrix = new THREE.Matrix4();
            this.identityMatrix = new THREE.Matrix4().identity();
            this.viewMatrix = new THREE.Matrix4();
            this.inverseViewMatrix = new THREE.Matrix4();
            this.commandBufferInvalid = true;
            this.pvsOrigin = new THREE.Vector3();
            this.pvsFollowsCamera = true;
            this.origin = new THREE.Vector3();
            this.map = map;
            this.camera = camera;
            this.drawList = new SourceUtils.DrawList(this);
            this.commandBuffer = new SourceUtils.CommandBuffer(map.shaderManager.getContext());
            this.map.addDrawListInvalidationHandler(function (geom) { return _this.drawList.invalidate(geom); });
        }
        RenderContext.prototype.getOpaqueColorTexture = function () {
            return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getColorTexture();
        };
        RenderContext.prototype.getOpaqueDepthTexture = function () {
            return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getDepthTexture();
        };
        RenderContext.prototype.invalidate = function () {
            this.commandBufferInvalid = true;
        };
        RenderContext.prototype.getMap = function () {
            return this.map;
        };
        RenderContext.prototype.getShaderManager = function () {
            return this.map.shaderManager;
        };
        RenderContext.prototype.getLightmap = function () {
            return this.map.getLightmap();
        };
        RenderContext.prototype.getProjectionMatrix = function () {
            return this.projectionMatrix.elements;
        };
        RenderContext.prototype.getInverseProjectionMatrix = function () {
            return this.inverseProjectionMatrix.elements;
        };
        RenderContext.prototype.getViewMatrix = function () {
            return this.viewMatrix.elements;
        };
        RenderContext.prototype.getInverseViewMatrix = function () {
            return this.inverseViewMatrix.elements;
        };
        RenderContext.prototype.getModelMatrix = function () {
            return this.modelMatrixElems;
        };
        RenderContext.prototype.setModelTransform = function (model) {
            if (model == null) {
                this.modelMatrixElems = this.identityMatrix.elements;
            }
            else {
                this.modelMatrixElems = model.getMatrixElements();
            }
        };
        RenderContext.prototype.setPvsOrigin = function (pos) {
            this.pvsFollowsCamera = false;
            this.pvsOrigin.set(pos.x, pos.y, pos.z);
        };
        RenderContext.prototype.render = function () {
            this.camera.getPosition(this.origin);
            if (this.pvsFollowsCamera)
                this.pvsOrigin.set(this.origin.x, this.origin.y, this.origin.z);
            this.time = performance.now() * 0.001;
            var persp = this.camera;
            if (persp.getNear !== undefined) {
                this.near = persp.getNear();
                this.far = persp.getFar();
            }
            this.camera.getProjectionMatrix(this.projectionMatrix);
            this.inverseProjectionMatrix.getInverse(this.projectionMatrix);
            this.camera.getMatrix(this.inverseViewMatrix);
            this.camera.getInverseMatrix(this.viewMatrix);
            this.updatePvs();
            if (this.commandBufferInvalid) {
                this.commandBufferInvalid = false;
                this.commandBuffer.clearCommands();
                this.drawList.appendToBuffer(this.commandBuffer, this);
            }
            this.commandBuffer.run(this);
        };
        RenderContext.prototype.setupFrameBuffers = function () {
            if (this.opaqueFrameBuffer !== undefined)
                return;
            var gl = this.map.shaderManager.getContext();
            var app = this.map.getApp();
            var width = app.getWidth();
            var height = app.getHeight();
            this.opaqueFrameBuffer = new SourceUtils.FrameBuffer(gl, width, height);
            this.opaqueFrameBuffer.addDepthAttachment();
        };
        RenderContext.prototype.bufferOpaqueTargetBegin = function (buf) {
            this.setupFrameBuffers();
            var gl = WebGLRenderingContext;
            buf.bindFramebuffer(this.opaqueFrameBuffer, true);
            buf.depthMask(true);
            buf.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        };
        RenderContext.prototype.bufferRenderTargetEnd = function (buf) {
            buf.bindFramebuffer(null);
        };
        RenderContext.prototype.getClusterIndex = function () {
            return this.pvsRoot == null ? -1 : this.pvsRoot.cluster;
        };
        RenderContext.prototype.canSeeSky2D = function () {
            return this.pvsRoot == null || this.pvsRoot.cluster === -1 || this.pvsRoot.canSeeSky2D;
        };
        RenderContext.prototype.canSeeSky3D = function () {
            return this.pvsRoot == null || this.pvsRoot.cluster === -1 || this.pvsRoot.canSeeSky3D;
        };
        RenderContext.prototype.replacePvs = function (pvs) {
            this.drawList.clear();
            this.commandBufferInvalid = true;
            if (pvs != null) {
                this.map.appendToDrawList(this.drawList, pvs);
            }
        };
        RenderContext.prototype.updatePvs = function (force) {
            var _this = this;
            var worldSpawn = this.map.getWorldSpawn();
            if (worldSpawn == null)
                return;
            var root = worldSpawn.findLeaf(this.pvsOrigin);
            if (root === this.pvsRoot && !force)
                return;
            this.pvsRoot = root;
            if (root == null || root.cluster === -1) {
                this.replacePvs(null);
                return;
            }
            this.map.getPvsArray(root, function (pvs) {
                if (_this.pvsRoot != null && _this.pvsRoot === root) {
                    _this.replacePvs(pvs);
                }
            });
        };
        RenderContext.prototype.getDrawCallCount = function () {
            return this.drawList.getDrawCalls();
        };
        RenderContext.prototype.logState = function (writer) {
            writer.beginBlock("origin");
            writer.writeProperty("x", this.origin.x);
            writer.writeProperty("y", this.origin.y);
            writer.writeProperty("z", this.origin.z);
            writer.endBlock();
            writer.writeProperty("cluster", this.getClusterIndex());
            writer.beginBlock("drawList");
            this.drawList.logState(writer);
            writer.endBlock();
        };
        return RenderContext;
    }());
    SourceUtils.RenderContext = RenderContext;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var ShaderManager = (function () {
        function ShaderManager(gl) {
            this.programs = {};
            this.gl = gl;
            this.whiteTexture = new SourceUtils.BlankTexture2D(gl, 1, 1, 1);
            this.blankTexture = new SourceUtils.BlankTexture2D(gl, 0, 0, 0, 0);
            this.blankNormalMap = new SourceUtils.BlankTexture2D(gl, 0.5, 0.5, 1.0);
            this.blankTextureCube = new SourceUtils.BlankTextureCube(gl, 1, 1, 1);
        }
        ShaderManager.prototype.resetUniformCache = function () {
            for (var name_1 in this.programs) {
                if (this.programs.hasOwnProperty(name_1)) {
                    this.programs[name_1].resetUniformCache();
                }
            }
        };
        ShaderManager.prototype.getWhiteTexture = function () {
            return this.whiteTexture;
        };
        ShaderManager.prototype.getBlankTexture = function () {
            return this.blankTexture;
        };
        ShaderManager.prototype.getBlankNormalMap = function () {
            return this.blankNormalMap;
        };
        ShaderManager.prototype.getBlankTextureCube = function () {
            return this.blankTextureCube;
        };
        ShaderManager.prototype.getContext = function () {
            return this.gl;
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
            for (var name_2 in this.programs) {
                if (this.programs.hasOwnProperty(name_2)) {
                    this.programs[name_2].dispose();
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
            this.isSampler = false;
            this.program = program;
            this.name = name;
            this.gl = program.getContext();
        }
        Uniform.prototype.getLocation = function () {
            if (this.location !== undefined)
                return this.location;
            if (!this.program.isCompiled())
                return undefined;
            return this.location = this.gl.getUniformLocation(this.program.getProgram(), this.name);
        };
        Uniform.prototype.reset = function () {
            this.parameter = undefined;
        };
        Uniform.prototype.bufferParameter = function (buf, param) {
            if (this.parameter === param)
                return;
            this.parameter = param;
            buf.setUniformParameter(this, param);
        };
        return Uniform;
    }());
    SourceUtils.Uniform = Uniform;
    var Uniform1F = (function (_super) {
        __extends(Uniform1F, _super);
        function Uniform1F() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Uniform1F.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.x = undefined;
        };
        Uniform1F.prototype.bufferValue = function (buf, x) {
            if (this.x === x)
                return;
            this.x = x;
            buf.setUniform1F(this.getLocation(), x);
        };
        Uniform1F.prototype.set = function (x) {
            this.gl.uniform1f(this.getLocation(), x);
        };
        return Uniform1F;
    }(Uniform));
    SourceUtils.Uniform1F = Uniform1F;
    var Uniform1I = (function (_super) {
        __extends(Uniform1I, _super);
        function Uniform1I() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Uniform1I.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.x = undefined;
        };
        Uniform1I.prototype.bufferValue = function (buf, x) {
            if (this.x === x)
                return;
            this.x = x;
            buf.setUniform1I(this.getLocation(), x);
        };
        Uniform1I.prototype.set = function (x) {
            this.gl.uniform1i(this.getLocation(), x);
        };
        return Uniform1I;
    }(Uniform));
    SourceUtils.Uniform1I = Uniform1I;
    var Uniform2F = (function (_super) {
        __extends(Uniform2F, _super);
        function Uniform2F() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Uniform2F.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.x = undefined;
            this.y = undefined;
        };
        Uniform2F.prototype.bufferValue = function (buf, x, y) {
            if (this.x === x && this.y === y)
                return;
            this.x = x;
            this.y = y;
            buf.setUniform2F(this.getLocation(), x, y);
        };
        Uniform2F.prototype.set = function (x, y) {
            this.gl.uniform2f(this.getLocation(), x, y);
        };
        return Uniform2F;
    }(Uniform));
    SourceUtils.Uniform2F = Uniform2F;
    var Uniform3F = (function (_super) {
        __extends(Uniform3F, _super);
        function Uniform3F() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Uniform3F.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.x = undefined;
            this.y = undefined;
            this.z = undefined;
        };
        Uniform3F.prototype.bufferValue = function (buf, x, y, z) {
            if (this.x === x && this.y === y && this.z === z)
                return;
            this.x = x;
            this.y = y;
            this.z = z;
            buf.setUniform3F(this.getLocation(), x, y, z);
        };
        Uniform3F.prototype.set = function (x, y, z) {
            this.gl.uniform3f(this.getLocation(), x, y, z);
        };
        return Uniform3F;
    }(Uniform));
    SourceUtils.Uniform3F = Uniform3F;
    var Uniform4F = (function (_super) {
        __extends(Uniform4F, _super);
        function Uniform4F() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Uniform4F.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.x = undefined;
            this.y = undefined;
            this.z = undefined;
            this.w = undefined;
        };
        Uniform4F.prototype.bufferValue = function (buf, x, y, z, w) {
            if (this.x === x && this.y === y && this.z === z && this.w === w)
                return;
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            buf.setUniform4F(this.getLocation(), x, y, z, w);
        };
        Uniform4F.prototype.set = function (x, y, z, w) {
            this.gl.uniform4f(this.getLocation(), x, y, z, w);
        };
        return Uniform4F;
    }(Uniform));
    SourceUtils.Uniform4F = Uniform4F;
    var UniformSampler = (function (_super) {
        __extends(UniformSampler, _super);
        function UniformSampler(program, name) {
            var _this = _super.call(this, program, name) || this;
            _this.isSampler = true;
            _this.texUnit = program.reserveNextTextureUnit();
            return _this;
        }
        UniformSampler.prototype.getTexUnit = function () {
            return this.texUnit;
        };
        UniformSampler.prototype.setDefault = function (tex) {
            this.default = tex;
        };
        UniformSampler.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.value = undefined;
        };
        UniformSampler.prototype.bufferValue = function (buf, tex) {
            if (tex == null || !tex.isLoaded()) {
                tex = this.default;
            }
            buf.bindTexture(this.texUnit, tex);
            if (this.value !== this.texUnit) {
                this.value = this.texUnit;
                buf.setUniform1I(this.getLocation(), this.texUnit);
            }
        };
        UniformSampler.prototype.set = function (tex) {
            if (tex == null || !tex.isLoaded()) {
                tex = this.default;
            }
            this.gl.activeTexture(this.gl.TEXTURE0 + this.texUnit);
            this.gl.bindTexture(tex.getTarget(), tex.getHandle());
            this.gl.uniform1i(this.getLocation(), this.texUnit);
        };
        return UniformSampler;
    }(Uniform));
    SourceUtils.UniformSampler = UniformSampler;
    var UniformMatrix4 = (function (_super) {
        __extends(UniformMatrix4, _super);
        function UniformMatrix4() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UniformMatrix4.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.transpose = undefined;
            this.values = undefined;
        };
        UniformMatrix4.prototype.bufferValue = function (buf, transpose, values) {
            if (this.transpose === transpose && this.values === values)
                return;
            this.transpose = transpose;
            this.values = values;
            buf.setUniformMatrix4(this.getLocation(), transpose, values);
        };
        UniformMatrix4.prototype.set = function (transpose, values) {
            this.gl.uniformMatrix4fv(this.getLocation(), transpose, values);
        };
        return UniformMatrix4;
    }(Uniform));
    SourceUtils.UniformMatrix4 = UniformMatrix4;
    var ShaderProgram = (function () {
        function ShaderProgram(manager) {
            this.compiled = false;
            this.nextTextureUnit = 0;
            this.attribNames = {};
            this.attribs = {};
            this.uniforms = [];
            this.sortOrder = 0;
            this.enabledComponents = 0;
            this.manager = manager;
            this.sortIndex = ShaderProgram.nextSortIndex++;
            this.projectionMatrix = this.addUniform(UniformMatrix4, "uProjection");
            this.viewMatrix = this.addUniform(UniformMatrix4, "uView");
            this.modelMatrix = this.addUniform(UniformMatrix4, "uModel");
        }
        ShaderProgram.prototype.reserveNextTextureUnit = function () {
            return this.nextTextureUnit++;
        };
        ShaderProgram.prototype.resetUniformCache = function () {
            for (var i = 0; i < this.uniforms.length; ++i) {
                this.uniforms[i].reset();
            }
        };
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
        ShaderProgram.prototype.bufferAttribPointer = function (buf, component, size, type, normalized, stride, offset) {
            var loc = this.attribs[component];
            if (loc === undefined)
                return;
            buf.vertexAttribPointer(loc, size, type, normalized, stride, offset);
        };
        ShaderProgram.prototype.isCompiled = function () {
            return this.compiled;
        };
        ShaderProgram.prototype.addAttribute = function (name, component) {
            this.attribNames[name] = component;
        };
        ShaderProgram.prototype.addUniform = function (ctor, name) {
            var uniform = new ctor(this, name);
            this.uniforms.push(uniform);
            return uniform;
        };
        ShaderProgram.prototype.getContext = function () {
            return this.manager.getContext();
        };
        ShaderProgram.prototype.getShaderSource = function (url, action) {
            var _this = this;
            $.get(url + "?v=" + Math.random(), function (source) {
                var match = source.match(ShaderProgram.includeRegex);
                if (match == null) {
                    action(source);
                    return;
                }
                var fileName = match[1];
                var dirName = url.substr(0, url.lastIndexOf("/") + 1);
                _this.getShaderSource("" + dirName + fileName, function (include) {
                    action(source.replace(match[0], include));
                });
            });
        };
        ShaderProgram.prototype.loadShaderSource = function (type, url) {
            var _this = this;
            this.getShaderSource(url, function (source) { return _this.onLoadShaderSource(type, source); });
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
                console.log(source);
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
            for (var name_3 in this.attribNames) {
                if (this.attribNames.hasOwnProperty(name_3)) {
                    this.findAttribLocation(name_3, this.attribNames[name_3]);
                }
            }
            this.compiled = true;
        };
        ShaderProgram.prototype.bufferEnableMeshComponents = function (buf, components) {
            var diff = this.enabledComponents ^ components;
            var component = 1;
            while (diff >= component) {
                if ((diff & component) === component) {
                    var attrib = this.attribs[component];
                    if (attrib !== undefined) {
                        if ((components & component) === component)
                            buf.enableVertexAttribArray(attrib);
                        else
                            buf.disableVertexAttribArray(attrib);
                    }
                }
                component <<= 1;
            }
            this.enabledComponents = components;
        };
        ShaderProgram.prototype.bufferDisableMeshComponents = function (buf) {
            this.bufferEnableMeshComponents(buf, 0);
        };
        ShaderProgram.prototype.bufferSetup = function (buf, context) {
            buf.useProgram(this);
            this.projectionMatrix.bufferParameter(buf, SourceUtils.CommandBufferParameter.ProjectionMatrix);
            this.viewMatrix.bufferParameter(buf, SourceUtils.CommandBufferParameter.ViewMatrix);
        };
        ShaderProgram.prototype.bufferModelMatrix = function (buf, value) {
            this.modelMatrix.bufferValue(buf, false, value);
        };
        ShaderProgram.prototype.bufferMaterial = function (buf, material) {
            var gl = this.getContext();
            if (material.properties.noCull) {
                buf.disable(gl.CULL_FACE);
            }
            else {
                buf.enable(gl.CULL_FACE);
            }
        };
        return ShaderProgram;
    }());
    ShaderProgram.nextSortIndex = 0;
    ShaderProgram.includeRegex = /^\s*#include\s+\"([^"]+)\"\s*$/m;
    SourceUtils.ShaderProgram = ShaderProgram;
    var Shaders;
    (function (Shaders) {
        var ComposeFrame = (function (_super) {
            __extends(ComposeFrame, _super);
            function ComposeFrame(manager) {
                var _this = _super.call(this, manager) || this;
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/ComposeFrame.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/ComposeFrame.frag.txt");
                _this.addAttribute("aScreenPos", SourceUtils.Api.MeshComponent.Uv);
                _this.frameColor = _this.addUniform(UniformSampler, "uFrameColor");
                _this.frameDepth = _this.addUniform(UniformSampler, "uFrameDepth");
                return _this;
            }
            ComposeFrame.prototype.bufferSetup = function (buf, context) {
                _super.prototype.bufferSetup.call(this, buf, context);
                this.frameColor.bufferValue(buf, context.getOpaqueColorTexture());
                this.frameDepth.bufferValue(buf, context.getOpaqueDepthTexture());
            };
            return ComposeFrame;
        }(ShaderProgram));
        Shaders.ComposeFrame = ComposeFrame;
        var Base = (function (_super) {
            __extends(Base, _super);
            function Base(manager) {
                var _this = _super.call(this, manager) || this;
                _this.isTranslucent = false;
                _this.addAttribute("aPosition", SourceUtils.Api.MeshComponent.Position);
                _this.addAttribute("aTextureCoord", SourceUtils.Api.MeshComponent.Uv);
                _this.baseTexture = _this.addUniform(UniformSampler, "uBaseTexture");
                _this.baseTexture.setDefault(manager.getWhiteTexture());
                _this.time = _this.addUniform(Uniform4F, "uTime");
                _this.fogParams = _this.addUniform(Uniform4F, "uFogParams");
                _this.fogColor = _this.addUniform(Uniform3F, "uFogColor");
                _this.noFog = _this.addUniform(Uniform1F, "uNoFog");
                return _this;
            }
            Base.prototype.bufferSetup = function (buf, context) {
                _super.prototype.bufferSetup.call(this, buf, context);
                this.time.bufferParameter(buf, SourceUtils.CommandBufferParameter.TimeParams);
                var fog = context.fogParams;
                if (fog != null && fog.fogEnabled) {
                    var densMul = fog.fogMaxDensity / ((fog.fogEnd - fog.fogStart) * (context.far - context.near));
                    var nearDensity = (context.near - fog.fogStart) * densMul;
                    var farDensity = (context.far - fog.fogStart) * densMul;
                    var clrMul = 1 / 255;
                    this.fogParams.bufferValue(buf, nearDensity, farDensity, 0, fog.fogMaxDensity);
                    this.fogColor.bufferValue(buf, fog.fogColor.r * clrMul, fog.fogColor.g * clrMul, fog.fogColor.b * clrMul);
                }
                else {
                    this.fogParams.bufferValue(buf, 0, 0, 0, 0);
                }
                var gl = this.getContext();
                if (this.isTranslucent) {
                    buf.depthMask(false);
                    buf.enable(gl.BLEND);
                    buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }
                else {
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                }
            };
            Base.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.baseTexture.bufferValue(buf, material.properties.baseTexture);
                this.noFog.bufferValue(buf, material.properties.noFog ? 1 : 0);
            };
            return Base;
        }(ShaderProgram));
        Shaders.Base = Base;
        var LightmappedBase = (function (_super) {
            __extends(LightmappedBase, _super);
            function LightmappedBase(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 0;
                _this.addAttribute("aLightmapCoord", SourceUtils.Api.MeshComponent.Uv2);
                _this.lightmap = _this.addUniform(UniformSampler, "uLightmap");
                _this.lightmap.setDefault(manager.getWhiteTexture());
                _this.lightmapParams = _this.addUniform(Uniform4F, "uLightmapParams");
                return _this;
            }
            LightmappedBase.prototype.bufferSetup = function (buf, context) {
                _super.prototype.bufferSetup.call(this, buf, context);
                var lightmap = context.getLightmap();
                this.lightmap.bufferValue(buf, lightmap);
                if (lightmap != null && lightmap.isLoaded()) {
                    this.lightmapParams.bufferValue(buf, lightmap.width, lightmap.height, 1 / lightmap.width, 1 / lightmap.height);
                }
                else {
                    this.lightmapParams.bufferValue(buf, 1, 1, 1, 1);
                }
            };
            return LightmappedBase;
        }(Base));
        Shaders.LightmappedBase = LightmappedBase;
        var LightmappedGeneric = (function (_super) {
            __extends(LightmappedGeneric, _super);
            function LightmappedGeneric(manager) {
                var _this = _super.call(this, manager) || this;
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedGeneric.frag.txt");
                _this.alphaTest = _this.addUniform(Uniform1F, "uAlphaTest");
                return _this;
            }
            LightmappedGeneric.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.alphaTest.bufferValue(buf, material.properties.alphaTest ? 1 : 0);
            };
            return LightmappedGeneric;
        }(LightmappedBase));
        Shaders.LightmappedGeneric = LightmappedGeneric;
        var LightmappedTranslucent = (function (_super) {
            __extends(LightmappedTranslucent, _super);
            function LightmappedTranslucent(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 2000;
                _this.isTranslucent = true;
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/LightmappedGeneric.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/LightmappedTranslucent.frag.txt");
                _this.alpha = _this.addUniform(Uniform1F, "uAlpha");
                return _this;
            }
            LightmappedTranslucent.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.alpha.bufferValue(buf, material.properties.alpha);
            };
            return LightmappedTranslucent;
        }(LightmappedBase));
        Shaders.LightmappedTranslucent = LightmappedTranslucent;
        var Lightmapped2WayBlend = (function (_super) {
            __extends(Lightmapped2WayBlend, _super);
            function Lightmapped2WayBlend(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 100;
                _this.addAttribute("aAlpha", SourceUtils.Api.MeshComponent.Alpha);
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Lightmapped2WayBlend.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Lightmapped2WayBlend.frag.txt");
                _this.baseTexture2 = _this.addUniform(UniformSampler, "uBaseTexture2");
                _this.baseTexture2.setDefault(manager.getWhiteTexture());
                _this.blendModulateTexture = _this.addUniform(UniformSampler, "uBlendModulateTexture");
                _this.blendModulateTexture.setDefault(manager.getWhiteTexture());
                return _this;
            }
            Lightmapped2WayBlend.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.baseTexture2.bufferValue(buf, material.properties.baseTexture2);
                this.blendModulateTexture.bufferValue(buf, material.properties.blendModulateTexture);
            };
            return Lightmapped2WayBlend;
        }(LightmappedBase));
        Shaders.Lightmapped2WayBlend = Lightmapped2WayBlend;
        var UnlitGeneric = (function (_super) {
            __extends(UnlitGeneric, _super);
            function UnlitGeneric(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 200;
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/UnlitGeneric.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/UnlitGeneric.frag.txt");
                _this.alpha = _this.addUniform(Uniform1F, "uAlpha");
                _this.translucent = _this.addUniform(Uniform1F, "uTranslucent");
                _this.alphaTest = _this.addUniform(Uniform1F, "uAlphaTest");
                return _this;
            }
            UnlitGeneric.prototype.bufferSetup = function (buf, context) {
                _super.prototype.bufferSetup.call(this, buf, context);
                this.translucent.bufferValue(buf, this.isTranslucent ? 1 : 0);
            };
            UnlitGeneric.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.alpha.bufferValue(buf, material.properties.alpha);
                this.alphaTest.bufferValue(buf, material.properties.alphaTest ? 1 : 0);
            };
            return UnlitGeneric;
        }(Base));
        Shaders.UnlitGeneric = UnlitGeneric;
        var UnlitTranslucent = (function (_super) {
            __extends(UnlitTranslucent, _super);
            function UnlitTranslucent(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 2200;
                _this.isTranslucent = true;
                return _this;
            }
            return UnlitTranslucent;
        }(UnlitGeneric));
        Shaders.UnlitTranslucent = UnlitTranslucent;
        var VertexLitGeneric = (function (_super) {
            __extends(VertexLitGeneric, _super);
            function VertexLitGeneric(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 400;
                _this.addAttribute("aColorCompressed", SourceUtils.Api.MeshComponent.Rgb);
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/VertexLitGeneric.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/VertexLitGeneric.frag.txt");
                _this.alpha = _this.addUniform(Uniform1F, "uAlpha");
                _this.translucent = _this.addUniform(Uniform1F, "uTranslucent");
                _this.alphaTest = _this.addUniform(Uniform1F, "uAlphaTest");
                _this.tint = _this.addUniform(Uniform1F, "uTint");
                _this.baseAlphaTint = _this.addUniform(Uniform1F, "uBaseAlphaTint");
                return _this;
            }
            VertexLitGeneric.prototype.bufferSetup = function (buf, context) {
                _super.prototype.bufferSetup.call(this, buf, context);
                this.translucent.bufferValue(buf, this.isTranslucent ? 1 : 0);
            };
            VertexLitGeneric.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.alpha.bufferValue(buf, material.properties.alpha);
                this.alphaTest.bufferValue(buf, material.properties.alphaTest ? 1 : 0);
                this.tint.bufferValue(buf, material.properties.noTint ? 0 : 1);
                this.baseAlphaTint.bufferValue(buf, material.properties.baseAlphaTint ? 1 : 0);
            };
            return VertexLitGeneric;
        }(Base));
        Shaders.VertexLitGeneric = VertexLitGeneric;
        var VertexLitTranslucent = (function (_super) {
            __extends(VertexLitTranslucent, _super);
            function VertexLitTranslucent(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 2400;
                _this.isTranslucent = true;
                return _this;
            }
            return VertexLitTranslucent;
        }(VertexLitGeneric));
        Shaders.VertexLitTranslucent = VertexLitTranslucent;
        var Water = (function (_super) {
            __extends(Water, _super);
            function Water(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 1900;
                _this.isTranslucent = true;
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Water.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Water.frag.txt");
                _this.inverseProjection = _this.addUniform(UniformMatrix4, "uInverseProjection");
                _this.inverseView = _this.addUniform(UniformMatrix4, "uInverseView");
                _this.normalMap = _this.addUniform(UniformSampler, "uNormalMap");
                _this.normalMap.setDefault(manager.getBlankNormalMap());
                _this.simpleOverlay = _this.addUniform(UniformSampler, "uSimpleOverlay");
                _this.simpleOverlay.setDefault(manager.getBlankTexture());
                _this.refractColor = _this.addUniform(UniformSampler, "uRefractColor");
                _this.refractDepth = _this.addUniform(UniformSampler, "uRefractDepth");
                _this.screenParams = _this.addUniform(Uniform4F, "uScreenParams");
                _this.clipParams = _this.addUniform(Uniform4F, "uClipParams");
                _this.cameraPos = _this.addUniform(Uniform3F, "uCameraPos");
                _this.waterFogParams = _this.addUniform(Uniform3F, "uWaterFogParams");
                _this.waterFogColor = _this.addUniform(Uniform3F, "uWaterFogColor");
                _this.reflectTint = _this.addUniform(Uniform3F, "uReflectTint");
                _this.refractAmount = _this.addUniform(Uniform1F, "uRefractAmount");
                return _this;
            }
            Water.prototype.bufferSetup = function (buf, context) {
                _super.prototype.bufferSetup.call(this, buf, context);
                this.inverseProjection.bufferParameter(buf, SourceUtils.CommandBufferParameter.InverseProjectionMatrix);
                this.inverseView.bufferParameter(buf, SourceUtils.CommandBufferParameter.InverseViewMatrix);
                this.refractColor.bufferParameter(buf, SourceUtils.CommandBufferParameter.RefractColorMap);
                this.refractDepth.bufferParameter(buf, SourceUtils.CommandBufferParameter.RefractDepthMap);
                this.screenParams.bufferParameter(buf, SourceUtils.CommandBufferParameter.ScreenParams);
                this.clipParams.bufferParameter(buf, SourceUtils.CommandBufferParameter.ClipParams);
                this.cameraPos.bufferParameter(buf, SourceUtils.CommandBufferParameter.CameraPos);
            };
            Water.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.normalMap.bufferValue(buf, material.properties.normalMap);
                this.simpleOverlay.bufferValue(buf, material.properties.simpleOverlay);
                var fogStart = material.properties.fogStart;
                var fogEnd = material.properties.fogEnd;
                var fogColor = material.properties.fogColor;
                var reflectTint = material.properties.reflectTint;
                var clrMul = 1 / 255;
                this.waterFogParams.bufferValue(buf, fogStart, fogEnd, 1 / (fogEnd - fogStart));
                this.waterFogColor.bufferValue(buf, fogColor.r * clrMul, fogColor.g * clrMul, fogColor.b * clrMul);
                this.reflectTint.bufferValue(buf, reflectTint.r * clrMul, reflectTint.g * clrMul, reflectTint.b * clrMul);
                this.refractAmount.bufferValue(buf, material.properties.refractAmount);
            };
            return Water;
        }(LightmappedBase));
        Shaders.Water = Water;
        var Sky = (function (_super) {
            __extends(Sky, _super);
            function Sky(manager) {
                var _this = _super.call(this, manager) || this;
                _this.sortOrder = 1000;
                var gl = _this.getContext();
                _this.loadShaderSource(gl.VERTEX_SHADER, "/shaders/Sky.vert.txt");
                _this.loadShaderSource(gl.FRAGMENT_SHADER, "/shaders/Sky.frag.txt");
                _this.addAttribute("aPosition", SourceUtils.Api.MeshComponent.Position);
                _this.cameraPos = _this.addUniform(Uniform3F, "uCameraPos");
                _this.skyCube = _this.addUniform(UniformSampler, "uSkyCube");
                _this.skyCube.setDefault(manager.getBlankTextureCube());
                return _this;
            }
            Sky.prototype.bufferSetup = function (buf, context) {
                _super.prototype.bufferSetup.call(this, buf, context);
                this.cameraPos.bufferParameter(buf, SourceUtils.CommandBufferParameter.CameraPos);
            };
            Sky.prototype.bufferMaterial = function (buf, material) {
                _super.prototype.bufferMaterial.call(this, buf, material);
                this.skyCube.bufferValue(buf, material.properties.baseTexture);
            };
            return Sky;
        }(ShaderProgram));
        Shaders.Sky = Sky;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var SmdModel = (function () {
        function SmdModel(bodyPart, index, info) {
            this.bodyPart = bodyPart;
            this.index = index;
            this.info = info;
        }
        SmdModel.prototype.hasLoaded = function () {
            return this.meshData != null;
        };
        SmdModel.prototype.createMeshHandles = function (staticParent, vertexColors, albedoRgb) {
            var meshData = new SourceUtils.MeshData(this.meshData);
            var itemSize = 8;
            if (staticParent != null) {
                var transform = new THREE.Matrix4();
                staticParent.getMatrix(transform);
                var position = new THREE.Vector4();
                for (var i = 0; i < meshData.elements.length; ++i) {
                    var offset = meshData.elements[i].vertexOffset;
                    var count = meshData.elements[i].vertexCount;
                    // TODO: make generic
                    var itemOffset = offset * itemSize;
                    var verts = meshData.vertices;
                    for (var j = 0, jEnd = count; j < jEnd; ++j) {
                        var vertStart = j * itemSize + itemOffset;
                        position.x = verts[vertStart + 0];
                        position.y = verts[vertStart + 1];
                        position.z = verts[vertStart + 2];
                        position.w = 1;
                        position.applyMatrix4(transform);
                        verts[vertStart + 0] = position.x;
                        verts[vertStart + 1] = position.y;
                        verts[vertStart + 2] = position.z;
                    }
                }
            }
            if (albedoRgb === undefined) {
                albedoRgb = 0xffffff;
            }
            if (vertexColors != null) {
                for (var i = 0; i < meshData.elements.length; ++i) {
                    var meshColors = SourceUtils.Utils.decompress(vertexColors.getSamples(i));
                    var offset = meshData.elements[i].vertexOffset;
                    var count = meshData.elements[i].vertexCount;
                    var albedoR = (albedoRgb >> 0) & 0xff;
                    var albedoG = (albedoRgb >> 8) & 0xff;
                    var albedoB = (albedoRgb >> 16) & 0xff;
                    if (meshColors != null) {
                        // TODO: make generic
                        var itemOffset = offset * itemSize;
                        var verts = meshData.vertices;
                        for (var j = 0, jEnd = count; j < jEnd; ++j) {
                            var vertStart = j * itemSize + itemOffset;
                            var colorStart = j * 3;
                            verts[vertStart + 5] = meshColors[colorStart + 0] + meshColors[colorStart + 1] / 256;
                            verts[vertStart + 6] = meshColors[colorStart + 2] + albedoR / 256;
                            verts[vertStart + 7] = albedoG + albedoB / 256;
                        }
                    }
                }
            }
            var handles = this.bodyPart.mdl.getMap().meshManager.addMeshData(meshData);
            for (var i = 0; i < handles.length; ++i) {
                handles[i].material = this.bodyPart.mdl.getMaterial(handles[i].materialIndex);
            }
            return handles;
        };
        SmdModel.prototype.loadNext = function (callback) {
            if (this.meshData == null) {
                this.loadMeshData(callback);
            }
            else {
                callback(false);
            }
        };
        SmdModel.prototype.loadMeshData = function (callback) {
            var _this = this;
            $.getJSON(this.info.meshDataUrl, function (data) {
                _this.meshData = data;
                _this.meshData.vertices = SourceUtils.Utils.decompress(_this.meshData.vertices);
                _this.meshData.indices = SourceUtils.Utils.decompress(_this.meshData.indices);
                callback(true);
            }).fail(function () { return callback(false); });
        };
        return SmdModel;
    }());
    SourceUtils.SmdModel = SmdModel;
    var SmdBodyPart = (function () {
        function SmdBodyPart(mdl, index, info) {
            this.name = info.name;
            this.mdl = mdl;
            this.index = index;
            this.models = [];
            for (var i = 0; i < info.models.length; ++i) {
                this.models.push(new SmdModel(this, i, info.models[i]));
            }
        }
        return SmdBodyPart;
    }());
    SourceUtils.SmdBodyPart = SmdBodyPart;
    var StudioModel = (function (_super) {
        __extends(StudioModel, _super);
        function StudioModel(map, url) {
            var _this = _super.call(this) || this;
            _this.loaded = [];
            _this.modelLoadCallbacks = [];
            _this.map = map;
            _this.mdlUrl = url;
            return _this;
        }
        StudioModel.prototype.getMap = function () { return this.map; };
        StudioModel.prototype.hasLoadedModel = function (bodyPart, model) {
            if (this.bodyParts == null)
                return false;
            return this.bodyParts[bodyPart].models[model].hasLoaded();
        };
        StudioModel.prototype.getModel = function (bodyPart, model) {
            return this.bodyParts == null ? null : this.bodyParts[bodyPart].models[model];
        };
        StudioModel.prototype.getMaterial = function (index) {
            return this.materials[index];
        };
        StudioModel.prototype.shouldLoadBefore = function (other) {
            return this.getIsVisible();
        };
        StudioModel.prototype.loadNext = function (callback) {
            var _this = this;
            if (this.info == null) {
                this.loadInfo(callback);
                return;
            }
            if (this.toLoad.length === 0) {
                callback(false);
                return;
            }
            var next = this.toLoad[0];
            next.loadNext(function (requeue2) {
                if (!requeue2) {
                    _this.toLoad.splice(0, 1);
                    if (next.hasLoaded()) {
                        _this.loaded.push(next);
                        _this.dispatchModelLoadEvent(next);
                    }
                }
                callback(_this.toLoad.length > 0);
            });
        };
        StudioModel.prototype.dispatchModelLoadEvent = function (model) {
            for (var i = 0; i < this.modelLoadCallbacks.length; ++i) {
                this.modelLoadCallbacks[i](model);
            }
        };
        StudioModel.prototype.addModelLoadCallback = function (callback) {
            for (var i = 0; i < this.loaded.length; ++i) {
                callback(this.loaded[i]);
            }
            this.modelLoadCallbacks.push(callback);
        };
        StudioModel.prototype.loadInfo = function (callback) {
            var _this = this;
            $.getJSON(this.mdlUrl, function (data) {
                _this.info = data;
                _this.materials = [];
                _this.bodyParts = [];
                _this.toLoad = [];
                for (var i = 0; i < data.materials.length; ++i) {
                    _this.materials.push(data.materials[i] == null ? null : new SourceUtils.Material(_this.map, data.materials[i]));
                }
                for (var i = 0; i < data.bodyParts.length; ++i) {
                    var bodyPart = new SmdBodyPart(_this, i, data.bodyParts[i]);
                    _this.bodyParts.push(bodyPart);
                    for (var j = 0; j < bodyPart.models.length; ++j) {
                        _this.toLoad.push(bodyPart.models[j]);
                    }
                }
                callback(true);
            }).fail(function () { return callback(false); });
        };
        return StudioModel;
    }(SourceUtils.DrawListItemComponent));
    SourceUtils.StudioModel = StudioModel;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var StudioModelLoader = (function (_super) {
        __extends(StudioModelLoader, _super);
        function StudioModelLoader(map) {
            var _this = _super.call(this) || this;
            _this.map = map;
            return _this;
        }
        StudioModelLoader.prototype.onCreateItem = function (url) {
            return new SourceUtils.StudioModel(this.map, url);
        };
        return StudioModelLoader;
    }(SourceUtils.Loader));
    SourceUtils.StudioModelLoader = StudioModelLoader;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var TextureLoader = (function (_super) {
        __extends(TextureLoader, _super);
        function TextureLoader(map, gl) {
            var _this = _super.call(this) || this;
            _this.map = map;
            _this.context = gl;
            return _this;
        }
        TextureLoader.prototype.onCreateItem = function (url) {
            if (url.indexOf(",") !== -1) {
                return new SourceUtils.ValveTextureCube(this.context, url.split(","));
            }
            return new SourceUtils.ValveTexture2D(this.context, url);
        };
        TextureLoader.prototype.onFinishedLoadStep = function (item) {
            if (item.firstTimeLoaded()) {
                this.map.forceDrawListInvalidation(false);
            }
        };
        TextureLoader.prototype.load2D = function (url) {
            return this.load(url);
        };
        TextureLoader.prototype.loadCube = function (urls) {
            if (urls.length !== 6) {
                throw new Error("Expected 6 texture URLs.");
            }
            var joinedUrls = urls.join(",");
            return this.load(joinedUrls);
        };
        return TextureLoader;
    }(SourceUtils.Loader));
    SourceUtils.TextureLoader = TextureLoader;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var VisLeaf = (function (_super) {
        __extends(VisLeaf, _super);
        function VisLeaf(model, info) {
            var _this = _super.call(this, model.map, "l", info.index) || this;
            _this.isLeaf = true;
            var min = info.min;
            var max = info.max;
            _this.parent = model;
            _this.leafIndex = info.index;
            _this.cluster = info.cluster === undefined ? -1 : info.cluster;
            _this.canSeeSky2D = (info.flags & SourceUtils.Api.LeafFlags.Sky2D) !== 0;
            _this.canSeeSky3D = (info.flags & SourceUtils.Api.LeafFlags.Sky) !== 0;
            _this.bounds = new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(max.x, max.y, max.z));
            return _this;
        }
        VisLeaf.prototype.getAllLeaves = function (dstArray) {
            dstArray.push(this);
        };
        return VisLeaf;
    }(SourceUtils.BspDrawListItem));
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
                return new SourceUtils.VisLeaf(model, info);
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
/// <reference path="FormattedWriter.ts"/>
/// <reference path="Entity.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WorldMeshHandle = (function () {
        function WorldMeshHandle(group, drawMode, material, vertexOffset, indexOffset, indexCount) {
            this.group = group;
            this.drawMode = drawMode;
            if (typeof material === "number") {
                this.materialIndex = material;
            }
            else {
                this.material = material;
            }
            this.vertexOffset = vertexOffset;
            this.indexOffset = indexOffset;
            this.indexCount = indexCount;
        }
        WorldMeshHandle.prototype.clone = function (newParent) {
            var copy = new WorldMeshHandle(this.group, this.drawMode, this.material || this.materialIndex, this.vertexOffset, this.indexOffset, this.indexCount);
            copy.parent = newParent;
            return copy;
        };
        WorldMeshHandle.prototype.compareTo = function (other) {
            var sortComp = this.material.drawOrderCompareTo(other.material);
            if (sortComp !== 0)
                return sortComp;
            if (this.parent !== other.parent) {
                return this.parent != null
                    ? this.parent.compareTo(other.parent)
                    : other.parent.compareTo(this.parent);
            }
            var groupComp = this.group.compareTo(other.group);
            if (groupComp !== 0)
                return groupComp;
            var matComp = this.material.compareTo(other.material);
            if (matComp !== 0)
                return matComp;
            return this.indexOffset - other.indexOffset;
        };
        return WorldMeshHandle;
    }());
    SourceUtils.WorldMeshHandle = WorldMeshHandle;
    var WorldMeshGroup = (function () {
        function WorldMeshGroup(gl, components) {
            this.lastSubBufferOffset = 0;
            this.vertCount = 0;
            this.indexCount = 0;
            this.handleCount = 0;
            this.uint32Supported = false;
            this.hasPositions = false;
            this.hasNormals = false;
            this.hasUvs = false;
            this.hasUv2s = false;
            this.hasAlphas = false;
            this.hasRgbs = false;
            this.id = WorldMeshGroup.nextId++;
            this.gl = gl;
            this.vertices = gl.createBuffer();
            this.indices = gl.createBuffer();
            this.components = components;
            this.vertexSize = 0;
            this.uint32Supported = gl.getExtension("OES_element_index_uint") != null;
            if ((components & SourceUtils.Api.MeshComponent.Position) === SourceUtils.Api.MeshComponent.Position) {
                this.hasPositions = true;
                this.positionOffset = this.vertexSize;
                this.vertexSize += 3;
            }
            if ((components & SourceUtils.Api.MeshComponent.Normal) === SourceUtils.Api.MeshComponent.Normal) {
                this.hasNormals = true;
                this.normalOffset = this.vertexSize;
                this.vertexSize += 3;
            }
            if ((components & SourceUtils.Api.MeshComponent.Uv) === SourceUtils.Api.MeshComponent.Uv) {
                this.hasUvs = true;
                this.uvOffset = this.vertexSize;
                this.vertexSize += 2;
            }
            if ((components & SourceUtils.Api.MeshComponent.Uv2) === SourceUtils.Api.MeshComponent.Uv2) {
                this.hasUv2s = true;
                this.uv2Offset = this.vertexSize;
                this.vertexSize += 2;
            }
            if ((components & SourceUtils.Api.MeshComponent.Alpha) === SourceUtils.Api.MeshComponent.Alpha) {
                this.hasAlphas = true;
                this.alphaOffset = this.vertexSize;
                this.vertexSize += 1;
            }
            if ((components & SourceUtils.Api.MeshComponent.Rgb) === SourceUtils.Api.MeshComponent.Rgb) {
                this.hasRgbs = true;
                this.rgbOffset = this.vertexSize;
                this.vertexSize += 3;
            }
            var maxVertsPerSubBuffer = this.uint32Supported ? 2147483648 : 65536;
            this.maxVertLength = 2147483648;
            this.maxSubBufferLength = this.vertexSize * maxVertsPerSubBuffer;
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
        WorldMeshGroup.prototype.canAddMeshData = function (data) {
            return this.components === data.components && this.vertCount + data.vertices.length <= this.maxVertLength &&
                this.indexCount + data.indices.length <= WorldMeshGroup.maxIndices;
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
        WorldMeshGroup.prototype.addMeshData = function (data) {
            if (!this.canAddMeshData(data)) {
                throw new Error("Can't add faces to WorldMeshGroup (would exceed size limit).");
            }
            var gl = this.gl;
            var newVertices = new Float32Array(data.vertices);
            var newIndices = this.uint32Supported ? new Uint32Array(data.indices) : new Uint16Array(data.indices);
            var vertexOffset = this.vertCount;
            var oldVertices = this.vertexData;
            this.vertexData = this.ensureCapacity(this.vertexData, this.vertCount + newVertices.length, function (size) { return new Float32Array(size); });
            var indexOffset = this.indexCount;
            var oldIndices = this.indexData;
            this.indexData = this.ensureCapacity(this.indexData, this.indexCount + newIndices.length, this.uint32Supported ? function (size) { return new Uint32Array(size); } : function (size) { return new Uint16Array(size); });
            this.vertexData.set(newVertices, vertexOffset);
            this.vertCount += newVertices.length;
            if (this.vertCount - this.lastSubBufferOffset * this.vertexSize > this.maxSubBufferLength) {
                this.lastSubBufferOffset = Math.round(vertexOffset / this.vertexSize);
            }
            var elementOffset = Math.round(vertexOffset / this.vertexSize) - this.lastSubBufferOffset;
            for (var i = 0, iEnd = newIndices.length; i < iEnd; ++i) {
                newIndices[i] += elementOffset;
            }
            this.indexData.set(newIndices, indexOffset);
            this.indexCount += newIndices.length;
            this.updateBuffer(gl.ARRAY_BUFFER, this.vertices, this.vertexData, newVertices, oldVertices, vertexOffset);
            this.updateBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.indexData, newIndices, oldIndices, indexOffset);
            var handles = new Array(data.elements.length);
            for (var i = 0; i < data.elements.length; ++i) {
                var element = data.elements[i];
                handles[i] = new WorldMeshHandle(this, this.getDrawMode(element.type), element.material, this.lastSubBufferOffset, element.indexOffset + indexOffset, element.indexCount);
                ++this.handleCount;
            }
            return handles;
        };
        WorldMeshGroup.prototype.bufferBindBuffers = function (buf, program) {
            var gl = this.gl;
            buf.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
            buf.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
            program.bufferEnableMeshComponents(buf, this.components);
        };
        WorldMeshGroup.prototype.bufferAttribPointers = function (buf, program, vertexOffset) {
            var gl = this.gl;
            var stride = this.vertexSize * 4;
            var baseOffset = vertexOffset * stride;
            program.bufferAttribPointer(buf, SourceUtils.Api.MeshComponent.Position, 3, gl.FLOAT, false, stride, baseOffset + this.positionOffset * 4);
            program.bufferAttribPointer(buf, SourceUtils.Api.MeshComponent.Uv, 2, gl.FLOAT, false, stride, baseOffset + this.uvOffset * 4);
            program.bufferAttribPointer(buf, SourceUtils.Api.MeshComponent.Uv2, 2, gl.FLOAT, false, stride, baseOffset + this.uv2Offset * 4);
            program.bufferAttribPointer(buf, SourceUtils.Api.MeshComponent.Alpha, 1, gl.FLOAT, false, stride, baseOffset + this.alphaOffset * 4);
            program.bufferAttribPointer(buf, SourceUtils.Api.MeshComponent.Rgb, 3, gl.FLOAT, false, stride, baseOffset + this.rgbOffset * 4);
        };
        WorldMeshGroup.prototype.bufferRenderElements = function (buf, mode, offset, count) {
            buf.drawElements(mode, count, this.uint32Supported ? this.gl.UNSIGNED_INT : this.gl.UNSIGNED_SHORT, offset * this.indexData.BYTES_PER_ELEMENT, this.indexData.BYTES_PER_ELEMENT);
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
        WorldMeshGroup.prototype.logState = function (writer) {
            writer.writeProperty("components", this.components);
            writer.writeProperty("handleCount", this.handleCount);
            writer.writeProperty("vertexSize", this.vertexSize);
            writer.writeProperty("vertexCount", this.vertCount / this.vertexSize);
            writer.writeProperty("indexCount", this.indexCount);
        };
        return WorldMeshGroup;
    }());
    WorldMeshGroup.maxIndices = 2147483648;
    WorldMeshGroup.nextId = 1;
    SourceUtils.WorldMeshGroup = WorldMeshGroup;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="WorldMeshGroup.ts"/>
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
        WorldMeshManager.prototype.addMeshData = function (data) {
            for (var i = 0; i < this.groups.length; ++i) {
                if (this.groups[i].canAddMeshData(data))
                    return this.groups[i].addMeshData(data);
            }
            var newGroup = new SourceUtils.WorldMeshGroup(this.gl, data.components);
            var result = newGroup.addMeshData(data);
            this.groups.push(newGroup);
            return result;
        };
        WorldMeshManager.prototype.dispose = function () {
            for (var i = 0; i < this.groups.length; ++i) {
                this.groups[i].dispose();
            }
            this.groups = [];
        };
        WorldMeshManager.prototype.logState = function (writer) {
            writer.writeProperty("groupCount", this.groups.length);
            for (var i = 0; i < this.groups.length; ++i) {
                writer.beginBlock("groups[" + i + "]");
                this.groups[i].logState(writer);
                writer.endBlock();
            }
        };
        return WorldMeshManager;
    }());
    SourceUtils.WorldMeshManager = WorldMeshManager;
})(SourceUtils || (SourceUtils = {}));
