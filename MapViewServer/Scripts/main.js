var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/threejs/three.d.ts" />
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
            this.previousTime = 0;
            this.mouseScreenPos = new THREE.Vector2();
            this.dragStartScreenPos = new THREE.Vector2();
            this.heldKeys = new Array(128);
            this.heldMouseButtons = new Array(8);
        }
        AppBase.prototype.init = function (container) {
            var _this = this;
            this.container = container;
            this.scene = new THREE.Scene();
            this.camera = this.camera || new THREE.OrthographicCamera(-1, 1, -1, 1, -1, 1);
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
                return false;
            });
            $(window).mouseup(function (e) {
                _this.heldMouseButtons[e.which] = false;
                _this.onMouseUp(e.which, _this.getScreenPos(e.pageX, e.pageY, _this.mouseScreenPos));
            });
            $(window).mousemove(function (e) { return _this.onMouseMove(_this.getScreenPos(e.pageX, e.pageY, _this.mouseScreenPos)); });
            $(window).keydown(function (e) {
                if (e.which < 0 || e.which >= 128)
                    return true;
                _this.heldKeys[e.which] = true;
                _this.onKeyDown(e.which);
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
        AppBase.prototype.getWidth = function () {
            return this.container.innerWidth();
        };
        AppBase.prototype.getHeight = function () {
            return this.container.innerHeight();
        };
        AppBase.prototype.getScene = function () { return this.scene; };
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
/// <reference path="typings/lz-string/lz-string.d.ts"/>
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
            var directionalA = new THREE.DirectionalLight(0xFDF4D9);
            directionalA.position.set(3, -5, 7);
            this.getScene().add(directionalA);
            var directionalB = new THREE.DirectionalLight(0x7EABCF, 0.25);
            directionalB.position.set(-4, 6, -1);
            this.getScene().add(directionalB);
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
        ModelViewer.prototype.decompressFloat32Array = function (base64) {
            var str = LZString.decompressFromBase64(base64);
            return new Float32Array(JSON.parse(str));
        };
        ModelViewer.prototype.decompressUint32Array = function (base64) {
            var str = LZString.decompressFromBase64(base64);
            return new Uint32Array(JSON.parse(str));
        };
        ModelViewer.prototype.loadVtf = function (url, action) {
            var _this = this;
            $.getJSON(url, function (vtf, status) {
                _this.texLoader.load(vtf.png.replace("{mipmap}", "0"), function (tex) {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    action(tex);
                });
            });
        };
        ModelViewer.prototype.onLoadVmt = function (index, vmt, status) {
            var shader = vmt.shaders[0];
            if (shader == null)
                return;
            var mat = new THREE[shader.material]({ side: THREE.BackSide });
            for (var key in shader.properties) {
                if (!shader.properties.hasOwnProperty(key))
                    continue;
                var value = shader.properties[key];
                switch (key) {
                    case "map":
                        this.loadVtf(value, function (tex) {
                            mat.map = tex;
                            mat.needsUpdate = true;
                        });
                        break;
                    case "bumpMap":
                        this.loadVtf(value, function (tex) {
                            mat.bumpMap = tex;
                            mat.needsUpdate = true;
                        });
                        break;
                    case "specularMap":
                        this.loadVtf(value, function (tex) {
                            mat.specularMap = tex;
                            mat.needsUpdate = true;
                        });
                        break;
                }
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
            this.geometry.addAttribute("position", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.vertices), 3));
            this.geometry.addAttribute("normal", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.normals), 3, true));
            this.geometry.addAttribute("uv", new THREE.BufferAttribute(this.decompressFloat32Array(this.vvd.texcoords), 2));
            this.geometry.setIndex(new THREE.BufferAttribute(this.decompressUint32Array(this.vtx.triangles), 1));
            for (var i = 0; i < this.vtx.meshes.length; ++i) {
                var mesh = this.vtx.meshes[i];
                this.geometry.addGroup(mesh.start, mesh.length, mesh.materialIndex);
            }
        };
        ModelViewer.prototype.onRenderFrame = function (dt) {
            this.cameraAngle += dt;
            var radius = this.hullSize.length();
            this.mesh.rotation.set(0, 0, this.cameraAngle * 0.25);
            this.camera.position.set(Math.cos(this.cameraAngle) * radius, Math.sin(this.cameraAngle) * radius, 0.5 * radius);
            this.camera.position.add(this.hullCenter);
            this.camera.lookAt(this.hullCenter);
            _super.prototype.onRenderFrame.call(this, dt);
        };
        return ModelViewer;
    }(SourceUtils.AppBase));
    SourceUtils.ModelViewer = ModelViewer;
})(SourceUtils || (SourceUtils = {}));
