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
/// <reference path="../js/facepunch.webgame.d.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var MapViewer = (function (_super) {
        __extends(MapViewer, _super);
        function MapViewer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.time = 0;
            _this.lookAngs = new Facepunch.Vector2();
            _this.tempQuat = new Facepunch.Quaternion();
            _this.lookQuat = new Facepunch.Quaternion();
            _this.move = new Facepunch.Vector3();
            return _this;
        }
        MapViewer.prototype.onInitialize = function () {
            _super.prototype.onInitialize.call(this);
            this.canLockPointer = true;
            this.mainCamera = new WebGame.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 1, 8192);
            this.mainRenderContext = new WebGame.RenderContext(this);
            var gl = this.context;
            gl.clearColor(0.675, 0.75, 0.5, 1.0);
        };
        MapViewer.prototype.onResize = function () {
            _super.prototype.onResize.call(this);
            this.mainCamera.setAspect(this.getWidth() / this.getHeight());
        };
        MapViewer.prototype.updateCameraAngles = function () {
            if (this.lookAngs.y < -Math.PI * 0.5)
                this.lookAngs.y = -Math.PI * 0.5;
            if (this.lookAngs.y > Math.PI * 0.5)
                this.lookAngs.y = Math.PI * 0.5;
            this.lookQuat.setAxisAngle(Facepunch.Vector3.unitZ, this.lookAngs.x);
            this.tempQuat.setAxisAngle(Facepunch.Vector3.unitX, this.lookAngs.y + Math.PI * 0.5);
            this.lookQuat.multiply(this.tempQuat);
            this.mainCamera.setRotation(this.lookQuat);
        };
        MapViewer.prototype.onMouseLook = function (delta) {
            _super.prototype.onMouseLook.call(this, delta);
            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.updateCameraAngles();
        };
        MapViewer.prototype.onUpdateFrame = function (dt) {
            _super.prototype.onUpdateFrame.call(this, dt);
            if (this.isPointerLocked()) {
                this.move.set(0, 0, 0);
                var moveSpeed = 512 * dt;
                if (this.isKeyDown(WebGame.Key.W))
                    this.move.z -= moveSpeed;
                if (this.isKeyDown(WebGame.Key.S))
                    this.move.z += moveSpeed;
                if (this.isKeyDown(WebGame.Key.A))
                    this.move.x -= moveSpeed;
                if (this.isKeyDown(WebGame.Key.D))
                    this.move.x += moveSpeed;
                if (this.move.lengthSq() > 0) {
                    this.mainCamera.applyRotationTo(this.move);
                    this.mainCamera.translate(this.move);
                }
            }
            else {
                this.time += dt;
                var ang = this.time * Math.PI / 15;
                var height = Math.sin(this.time * Math.PI / 4) * 96 + 256;
                var radius = 512;
                this.lookAngs.set(ang, Math.atan2(128 - height, radius));
                this.updateCameraAngles();
                this.mainCamera.setPosition(Math.sin(-ang) * -radius, Math.cos(-ang) * -radius, height);
            }
        };
        MapViewer.prototype.onRenderFrame = function (dt) {
            _super.prototype.onRenderFrame.call(this, dt);
            var gl = this.context;
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            gl.cullFace(gl.FRONT);
            this.mainRenderContext.render(this.mainCamera);
        };
        MapViewer.prototype.populateDrawList = function (drawList, camera) {
        };
        return MapViewer;
    }(WebGame.Game));
    SourceUtils.MapViewer = MapViewer;
})(SourceUtils || (SourceUtils = {}));
//# sourceMappingURL=sourceutils.js.map