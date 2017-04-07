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
    var WebGame = Facepunch.WebGame;
    var LeafFlags;
    (function (LeafFlags) {
        LeafFlags[LeafFlags["Sky"] = 1] = "Sky";
        LeafFlags[LeafFlags["Radial"] = 2] = "Radial";
        LeafFlags[LeafFlags["Sky2D"] = 4] = "Sky2D";
    })(LeafFlags = SourceUtils.LeafFlags || (SourceUtils.LeafFlags = {}));
    var Plane = (function () {
        function Plane() {
            this.norm = new Facepunch.Vector3();
            this.dist = 0;
        }
        Plane.prototype.copy = function (plane) {
            this.norm.copy(plane.norm);
            this.dist = plane.dist;
            return this;
        };
        return Plane;
    }());
    SourceUtils.Plane = Plane;
    var BspNode = (function () {
        function BspNode(loader, info) {
            this.isLeaf = false;
            this.plane = new Plane();
            this.children = new Array(2);
            this.loader = loader;
            this.plane.copy(info.plane);
            this.children[0] = this.loadChild(info.children[0]);
            this.children[1] = this.loadChild(info.children[1]);
        }
        BspNode.prototype.loadChild = function (value) {
            var node = value;
            if (node.children !== undefined) {
                return new BspNode(this.loader, node);
            }
            var leaf = value;
            return new BspLeaf(this.loader, leaf);
        };
        BspNode.prototype.findLeaves = function (target) {
            this.children[0].findLeaves(target);
            this.children[1].findLeaves(target);
        };
        return BspNode;
    }());
    SourceUtils.BspNode = BspNode;
    var BspLeaf = (function (_super) {
        __extends(BspLeaf, _super);
        function BspLeaf(loader, info) {
            var _this = _super.call(this) || this;
            _this.isLeaf = true;
            _this.loader = loader;
            _this.index = info.index;
            _this.flags = info.flags;
            _this.cluster = info.cluster;
            _this.hasFaces = info.hasFaces;
            return _this;
        }
        BspLeaf.prototype.getMeshHandles = function () {
            var _this = this;
            if (!this.hasFaces)
                return null;
            if (!this.hasLoaded) {
                this.hasLoaded = true;
                this.loader.load(this.index, function (handles) { return _this.addMeshHandles(handles); });
            }
            return _super.prototype.getMeshHandles.call(this);
        };
        BspLeaf.prototype.findLeaves = function (target) {
            if (this.hasFaces)
                target.push(this);
        };
        return BspLeaf;
    }(WebGame.DrawListItem));
    SourceUtils.BspLeaf = BspLeaf;
    var BspModel = (function (_super) {
        __extends(BspModel, _super);
        function BspModel(map, url) {
            var _this = _super.call(this) || this;
            _this.map = map;
            _this.url = url;
            return _this;
        }
        BspModel.prototype.loadNext = function (callback) {
            var _this = this;
            if (this.info == null) {
                Facepunch.Http.getJson(this.url, function (info) {
                    _this.onLoad(info);
                    callback(false);
                }, function (error) {
                    console.warn(error);
                    callback(false);
                });
                return;
            }
        };
        BspModel.prototype.getLeafAt = function (pos) {
            if (this.headNode == null)
                return null;
            var elem = this.headNode;
            while (!elem.isLeaf) {
                var node = elem;
                var index = node.plane.norm.dot(pos) >= node.plane.dist ? 0 : 1;
                elem = node.children[index];
            }
            return elem.isLeaf ? elem : null;
        };
        BspModel.prototype.getLeaves = function () {
            return this.leaves;
        };
        BspModel.prototype.onLoad = function (info) {
            this.info = info;
            this.headNode = new BspNode(this.map.viewer.leafGeometryLoader, info.headNode);
            this.leaves = [];
            this.headNode.findLeaves(this.leaves);
            this.dispatchOnLoadCallbacks();
        };
        BspModel.prototype.isLoaded = function () {
            return this.info != null;
        };
        return BspModel;
    }(WebGame.RenderResource));
    SourceUtils.BspModel = BspModel;
    var BspModelLoader = (function (_super) {
        __extends(BspModelLoader, _super);
        function BspModelLoader(viewer) {
            var _this = _super.call(this) || this;
            _this.viewer = viewer;
            return _this;
        }
        BspModelLoader.prototype.onCreateItem = function (url) {
            return new BspModel(this.viewer.map, url);
        };
        return BspModelLoader;
    }(Facepunch.Loader));
    SourceUtils.BspModelLoader = BspModelLoader;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var ResourcePage = (function () {
        function ResourcePage(info) {
            this.toLoad = [];
            this.first = info.first;
            this.count = info.count;
            this.url = info.url;
            this.values = new Array(info.count);
        }
        ResourcePage.prototype.getLoadPriority = function () {
            return this.toLoad.length;
        };
        ResourcePage.prototype.getValue = function (index) {
            index -= this.first;
            var value = this.values[index];
            if (value === undefined) {
                this.values[index] = value = this.onGetValue(index);
            }
            return value;
        };
        ResourcePage.prototype.load = function (index, callback) {
            if (this.page != null) {
                var value = this.getValue(index);
                callback(value);
                return value;
            }
            this.toLoad.push({ index: index, callback: callback });
        };
        ResourcePage.prototype.onLoadValues = function (page) {
            this.page = page;
            for (var i = 0, iEnd = this.toLoad.length; i < iEnd; ++i) {
                var request = this.toLoad[i];
                request.callback(this.getValue(request.index));
            }
            this.toLoad = null;
        };
        return ResourcePage;
    }());
    SourceUtils.ResourcePage = ResourcePage;
    var PagedLoader = (function () {
        function PagedLoader() {
            this.toLoad = [];
            this.active = 0;
        }
        PagedLoader.prototype.load = function (index, callback) {
            if (this.pages == null) {
                throw new Error("Page layout not loaded.");
            }
            for (var i = 0, iEnd = this.pages.length; i < iEnd; ++i) {
                var page = this.pages[i];
                if (index >= page.first && index < page.first + page.count) {
                    return page.load(index, callback);
                }
            }
            throw new Error("Unable to find page for index " + index + ".");
        };
        PagedLoader.prototype.setPageLayout = function (pages) {
            if (this.pages != null) {
                throw new Error("Changing page layout not implemented.");
            }
            this.pages = new Array(pages.length);
            for (var i = 0, iEnd = pages.length; i < iEnd; ++i) {
                this.pages[i] = this.onCreatePage(pages[i]);
                this.toLoad.push(this.pages[i]);
            }
        };
        PagedLoader.prototype.getNextToLoad = function () {
            var bestScore = 0;
            var bestIndex = -1;
            for (var i = 0; i < this.toLoad.length; ++i) {
                var page = this.toLoad[i];
                var score = page.getLoadPriority();
                if (score > bestScore) {
                    bestIndex = i;
                    bestScore = score;
                }
            }
            if (bestIndex === -1)
                return null;
            return this.toLoad.splice(bestIndex, 1)[0];
        };
        PagedLoader.prototype.update = function (requestQuota) {
            var _this = this;
            var _loop_1 = function () {
                var next = this_1.getNextToLoad();
                if (next == null)
                    return "break";
                ++this_1.active;
                Facepunch.Http.getJson(next.url, function (page) {
                    --_this.active;
                    next.onLoadValues(page);
                }, function (error) {
                    --_this.active;
                    console.warn(error);
                });
            };
            var this_1 = this;
            while (this.active < requestQuota) {
                var state_1 = _loop_1();
                if (state_1 === "break")
                    break;
            }
            return this.active;
        };
        return PagedLoader;
    }());
    SourceUtils.PagedLoader = PagedLoader;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="PagedLoader.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var DispGeometryPage = (function (_super) {
        __extends(DispGeometryPage, _super);
        function DispGeometryPage(viewer, page) {
            var _this = _super.call(this, page) || this;
            _this.viewer = viewer;
            return _this;
        }
        DispGeometryPage.prototype.onLoadValues = function (page) {
            this.matGroups = new Array(page.materials.length);
            this.dispFaces = page.displacements;
            var _loop_2 = function (i, iEnd) {
                var matGroup = page.materials[i];
                var mat = this_2.viewer.mapMaterialLoader.loadMaterial(matGroup.material);
                var data = WebGame.MeshManager.decompress(matGroup.meshData);
                this_2.matGroups[i] = this_2.viewer.meshes.addMeshData(data, function (index) { return mat; });
            };
            var this_2 = this;
            for (var i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
                _loop_2(i, iEnd);
            }
            _super.prototype.onLoadValues.call(this, page);
        };
        DispGeometryPage.prototype.onGetValue = function (index) {
            var dispFace = this.dispFaces[index];
            return this.matGroups[dispFace.material][dispFace.element];
        };
        return DispGeometryPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.DispGeometryPage = DispGeometryPage;
    var DispGeometryLoader = (function (_super) {
        __extends(DispGeometryLoader, _super);
        function DispGeometryLoader(viewer) {
            var _this = _super.call(this) || this;
            _this.viewer = viewer;
            return _this;
        }
        DispGeometryLoader.prototype.onCreatePage = function (page) {
            return new DispGeometryPage(this.viewer, page);
        };
        return DispGeometryLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.DispGeometryLoader = DispGeometryLoader;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="PagedLoader.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var LeafGeometryPage = (function (_super) {
        __extends(LeafGeometryPage, _super);
        function LeafGeometryPage(viewer, page) {
            var _this = _super.call(this, page) || this;
            _this.viewer = viewer;
            return _this;
        }
        LeafGeometryPage.prototype.onLoadValues = function (page) {
            this.matGroups = new Array(page.materials.length);
            this.leafFaces = page.leaves;
            var _loop_3 = function (i, iEnd) {
                var matGroup = page.materials[i];
                var mat = this_3.viewer.mapMaterialLoader.loadMaterial(matGroup.material);
                var data = WebGame.MeshManager.decompress(matGroup.meshData);
                this_3.matGroups[i] = this_3.viewer.meshes.addMeshData(data, function (index) { return mat; });
            };
            var this_3 = this;
            for (var i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
                _loop_3(i, iEnd);
            }
            _super.prototype.onLoadValues.call(this, page);
        };
        LeafGeometryPage.prototype.onGetValue = function (index) {
            var leafFaces = this.leafFaces[index];
            var handles = new Array(leafFaces.length);
            for (var i = 0, iEnd = leafFaces.length; i < iEnd; ++i) {
                var leafFace = leafFaces[i];
                handles[i] = this.matGroups[leafFace.material][leafFace.element];
            }
            return handles;
        };
        return LeafGeometryPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.LeafGeometryPage = LeafGeometryPage;
    var LeafGeometryLoader = (function (_super) {
        __extends(LeafGeometryLoader, _super);
        function LeafGeometryLoader(viewer) {
            var _this = _super.call(this) || this;
            _this.viewer = viewer;
            return _this;
        }
        LeafGeometryLoader.prototype.onCreatePage = function (page) {
            return new LeafGeometryPage(this.viewer, page);
        };
        return LeafGeometryLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.LeafGeometryLoader = LeafGeometryLoader;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="../js/facepunch.webgame.d.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Map = (function () {
        function Map(viewer) {
            this.clusterVis = {};
            this.lightmapInfoValues = new Float32Array(4);
            this.viewer = viewer;
        }
        Map.prototype.unload = function () {
            throw new Error("Map unloading not implemented.");
        };
        Map.prototype.load = function (url) {
            var _this = this;
            Facepunch.Http.getJson(url, function (info) {
                _this.onLoad(info);
            });
        };
        Map.prototype.onLoad = function (info) {
            if (this.info != null)
                this.unload();
            this.info = info;
            this.viewer.leafGeometryLoader.setPageLayout(info.leafPages);
            this.viewer.dispGeometryLoader.setPageLayout(info.dispPages);
            this.viewer.mapMaterialLoader.setPageLayout(info.materialPages);
            this.viewer.visLoader.setPageLayout(info.visPages);
            this.lightmap = this.viewer.textureLoader.load(info.lightmapUrl);
            this.pvsEntities = [];
            for (var i = 0, iEnd = info.entities.length; i < iEnd; ++i) {
                var ent = info.entities[i];
                var pvsInst = null;
                switch (ent.classname) {
                    case "worldspawn":
                        this.worldspawn = pvsInst = new SourceUtils.Entities.Worldspawn(this, ent);
                        this.lightmap.addUsage(this.worldspawn);
                        break;
                    case "displacement":
                        pvsInst = new SourceUtils.Entities.Displacement(this, ent);
                        break;
                    case "func_brush":
                        pvsInst = new SourceUtils.Entities.BrushEntity(this, ent);
                        break;
                    case "sky_camera":
                        this.skyCamera = new SourceUtils.Entities.SkyCamera(this.viewer, ent);
                        break;
                }
                if (pvsInst != null) {
                    this.pvsEntities.push(pvsInst);
                }
            }
            this.viewer.forceDrawListInvalidation(true);
        };
        Map.prototype.getLeafAt = function (pos) {
            if (this.worldspawn == null || this.worldspawn.model == null)
                return null;
            return this.worldspawn.model.getLeafAt(pos);
        };
        Map.prototype.populateDrawList = function (drawList, pvsRoot) {
            var _this = this;
            if (this.worldspawn == null)
                return;
            var vis = null;
            if (this.worldspawn.model != null && pvsRoot != null && pvsRoot.cluster !== undefined) {
                var cluster_1 = pvsRoot.cluster;
                vis = this.clusterVis[cluster_1];
                if (vis === undefined) {
                    var immediate_1 = true;
                    this.viewer.visLoader.load(cluster_1, function (loaded) {
                        _this.clusterVis[cluster_1] = vis = loaded;
                        if (!immediate_1)
                            _this.viewer.forceDrawListInvalidation(true);
                    });
                    immediate_1 = false;
                    if (vis === undefined) {
                        this.clusterVis[cluster_1] = vis = null;
                    }
                }
            }
            for (var i = 0, iEnd = this.pvsEntities.length; i < iEnd; ++i) {
                this.pvsEntities[i].populateDrawList(drawList, vis);
            }
        };
        Map.prototype.populateCommandBufferParameters = function (buf) {
            var lightmap = this.lightmap != null && this.lightmap.isLoaded()
                ? this.lightmap
                : WebGame.TextureUtils.getWhiteTexture(this.viewer.context);
            buf.setParameter(Map.lightmapParam, lightmap);
            this.lightmapInfoValues[0] = lightmap.getWidth(0);
            this.lightmapInfoValues[1] = lightmap.getHeight(0);
            this.lightmapInfoValues[2] = 1 / this.lightmapInfoValues[0];
            this.lightmapInfoValues[3] = 1 / this.lightmapInfoValues[1];
            buf.setParameter(Map.lightmapInfoParam, this.lightmapInfoValues);
        };
        return Map;
    }());
    Map.lightmapParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Texture);
    Map.lightmapInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
    SourceUtils.Map = Map;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="PagedLoader.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var MapMaterialPage = (function (_super) {
        __extends(MapMaterialPage, _super);
        function MapMaterialPage(viewer, page) {
            var _this = _super.call(this, page) || this;
            _this.viewer = viewer;
            return _this;
        }
        MapMaterialPage.prototype.onLoadValues = function (page) {
            this.materials = page.materials;
            var textures = page.textures;
            for (var i = 0, iEnd = this.materials.length; i < iEnd; ++i) {
                var mat = this.materials[i];
                if (mat == null)
                    continue;
                var props = mat.properties;
                for (var j = 0, jEnd = props.length; j < jEnd; ++j) {
                    var prop = props[j];
                    if (prop.type !== WebGame.MaterialPropertyType.TextureIndex)
                        continue;
                    prop.type = WebGame.MaterialPropertyType.TextureInfo;
                    prop.value = textures[prop.value];
                }
            }
            _super.prototype.onLoadValues.call(this, page);
        };
        MapMaterialPage.prototype.onGetValue = function (index) {
            return this.materials[index];
        };
        return MapMaterialPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.MapMaterialPage = MapMaterialPage;
    var MapMaterialLoader = (function (_super) {
        __extends(MapMaterialLoader, _super);
        function MapMaterialLoader(viewer) {
            var _this = _super.call(this) || this;
            _this.materials = {};
            _this.viewer = viewer;
            return _this;
        }
        MapMaterialLoader.prototype.loadMaterial = function (index) {
            var material = this.materials[index];
            if (material !== undefined)
                return material;
            this.materials[index] = material = new WebGame.MaterialLoadable(this.viewer);
            this.load(index, function (info) { return material.loadFromInfo(info); });
            return material;
        };
        MapMaterialLoader.prototype.onCreatePage = function (page) {
            return new MapMaterialPage(this.viewer, page);
        };
        return MapMaterialLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.MapMaterialLoader = MapMaterialLoader;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="../js/facepunch.webgame.d.ts"/>
/// <reference path="../js/jquery.d.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var MapViewer = (function (_super) {
        __extends(MapViewer, _super);
        function MapViewer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.map = new SourceUtils.Map(_this);
            _this.leafGeometryLoader = _this.addLoader(new SourceUtils.LeafGeometryLoader(_this));
            _this.dispGeometryLoader = _this.addLoader(new SourceUtils.DispGeometryLoader(_this));
            _this.mapMaterialLoader = _this.addLoader(new SourceUtils.MapMaterialLoader(_this));
            _this.bspModelLoader = _this.addLoader(new SourceUtils.BspModelLoader(_this));
            _this.visLoader = _this.addLoader(new SourceUtils.VisLoader());
            _this.time = 0;
            _this.frameCount = 0;
            _this.lookAngs = new Facepunch.Vector2();
            _this.tempQuat = new Facepunch.Quaternion();
            _this.lookQuat = new Facepunch.Quaternion();
            _this.move = new Facepunch.Vector3();
            return _this;
        }
        MapViewer.prototype.loadMap = function (url) {
            this.map.load(url);
        };
        MapViewer.prototype.onInitialize = function () {
            this.canLockPointer = true;
            this.mainCamera = new SourceUtils.Entities.Camera(this, 75);
            this.lastProfileTime = performance.now();
            _super.prototype.onInitialize.call(this);
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
        MapViewer.prototype.toggleFullscreen = function () {
            var container = this.container;
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
        MapViewer.prototype.onKeyDown = function (key) {
            _super.prototype.onKeyDown.call(this, key);
            if (key === WebGame.Key.F) {
                this.toggleFullscreen();
            }
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
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.cullFace(gl.FRONT);
            this.mainCamera.render();
            var drawCalls = this.mainCamera.getDrawCalls();
            if (drawCalls !== this.lastDrawCalls) {
                this.lastDrawCalls = drawCalls;
                $("#debug-drawcalls").text(drawCalls);
            }
            ++this.frameCount;
            var time = performance.now();
            if (time - this.lastProfileTime >= 500) {
                var timeDiff = (time - this.lastProfileTime) / 1000;
                var frameTime = (timeDiff * 1000 / this.frameCount).toPrecision(4);
                var frameRate = (this.frameCount / timeDiff).toPrecision(4);
                $("#debug-frametime").text(frameTime);
                $("#debug-framerate").text(frameRate);
                this.lastProfileTime = time;
                this.frameCount = 0;
            }
        };
        MapViewer.prototype.populateDrawList = function (drawList, camera) {
            var leaf = null;
            if (camera.getLeaf !== undefined) {
                leaf = camera.getLeaf();
            }
            this.map.populateDrawList(drawList, leaf);
        };
        MapViewer.prototype.populateCommandBufferParameters = function (buf) {
            _super.prototype.populateCommandBufferParameters.call(this, buf);
            this.map.populateCommandBufferParameters(buf);
        };
        return MapViewer;
    }(WebGame.Game));
    SourceUtils.MapViewer = MapViewer;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var VisPage = (function (_super) {
        __extends(VisPage, _super);
        function VisPage() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VisPage.prototype.onGetValue = function (index) {
            return this.page.values[index];
        };
        return VisPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.VisPage = VisPage;
    var VisLoader = (function (_super) {
        __extends(VisLoader, _super);
        function VisLoader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VisLoader.prototype.onCreatePage = function (page) {
            return new VisPage(page);
        };
        return VisLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.VisLoader = VisLoader;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Entities;
    (function (Entities) {
        var Entity = (function (_super) {
            __extends(Entity, _super);
            function Entity(map, info) {
                var _this = _super.call(this, true) || this;
                _this.map = map;
                if (info.origin !== undefined) {
                    _this.setPosition(info.origin);
                }
                if (info.angles !== undefined) {
                    var mul = Math.PI / 180;
                    _this.setAngles(info.angles.x * mul, info.angles.y * mul, info.angles.z * mul);
                }
                return _this;
            }
            return Entity;
        }(WebGame.DrawableEntity));
        Entities.Entity = Entity;
        var PvsEntity = (function (_super) {
            __extends(PvsEntity, _super);
            function PvsEntity(map, info) {
                var _this = _super.call(this, map, info) || this;
                _this.clusters = info.clusters;
                return _this;
            }
            PvsEntity.prototype.isInCluster = function (cluster) {
                var clusters = this.clusters;
                if (clusters == null)
                    return false;
                for (var i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    if (clusters[i] === cluster)
                        return true;
                }
                return false;
            };
            PvsEntity.prototype.isInAnyCluster = function (clusters) {
                if (clusters == null)
                    return true;
                for (var i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    if (this.isInCluster(clusters[i]))
                        return true;
                }
                return false;
            };
            PvsEntity.prototype.populateDrawList = function (drawList, clusters) {
                if (!this.isInAnyCluster(clusters))
                    return;
                drawList.addItem(this);
                this.onPopulateDrawList(drawList, clusters);
            };
            PvsEntity.prototype.onPopulateDrawList = function (drawList, clusters) { };
            return PvsEntity;
        }(Entity));
        Entities.PvsEntity = PvsEntity;
    })(Entities = SourceUtils.Entities || (SourceUtils.Entities = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="PvsEntity.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Entities;
    (function (Entities) {
        var BrushEntity = (function (_super) {
            __extends(BrushEntity, _super);
            function BrushEntity(map, info) {
                var _this = _super.call(this, map, info) || this;
                _this.model = map.viewer.bspModelLoader.load(info.modelUrl);
                _this.model.addUsage(_this);
                _this.model.addOnLoadCallback(function (model) {
                    var leaves = model.getLeaves();
                    for (var i = 0, iEnd = leaves.length; i < iEnd; ++i) {
                        leaves[i].entity = _this;
                    }
                });
                return _this;
            }
            BrushEntity.prototype.onPopulateDrawList = function (drawList, clusters) {
                var leaves = this.model.getLeaves();
                if (leaves != null)
                    drawList.addItems(leaves);
            };
            return BrushEntity;
        }(Entities.PvsEntity));
        Entities.BrushEntity = BrushEntity;
    })(Entities = SourceUtils.Entities || (SourceUtils.Entities = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Entities;
    (function (Entities) {
        var Camera = (function (_super) {
            __extends(Camera, _super);
            function Camera(viewer, fov) {
                var _this = _super.call(this, viewer, fov, viewer.getWidth() / viewer.getHeight(), 1, 8192) || this;
                _this.leafInvalid = true;
                _this.render3DSky = true;
                _this.viewer = viewer;
                return _this;
            }
            Camera.prototype.onChangePosition = function () {
                this.invalidateMatrices();
                this.leafInvalid = true;
            };
            Camera.prototype.onGetLeaf = function () {
                var temp = Facepunch.Vector3.pool.create();
                var leaf = this.viewer.map.getLeafAt(this.getPosition(temp));
                temp.release();
                return leaf;
            };
            Camera.prototype.getLeaf = function () {
                if (this.leafInvalid) {
                    this.leafInvalid = false;
                    var leaf = this.onGetLeaf();
                    if (this.leaf !== leaf) {
                        this.leaf = leaf;
                        this.invalidateGeometry();
                    }
                }
                return this.leaf;
            };
            Camera.prototype.render = function () {
                var leaf = this.getLeaf();
                if (this.render3DSky && leaf != null && (leaf.flags & SourceUtils.LeafFlags.Sky) !== 0) {
                    var skyCamera = this.viewer.map.skyCamera;
                    if (skyCamera != null) {
                        skyCamera.renderRelativeTo(this);
                    }
                }
                _super.prototype.render.call(this);
            };
            return Camera;
        }(WebGame.PerspectiveCamera));
        Entities.Camera = Camera;
        var SkyCamera = (function (_super) {
            __extends(SkyCamera, _super);
            function SkyCamera(viewer, info) {
                var _this = _super.call(this, viewer, 60) || this;
                _this.render3DSky = false;
                _this.origin = new Facepunch.Vector3().copy(info.origin);
                _this.skyScale = 1 / info.scale;
                return _this;
            }
            SkyCamera.prototype.onChangePosition = function () {
                this.invalidateMatrices();
            };
            SkyCamera.prototype.onGetLeaf = function () {
                return this.viewer.map.getLeafAt(this.origin);
            };
            SkyCamera.prototype.renderRelativeTo = function (camera) {
                var temp = Facepunch.Vector3.pool.create();
                camera.getPosition(temp);
                temp.multiplyScalar(this.skyScale);
                temp.add(this.origin);
                this.setPosition(temp);
                temp.release();
                this.setFov(camera.getFov());
                this.setAspect(camera.getAspect());
                this.copyRotation(camera);
                _super.prototype.render.call(this);
                var gl = this.viewer.context;
                gl.depthMask(true);
                gl.clear(gl.DEPTH_BUFFER_BIT);
            };
            return SkyCamera;
        }(Camera));
        Entities.SkyCamera = SkyCamera;
    })(Entities = SourceUtils.Entities || (SourceUtils.Entities = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var Entities;
    (function (Entities) {
        var Displacement = (function (_super) {
            __extends(Displacement, _super);
            function Displacement(map, info) {
                var _this = _super.call(this, map, info) || this;
                _this.isLoaded = false;
                _this.index = info.index;
                return _this;
            }
            Displacement.prototype.onAddToDrawList = function (list) {
                var _this = this;
                if (!this.isLoaded) {
                    this.isLoaded = true;
                    this.map.viewer.dispGeometryLoader.load(this.index, function (handle) { return _this.drawable.addMeshHandles([handle]); });
                }
                _super.prototype.onAddToDrawList.call(this, list);
            };
            return Displacement;
        }(Entities.PvsEntity));
        Entities.Displacement = Displacement;
    })(Entities = SourceUtils.Entities || (SourceUtils.Entities = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var Entities;
    (function (Entities) {
        var Worldspawn = (function (_super) {
            __extends(Worldspawn, _super);
            function Worldspawn(map, info) {
                var _this = _super.call(this, map, info) || this;
                _this.clusterLeaves = {};
                _this.model.addOnLoadCallback(function (model) { return _this.onModelLoad(); });
                return _this;
            }
            Worldspawn.prototype.onModelLoad = function () {
                var leaves = this.model.getLeaves();
                for (var i = 0, iEnd = leaves.length; i < iEnd; ++i) {
                    var leaf = leaves[i];
                    if (leaf.cluster === undefined)
                        continue;
                    var clusterLeaves = this.clusterLeaves[leaf.cluster];
                    if (clusterLeaves == null) {
                        this.clusterLeaves[leaf.cluster] = clusterLeaves = [];
                    }
                    clusterLeaves.push(leaf);
                }
                this.map.viewer.forceDrawListInvalidation(true);
            };
            Worldspawn.prototype.isInAnyCluster = function (clusters) {
                return true;
            };
            Worldspawn.prototype.isInCluster = function (cluster) {
                return true;
            };
            Worldspawn.prototype.onPopulateDrawList = function (drawList, clusters) {
                if (clusters == null) {
                    _super.prototype.onPopulateDrawList.call(this, drawList, clusters);
                    return;
                }
                for (var i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    var cluster = clusters[i];
                    var clusterLeaves = this.clusterLeaves[cluster];
                    if (clusterLeaves != null)
                        drawList.addItems(clusterLeaves);
                }
            };
            return Worldspawn;
        }(Entities.BrushEntity));
        Entities.Worldspawn = Worldspawn;
    })(Entities = SourceUtils.Entities || (SourceUtils.Entities = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var BaseMaterial = (function () {
            function BaseMaterial() {
                this.cullFace = true;
            }
            return BaseMaterial;
        }());
        Shaders.BaseMaterial = BaseMaterial;
        var BaseShaderProgram = (function (_super) {
            __extends(BaseShaderProgram, _super);
            function BaseShaderProgram(context, ctor) {
                var _this = _super.call(this, context) || this;
                _this.materialCtor = ctor;
                return _this;
            }
            BaseShaderProgram.prototype.createMaterialProperties = function () {
                return new this.materialCtor();
            };
            BaseShaderProgram.prototype.bufferMaterial = function (buf, material) {
                this.bufferMaterialProps(buf, material.properties);
            };
            BaseShaderProgram.prototype.bufferMaterialProps = function (buf, props) {
                var gl = this.context;
                if (props.cullFace) {
                    buf.enable(gl.CULL_FACE);
                }
                else {
                    buf.disable(gl.CULL_FACE);
                }
            };
            return BaseShaderProgram;
        }(WebGame.ShaderProgram));
        Shaders.BaseShaderProgram = BaseShaderProgram;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var ModelBaseMaterial = (function (_super) {
            __extends(ModelBaseMaterial, _super);
            function ModelBaseMaterial() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.basetexture = null;
                _this.alphaTest = false;
                _this.translucent = false;
                _this.alpha = 1;
                return _this;
            }
            return ModelBaseMaterial;
        }(Shaders.BaseMaterial));
        Shaders.ModelBaseMaterial = ModelBaseMaterial;
        var ModelBase = (function (_super) {
            __extends(ModelBase, _super);
            function ModelBase(context, ctor) {
                var _this = _super.call(this, context, ctor) || this;
                _this.uProjection = _this.addUniform("uProjection", WebGame.UniformMatrix4);
                _this.uView = _this.addUniform("uView", WebGame.UniformMatrix4);
                _this.uModel = _this.addUniform("uModel", WebGame.UniformMatrix4);
                _this.uBaseTexture = _this.addUniform("uBaseTexture", WebGame.UniformSampler);
                _this.uAlphaTest = _this.addUniform("uAlphaTest", WebGame.Uniform1F);
                _this.uTranslucent = _this.addUniform("uTranslucent", WebGame.Uniform1F);
                _this.uAlpha = _this.addUniform("uAlpha", WebGame.Uniform1F);
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    attribute vec3 aPosition;\n                    attribute vec2 aTextureCoord;\n\n                    varying vec2 vTextureCoord;\n\n                    uniform mat4 uProjection;\n                    uniform mat4 uView;\n                    uniform mat4 uModel;\n\n                    void ModelBase_main()\n                    {\n                        vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);\n\n                        gl_Position = uProjection * viewPos;\n\n                        vTextureCoord = aTextureCoord;\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying vec2 vTextureCoord;\n\n                    uniform sampler2D uBaseTexture;\n\n                    uniform float uAlphaTest;   // [0, 1]\n                    uniform float uTranslucent; // [0, 1]\n                    uniform float uAlpha;       // [0..1]\n\n                    vec4 ModelBase_main()\n                    {\n                        vec4 sample = texture2D(uBaseTexture, vTextureCoord);\n                        if (sample.a <= uAlphaTest - 0.5) discard;\n\n                        float alpha = mix(1.0, uAlpha * sample.a, uTranslucent);\n\n                        return vec4(sample.rgb, alpha);\n                    }");
                _this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                _this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                _this.uBaseTexture.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                return _this;
            }
            ModelBase.prototype.bufferSetup = function (buf) {
                _super.prototype.bufferSetup.call(this, buf);
                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
            };
            ModelBase.prototype.bufferModelMatrix = function (buf, value) {
                _super.prototype.bufferModelMatrix.call(this, buf, value);
                this.uModel.bufferValue(buf, false, value);
            };
            ModelBase.prototype.bufferMaterialProps = function (buf, props) {
                _super.prototype.bufferMaterialProps.call(this, buf, props);
                this.uBaseTexture.bufferValue(buf, props.basetexture);
                this.uAlphaTest.bufferValue(buf, props.alphaTest ? 1 : 0);
                this.uTranslucent.bufferValue(buf, props.translucent ? 1 : 0);
                this.uAlpha.bufferValue(buf, props.alpha);
                var gl = this.context;
                buf.enable(gl.DEPTH_TEST);
                if (props.translucent) {
                    buf.depthMask(false);
                    buf.enable(gl.BLEND);
                    buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }
                else {
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                }
            };
            return ModelBase;
        }(Shaders.BaseShaderProgram));
        Shaders.ModelBase = ModelBase;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="ModelBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var LightmappedBaseMaterial = (function (_super) {
            __extends(LightmappedBaseMaterial, _super);
            function LightmappedBaseMaterial() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return LightmappedBaseMaterial;
        }(Shaders.ModelBaseMaterial));
        Shaders.LightmappedBaseMaterial = LightmappedBaseMaterial;
        var LightmappedBase = (function (_super) {
            __extends(LightmappedBase, _super);
            function LightmappedBase(context, ctor) {
                var _this = _super.call(this, context, ctor) || this;
                _this.uLightmap = _this.addUniform("uLightmap", WebGame.UniformSampler);
                _this.uLightmapParams = _this.addUniform("uLightmapParams", WebGame.Uniform4F);
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    attribute vec2 aLightmapCoord;\n\n                    varying vec2 vLightmapCoord;\n\n                    void LightmappedBase_main()\n                    {\n                        ModelBase_main();\n\n                        vLightmapCoord = aLightmapCoord;\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying vec2 vLightmapCoord;\n\n                    uniform sampler2D uLightmap;\n                    uniform vec4 uLightmapParams;\n\n                    vec3 DecompressLightmapSample(vec4 sample)\n                    {\n                        float exp = sample.a * 255.0 - 128.0;\n                        return sample.rgb * pow(2.0, exp);\n                    }\n\n                    vec3 ApplyLightmap(vec3 inColor)\n                    {\n                        const float gamma = 0.5;\n\n                        vec2 size = uLightmapParams.xy;\n                        vec2 invSize = uLightmapParams.zw;\n                        vec2 scaledCoord = vLightmapCoord * size;\n                        vec2 minCoord = floor(scaledCoord);\n                        vec2 maxCoord = minCoord + vec2(1.0, 1.0);\n                        vec2 delta = scaledCoord - minCoord;\n\n                        minCoord *= invSize;\n                        maxCoord *= invSize;\n\n                        vec3 sampleA = DecompressLightmapSample(texture2D(uLightmap, vec2(minCoord.x, minCoord.y)));\n                        vec3 sampleB = DecompressLightmapSample(texture2D(uLightmap, vec2(maxCoord.x, minCoord.y)));\n                        vec3 sampleC = DecompressLightmapSample(texture2D(uLightmap, vec2(minCoord.x, maxCoord.y)));\n                        vec3 sampleD = DecompressLightmapSample(texture2D(uLightmap, vec2(maxCoord.x, maxCoord.y)));\n\n                        vec3 sample = mix(mix(sampleA, sampleB, delta.x), mix(sampleC, sampleD, delta.x), delta.y);\n\n                        return inColor * pow(sample, vec3(gamma, gamma, gamma));\n                    }");
                _this.addAttribute("aLightmapCoord", WebGame.VertexAttribute.uv2);
                _this.uLightmap.setDefault(WebGame.TextureUtils.getWhiteTexture(context));
                return _this;
            }
            LightmappedBase.prototype.bufferSetup = function (buf) {
                _super.prototype.bufferSetup.call(this, buf);
                this.uLightmap.bufferParameter(buf, SourceUtils.Map.lightmapParam);
                this.uLightmapParams.bufferParameter(buf, SourceUtils.Map.lightmapInfoParam);
            };
            return LightmappedBase;
        }(Shaders.ModelBase));
        Shaders.LightmappedBase = LightmappedBase;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="LightmappedBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var Lightmapped2WayBlendMaterial = (function (_super) {
            __extends(Lightmapped2WayBlendMaterial, _super);
            function Lightmapped2WayBlendMaterial() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.basetexture2 = null;
                _this.blendModulateTexture = null;
                return _this;
            }
            return Lightmapped2WayBlendMaterial;
        }(Shaders.LightmappedBaseMaterial));
        Shaders.Lightmapped2WayBlendMaterial = Lightmapped2WayBlendMaterial;
        var Lightmapped2WayBlend = (function (_super) {
            __extends(Lightmapped2WayBlend, _super);
            function Lightmapped2WayBlend(context) {
                var _this = _super.call(this, context, Lightmapped2WayBlendMaterial) || this;
                _this.uBaseTexture2 = _this.addUniform("uBaseTexture2", WebGame.UniformSampler);
                _this.uBlendModulateTexture = _this.addUniform("uBlendModulateTexture", WebGame.UniformSampler);
                _this.uBlendModulate = _this.addUniform("uBlendModulate", WebGame.Uniform1I);
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    attribute float aAlpha;\n\n                    varying float vAlpha;\n\n                    void main()\n                    {\n                        LightmappedBase_main();\n\n                        vAlpha = aAlpha;\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying float vAlpha;\n\n                    uniform sampler2D uBaseTexture2;\n                    uniform sampler2D uBlendModulateTexture;\n\n                    uniform int uBlendModulate; // [0, 1]\n\n                    void main()\n                    {\n                        vec3 sample0 = texture2D(uBaseTexture, vTextureCoord).rgb;\n                        vec3 sample1 = texture2D(uBaseTexture2, vTextureCoord).rgb;\n                        vec3 blendSample = texture2D(uBlendModulateTexture, vTextureCoord).rga;\n\n                        float blend;\n                        if (uBlendModulate != 0) {\n                            float blendMin = max(0.0, blendSample.y - blendSample.x * 0.5);\n                            float blendMax = min(1.0, blendSample.y + blendSample.x * 0.5);\n\n                            blend = max(0.0, min(1.0, (vAlpha - blendMin) / max(0.0, blendMax - blendMin)));\n                        } else {\n                            blend = vAlpha;\n                        }\n\n                        vec3 blendedSample = mix(sample0, sample1, blend);\n                        vec3 lightmapped = ApplyLightmap(blendedSample);\n\n                        gl_FragColor = vec4(lightmapped, 1.0);\n                    }");
                _this.addAttribute("aAlpha", WebGame.VertexAttribute.alpha);
                _this.uBaseTexture2.setDefault(WebGame.TextureUtils.getErrorTexture(gl));
                _this.uBlendModulateTexture.setDefault(WebGame.TextureUtils.getTranslucentTexture(gl));
                _this.compile();
                return _this;
            }
            Lightmapped2WayBlend.prototype.bufferMaterialProps = function (buf, props) {
                _super.prototype.bufferMaterialProps.call(this, buf, props);
                this.uBaseTexture2.bufferValue(buf, props.basetexture2);
                this.uBlendModulateTexture.bufferValue(buf, props.blendModulateTexture);
                this.uBlendModulate.bufferValue(buf, props.blendModulateTexture != null ? 1 : 0);
            };
            return Lightmapped2WayBlend;
        }(Shaders.LightmappedBase));
        Shaders.Lightmapped2WayBlend = Lightmapped2WayBlend;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="LightmappedBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Shaders;
    (function (Shaders) {
        var LightmappedGenericMaterial = (function (_super) {
            __extends(LightmappedGenericMaterial, _super);
            function LightmappedGenericMaterial() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return LightmappedGenericMaterial;
        }(Shaders.LightmappedBaseMaterial));
        Shaders.LightmappedGenericMaterial = LightmappedGenericMaterial;
        var LightmappedGeneric = (function (_super) {
            __extends(LightmappedGeneric, _super);
            function LightmappedGeneric(context) {
                var _this = _super.call(this, context, LightmappedGenericMaterial) || this;
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    void main()\n                    {\n                        LightmappedBase_main();\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    void main()\n                    {\n                        vec4 modelBase = ModelBase_main();\n                        vec3 lightmapped = ApplyLightmap(modelBase.rgb);\n\n                        gl_FragColor = vec4(lightmapped, modelBase.a);\n                    }");
                _this.compile();
                return _this;
            }
            return LightmappedGeneric;
        }(Shaders.LightmappedBase));
        Shaders.LightmappedGeneric = LightmappedGeneric;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
