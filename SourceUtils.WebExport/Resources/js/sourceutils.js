var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
                callback(value, this);
                return value;
            }
            this.toLoad.push({ index: index, callback: callback });
        };
        ResourcePage.prototype.onLoadValues = function (page) {
            this.page = page;
            for (var i = 0, iEnd = this.toLoad.length; i < iEnd; ++i) {
                var request = this.toLoad[i];
                request.callback(this.getValue(request.index), this);
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
            this.loadProgress = 0;
            this.throwIfNotFound = true;
        }
        PagedLoader.prototype.getLoadProgress = function () {
            return this.pages == null ? 0 : this.loadProgress / this.pages.length;
        };
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
            if (this.throwIfNotFound) {
                throw new Error("Unable to find page for index " + index + ".");
            }
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
                var lastProgress = 0;
                ++this_1.active;
                Facepunch.Http.getJson(next.url, function (page) {
                    --_this.active;
                    _this.loadProgress += 1 - lastProgress;
                    lastProgress = 1;
                    next.onLoadValues(page);
                }, function (error) {
                    --_this.active;
                    console.warn(error);
                }, function (loaded, total) {
                    if (total !== undefined) {
                        var progress = loaded / total;
                        _this.loadProgress += (progress - lastProgress);
                        lastProgress = progress;
                    }
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
        function BspModel(viewer) {
            var _this = _super.call(this) || this;
            _this.viewer = viewer;
            return _this;
        }
        BspModel.prototype.loadFromInfo = function (info) {
            this.info = info;
            this.headNode = new BspNode(this.viewer.leafGeometryLoader, info.headNode);
            this.leaves = [];
            this.headNode.findLeaves(this.leaves);
            this.dispatchOnLoadCallbacks();
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
        BspModel.prototype.isLoaded = function () {
            return this.info != null;
        };
        return BspModel;
    }(WebGame.RenderResource));
    SourceUtils.BspModel = BspModel;
    var BspModelPage = (function (_super) {
        __extends(BspModelPage, _super);
        function BspModelPage(viewer, page) {
            var _this = _super.call(this, page) || this;
            _this.viewer = viewer;
            return _this;
        }
        BspModelPage.prototype.onLoadValues = function (page) {
            this.models = page.models;
            _super.prototype.onLoadValues.call(this, page);
        };
        BspModelPage.prototype.onGetValue = function (index) {
            return this.models[index];
        };
        return BspModelPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.BspModelPage = BspModelPage;
    var BspModelLoader = (function (_super) {
        __extends(BspModelLoader, _super);
        function BspModelLoader(viewer) {
            var _this = _super.call(this) || this;
            _this.models = {};
            _this.viewer = viewer;
            return _this;
        }
        BspModelLoader.prototype.loadModel = function (index) {
            var model = this.models[index];
            if (model !== undefined)
                return model;
            this.models[index] = model = new BspModel(this.viewer);
            this.load(index, function (info) { return model.loadFromInfo(info); });
            return model;
        };
        BspModelLoader.prototype.onCreatePage = function (page) {
            return new BspModelPage(this.viewer, page);
        };
        return BspModelLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.BspModelLoader = BspModelLoader;
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
            if (dispFace.element === -1 || dispFace.material === -1)
                return null;
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
                _this.isWorldSpawn = info.model === 0;
                _this.model = map.viewer.bspModelLoader.loadModel(info.model);
                _this.model.addUsage(_this);
                _this.model.addOnLoadCallback(function (model) {
                    var leaves = model.getLeaves();
                    for (var i = 0, iEnd = leaves.length; i < iEnd; ++i) {
                        leaves[i].entity = _this;
                    }
                });
                return _this;
            }
            BrushEntity.prototype.onAddToDrawList = function (list) {
                _super.prototype.onAddToDrawList.call(this, list);
                if (this.isWorldSpawn)
                    return;
                var leaves = this.model.getLeaves();
                if (leaves != null)
                    list.addItems(leaves);
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
                var temp = Camera.onGetLeaf_temp;
                var leaf = this.viewer.map.getLeafAt(this.getPosition(temp));
                return leaf;
            };
            Camera.prototype.getLeaf = function () {
                if (this.leafInvalid) {
                    var leaf = this.onGetLeaf();
                    this.leafInvalid = leaf !== undefined;
                    if (this.leaf !== leaf) {
                        this.leaf = leaf;
                        this.invalidateGeometry();
                    }
                }
                return this.leaf;
            };
            Camera.prototype.onPopulateDrawList = function (drawList) {
                this.viewer.map.populateDrawList(drawList, this.getLeaf());
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
        Camera.onGetLeaf_temp = new Facepunch.Vector3();
        Entities.Camera = Camera;
        var SkyCamera = (function (_super) {
            __extends(SkyCamera, _super);
            function SkyCamera(viewer, info) {
                var _this = _super.call(this, viewer, 60) || this;
                _this.render3DSky = false;
                _this.origin = new Facepunch.Vector3().copy(info.origin);
                _this.skyScale = 1 / info.scale;
                if (info.fogEnabled) {
                    _this.fog.start = info.fogStart;
                    _this.fog.end = info.fogEnd;
                    _this.fog.maxDensity = info.fogMaxDensity;
                    _this.fog.color.set(info.fogColor.r, info.fogColor.g, info.fogColor.b);
                    if (info.farZ !== 0)
                        _this.setFar(info.farZ);
                }
                return _this;
            }
            SkyCamera.prototype.onChangePosition = function () {
                this.invalidateMatrices();
            };
            SkyCamera.prototype.onGetLeaf = function () {
                return this.viewer.map.getLeafAt(this.origin);
            };
            SkyCamera.prototype.renderRelativeTo = function (camera) {
                var temp = SkyCamera.renderRelativeTo_temp;
                camera.getPosition(temp);
                temp.multiplyScalar(this.skyScale);
                temp.add(this.origin);
                this.setPosition(temp);
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
        SkyCamera.renderRelativeTo_temp = new Facepunch.Vector3();
        Entities.SkyCamera = SkyCamera;
        var ShadowCamera = (function (_super) {
            __extends(ShadowCamera, _super);
            function ShadowCamera(viewer, targetCamera) {
                var _this = _super.call(this, viewer, 1, 1, 0, 1) || this;
                _this.viewer = viewer;
                _this.targetCamera = targetCamera;
                return _this;
            }
            ShadowCamera.prototype.onPopulateDrawList = function (drawList) {
                this.viewer.map.populateDrawList(drawList, this.targetCamera.getLeaf());
            };
            ShadowCamera.prototype.addToFrustumBounds = function (invLight, vec, bounds) {
                vec.applyMatrix4(this.targetCamera.getMatrix());
                vec.applyQuaternion(invLight);
            };
            ShadowCamera.prototype.getFrustumBounds = function (lightRotation, near, far, bounds) {
                bounds.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                bounds.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
                var yScale = Math.tan(this.targetCamera.getFov() * 0.5);
                var xScale = yScale * this.targetCamera.getAspect();
                var xNear = xScale * near;
                var yNear = yScale * near;
                var xFar = xScale * far;
                var yFar = yScale * far;
                var vec = ShadowCamera.getFrustumBounds_vec;
                var invLight = ShadowCamera.getFrustumBounds_invLight;
                invLight.setInverse(lightRotation);
                this.addToFrustumBounds(invLight, vec.set(xNear, yNear, near, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xNear, yNear, near, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(xNear, -yNear, near, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xNear, -yNear, near, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(xFar, yFar, far, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xFar, yFar, far, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(xFar, -yFar, far, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xFar, -yFar, far, 1), bounds);
            };
            ShadowCamera.prototype.renderShadows = function (lightRotation, near, far) {
                var bounds = ShadowCamera.renderShadows_bounds;
                this.getFrustumBounds(lightRotation, near, far, bounds);
            };
            return ShadowCamera;
        }(WebGame.OrthographicCamera));
        ShadowCamera.getFrustumBounds_vec = new Facepunch.Vector4();
        ShadowCamera.getFrustumBounds_invLight = new Facepunch.Quaternion();
        ShadowCamera.renderShadows_bounds = new Facepunch.Box3();
        Entities.ShadowCamera = ShadowCamera;
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
                    this.map.viewer.dispGeometryLoader.load(this.index, function (handle) {
                        if (handle != null)
                            _this.drawable.addMeshHandles([handle]);
                    });
                }
                _super.prototype.onAddToDrawList.call(this, list);
            };
            return Displacement;
        }(Entities.PvsEntity));
        Entities.Displacement = Displacement;
    })(Entities = SourceUtils.Entities || (SourceUtils.Entities = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="PvsEntity.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Entities;
    (function (Entities) {
        var StaticProp = (function (_super) {
            __extends(StaticProp, _super);
            function StaticProp(map, info) {
                var _this = _super.call(this, map, info) || this;
                _this.albedoModulation = info.albedoModulation;
                if (info.vertLighting !== undefined) {
                    map.viewer.vertLightingLoader.load(info.vertLighting, function (value) {
                        _this.lighting = value;
                        _this.checkLoaded();
                    });
                }
                else {
                    _this.lighting = null;
                }
                _this.model = map.viewer.studioModelLoader.loadModel(info.model);
                _this.model.addUsage(_this);
                _this.model.addOnLoadCallback(function (model) {
                    _this.checkLoaded();
                });
                return _this;
            }
            StaticProp.prototype.checkLoaded = function () {
                if (!this.model.isLoaded())
                    return;
                if (this.lighting === undefined)
                    return;
                this.drawable.addMeshHandles(this.model.createMeshHandles(0, this.getMatrix(), this.lighting, this.albedoModulation));
            };
            return StaticProp;
        }(Entities.PvsEntity));
        Entities.StaticProp = StaticProp;
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
                    var leaves = this.model.getLeaves();
                    if (leaves != null)
                        drawList.addItems(leaves);
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
            this.clusterEnts = {};
            this.viewer = viewer;
        }
        Map.prototype.isReady = function () {
            return this.info != null && this.lightmap != null && this.lightmap.isLoaded() && this.worldspawn.model != null;
        };
        Map.prototype.unload = function () {
            throw new Error("Map unloading not implemented.");
        };
        Map.prototype.load = function (url) {
            var _this = this;
            Facepunch.Http.getJson(url, function (info) {
                _this.onLoad(info);
            });
        };
        Map.prototype.getLightmapLoadProgress = function () {
            return this.lightmap == null ? 0 : this.lightmap.getLoadProgress();
        };
        Map.prototype.onLoad = function (info) {
            if (this.info != null)
                this.unload();
            this.info = info;
            this.viewer.visLoader.setPageLayout(info.visPages);
            this.viewer.leafGeometryLoader.setPageLayout(info.leafPages);
            this.viewer.dispGeometryLoader.setPageLayout(info.dispPages);
            this.viewer.mapMaterialLoader.setPageLayout(info.materialPages);
            this.viewer.bspModelLoader.setPageLayout(info.brushModelPages);
            this.viewer.studioModelLoader.setPageLayout(info.studioModelPages);
            this.viewer.vertLightingLoader.setPageLayout(info.vertLightingPages);
            this.lightmap = this.viewer.textureLoader.load(info.lightmapUrl);
            this.tSpawns = [];
            this.ctSpawns = [];
            this.playerSpawns = [];
            this.pvsEntities = [];
            for (var i = 0, iEnd = info.entities.length; i < iEnd; ++i) {
                var ent = info.entities[i];
                var pvsInst = null;
                switch (ent.classname) {
                    case "worldspawn":
                        var worldspawn = ent;
                        this.worldspawn = new SourceUtils.Entities.Worldspawn(this, worldspawn);
                        this.lightmap.addUsage(this.worldspawn);
                        if (worldspawn.skyMaterial != null) {
                            var skyMat = new WebGame.MaterialLoadable(this.viewer);
                            skyMat.loadFromInfo(worldspawn.skyMaterial);
                            this.skyCube = new SourceUtils.SkyCube(this.viewer, skyMat);
                        }
                        break;
                    case "env_fog_controller":
                        var fogController = ent;
                        var fog = this.viewer.mainCamera.fog;
                        if (!fogController.fogEnabled)
                            break;
                        fog.color.set(fogController.fogColor.r, fogController.fogColor.g, fogController.fogColor.b);
                        fog.start = fogController.fogStart;
                        fog.end = fogController.fogEnd;
                        fog.maxDensity = fogController.fogMaxDensity;
                        if (fogController.farZ !== 0)
                            this.viewer.mainCamera.setFar(fogController.farZ);
                        break;
                    case "info_player_terrorist":
                        this.tSpawns.push(ent);
                        break;
                    case "info_player_counterterrorist":
                        this.ctSpawns.push(ent);
                        break;
                    case "info_player_start":
                        this.playerSpawns.push(ent);
                        break;
                    case "displacement":
                        pvsInst = new SourceUtils.Entities.Displacement(this, ent);
                        break;
                    case "func_brush":
                        pvsInst = new SourceUtils.Entities.BrushEntity(this, ent);
                        break;
                    case "prop_static":
                        if (ent.model === -1)
                            break;
                        pvsInst = new SourceUtils.Entities.StaticProp(this, ent);
                        break;
                    case "sky_camera":
                        this.skyCamera = new SourceUtils.Entities.SkyCamera(this.viewer, ent);
                        break;
                }
                if (pvsInst != null) {
                    this.pvsEntities.push(pvsInst);
                }
            }
            var pos = new Facepunch.Vector3();
            if (this.viewer.mainCamera.getPosition(pos).x === 0 && pos.y === 0 && pos.z === 0) {
                var spawn = this.tSpawns[0] || this.ctSpawns[0] || this.playerSpawns[0];
                this.viewer.mainCamera.setPosition(spawn.origin);
                this.viewer.mainCamera.translate(0, 0, 64);
                this.viewer.setCameraAngles((spawn.angles.y - 90) * Math.PI / 180, spawn.angles.x * Math.PI / 180);
            }
            this.viewer.forceDrawListInvalidation(true);
        };
        Map.prototype.getPvsEntitiesInCluster = function (cluster) {
            var ents = this.clusterEnts[cluster];
            if (ents !== undefined)
                return ents;
            this.clusterEnts[cluster] = ents = [];
            for (var _i = 0, _a = this.pvsEntities; _i < _a.length; _i++) {
                var ent = _a[_i];
                if (ent.isInCluster(cluster)) {
                    ents.push(ent);
                }
            }
            return ents;
        };
        Map.prototype.getLeafAt = function (pos) {
            if (this.worldspawn == null || this.worldspawn.model == null)
                return undefined;
            return this.worldspawn.model.getLeafAt(pos);
        };
        Map.prototype.populateDrawList = function (drawList, pvsRoot) {
            var _this = this;
            if (this.worldspawn == null)
                return;
            if (pvsRoot != null && this.skyCube != null && (this.skyCamera == null || pvsRoot === this.skyCamera.getLeaf())) {
                drawList.addItem(this.skyCube);
            }
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
            this.worldspawn.populateDrawList(drawList, vis);
            if (vis == null) {
                for (var _i = 0, _a = this.pvsEntities; _i < _a.length; _i++) {
                    var ent = _a[_i];
                    drawList.addItem(ent);
                }
                return;
            }
            for (var _b = 0, vis_1 = vis; _b < vis_1.length; _b++) {
                var cluster = vis_1[_b];
                var ents = this.getPvsEntitiesInCluster(cluster);
                for (var _c = 0, ents_1 = ents; _c < ents_1.length; _c++) {
                    var ent = ents_1[_c];
                    if (ent.getIsInDrawList(drawList))
                        continue;
                    drawList.addItem(ent);
                }
            }
        };
        Map.prototype.populateCommandBufferParameters = function (buf) {
            var lightmap = this.lightmap != null && this.lightmap.isLoaded()
                ? this.lightmap
                : WebGame.TextureUtils.getWhiteTexture(this.viewer.context);
            buf.setParameter(Map.lightmapParam, lightmap);
        };
        return Map;
    }());
    Map.lightmapParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Texture);
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
            this.load(index, function (info) { return info == null ? null : material.loadFromInfo(info); });
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
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var CameraMode;
    (function (CameraMode) {
        CameraMode[CameraMode["Fixed"] = 0] = "Fixed";
        CameraMode[CameraMode["CanLook"] = 1] = "CanLook";
        CameraMode[CameraMode["CanMove"] = 2] = "CanMove";
        CameraMode[CameraMode["FreeCam"] = 3] = "FreeCam";
    })(CameraMode = SourceUtils.CameraMode || (SourceUtils.CameraMode = {}));
    var MapViewer = (function (_super) {
        __extends(MapViewer, _super);
        function MapViewer(container) {
            var _this = _super.call(this, container) || this;
            _this.map = new SourceUtils.Map(_this);
            _this.visLoader = _this.addLoader(new SourceUtils.VisLoader());
            _this.bspModelLoader = _this.addLoader(new SourceUtils.BspModelLoader(_this));
            _this.mapMaterialLoader = _this.addLoader(new SourceUtils.MapMaterialLoader(_this));
            _this.leafGeometryLoader = _this.addLoader(new SourceUtils.LeafGeometryLoader(_this));
            _this.dispGeometryLoader = _this.addLoader(new SourceUtils.DispGeometryLoader(_this));
            _this.studioModelLoader = _this.addLoader(new SourceUtils.StudioModelLoader(_this));
            _this.vertLightingLoader = _this.addLoader(new SourceUtils.VertexLightingLoader(_this));
            _this.cameraMode = CameraMode.Fixed;
            _this.saveCameraPosInHash = false;
            _this.showDebugPanel = false;
            _this.totalLoadProgress = 0;
            _this.onHashChange_temp = new Facepunch.Vector3();
            _this.lookAngs = new Facepunch.Vector2();
            _this.tempQuat = new Facepunch.Quaternion();
            _this.lookQuat = new Facepunch.Quaternion();
            _this.frameCount = 0;
            _this.allLoaded = false;
            _this.onUpdateFrame_temp = new Facepunch.Vector3();
            container.classList.add("map-viewer");
            return _this;
        }
        MapViewer.prototype.loadMap = function (url) {
            this.map.load(url);
        };
        MapViewer.prototype.onInitialize = function () {
            var _this = this;
            this.canLockPointer = true;
            this.mainCamera = new SourceUtils.Entities.Camera(this, 75);
            var deltaAngles = new Facepunch.Vector3();
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
            if (window.location.hash != null && window.location.hash.length > 1) {
                this.hashChange();
            }
            window.onhashchange = function (ev) { return _this.hashChange(); };
            _super.prototype.onInitialize.call(this);
        };
        MapViewer.prototype.setHash = function (value) {
            if (typeof value === "string") {
                this.oldHash = value;
                window.location.hash = value;
                return;
            }
            var hash = "#";
            for (var key in value) {
                if (!value.hasOwnProperty(key))
                    continue;
                if (!MapViewer.hashKeyRegex.test(key)) {
                    console.warn("Invalid hash object key: " + key);
                    continue;
                }
                var val = value[key];
                if (typeof val !== "number" && (typeof val !== "string" || isNaN(parseFloat(val)))) {
                    console.warn("Invalid hash object value: " + val);
                    continue;
                }
                hash += key;
                hash += val;
            }
            this.setHash(hash);
        };
        MapViewer.prototype.hashChange = function () {
            var hash = window.location.hash;
            if (hash === this.oldHash)
                return;
            this.oldHash = hash;
            if (!MapViewer.hashObjectRegex.test(hash)) {
                this.onHashChange(hash);
                return;
            }
            var obj = {};
            var keyValRegex = /([a-z_]+)(-?[0-9]+(?:\.[0-9]+)?)/ig;
            var match;
            while ((match = keyValRegex.exec(hash)) != null) {
                obj[match[1]] = parseFloat(match[2]);
            }
            this.onHashChange(obj);
        };
        MapViewer.prototype.onHashChange = function (value) {
            if (typeof value === "string")
                return;
            if (!this.saveCameraPosInHash)
                return;
            var posHash = value;
            var pos = this.mainCamera.getPosition(this.onHashChange_temp);
            if (posHash.x !== undefined) {
                pos.x = posHash.x;
            }
            if (posHash.y !== undefined) {
                pos.y = posHash.y;
            }
            if (posHash.z !== undefined) {
                pos.z = posHash.z;
            }
            this.mainCamera.setPosition(pos);
            if (posHash.r !== undefined) {
                this.lookAngs.x = posHash.r / 180 * Math.PI;
            }
            if (posHash.s !== undefined) {
                this.lookAngs.y = posHash.s / 180 * Math.PI;
            }
            this.updateCameraAngles();
        };
        MapViewer.prototype.onCreateDebugPanel = function () {
            var panel = document.createElement("div");
            panel.classList.add("side-panel");
            panel.innerHTML = "\n                <span class=\"label\">Frame time:</span>&nbsp;<span class=\"debug-frametime\">0</span>&nbsp;ms<br/>\n                <span class=\"label\">Frame rate:</span>&nbsp;<span class=\"debug-framerate\">0</span>&nbsp;fps<br />\n                <span class=\"label\">Draw calls:</span>&nbsp;<span class=\"debug-drawcalls\">0</span><br />\n                <div class=\"debug-loading\">\n                    <span class=\"label\">Map loaded:</span>&nbsp;<span class=\"debug-loadpercent\">0</span>%<br />\n                </div>";
            this.container.appendChild(panel);
            return panel;
        };
        MapViewer.prototype.onDeviceRotate = function (deltaAngles) {
            if ((this.cameraMode & CameraMode.CanLook) === 0)
                return;
            if (window.innerWidth > window.innerHeight) {
                this.lookAngs.x += deltaAngles.z;
                this.lookAngs.y -= deltaAngles.x;
            }
            else {
                this.lookAngs.x += deltaAngles.x;
                this.lookAngs.y += deltaAngles.z;
            }
            this.notMovedTime = 0;
            this.updateCameraAngles();
        };
        MapViewer.prototype.onResize = function () {
            _super.prototype.onResize.call(this);
            this.mainCamera.setAspect(this.getWidth() / this.getHeight());
        };
        MapViewer.prototype.setCameraAngles = function (yaw, pitch) {
            this.lookAngs.x = yaw;
            this.lookAngs.y = pitch;
            this.updateCameraAngles();
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
            if ((this.cameraMode & CameraMode.CanLook) === 0)
                return;
            if (Math.abs(delta.x) === 0 && Math.abs(delta.y) === 0)
                return;
            this.lookAngs.sub(delta.multiplyScalar(1 / 800));
            this.notMovedTime = 0;
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
            switch (key) {
                case WebGame.Key.F:
                    this.toggleFullscreen();
                    return true;
                case WebGame.Key.W:
                case WebGame.Key.A:
                case WebGame.Key.S:
                case WebGame.Key.D:
                case WebGame.Key.Shift:
                    return this.isPointerLocked() && (this.cameraMode & CameraMode.CanMove) !== 0;
                default:
                    return false;
            }
        };
        MapViewer.prototype.onSetDebugText = function (className, value) {
            var elem = this.debugPanel.getElementsByClassName(className)[0];
            if (elem == null)
                return;
            elem.innerText = value;
            if (className === "debug-loadpercent" && parseInt(value) >= 100) {
                var loading = this.debugPanel.getElementsByClassName("debug-loading")[0];
                if (loading != null) {
                    loading.style.display = "none";
                }
            }
        };
        MapViewer.prototype.onUpdateFrame = function (dt) {
            _super.prototype.onUpdateFrame.call(this, dt);
            if (this.showDebugPanel !== this.debugPanelVisible) {
                this.debugPanelVisible = this.showDebugPanel;
                if (this.showDebugPanel && this.debugPanel === undefined) {
                    this.debugPanel = this.onCreateDebugPanel();
                }
                if (this.debugPanel != null) {
                    if (this.showDebugPanel)
                        this.debugPanel.style.display = null;
                    else
                        this.debugPanel.style.display = "none";
                }
            }
            var savePosPeriod = 1;
            var wasBeforeSavePosPeriod = this.notMovedTime < savePosPeriod;
            if ((this.cameraMode & CameraMode.CanMove) !== 0 && this.isPointerLocked() && this.map.isReady()) {
                var move = this.onUpdateFrame_temp;
                move.set(0, 0, 0);
                var moveSpeed = 512 * dt * (this.isKeyDown(WebGame.Key.Shift) ? 4 : 1);
                if (this.isKeyDown(WebGame.Key.W))
                    move.z -= moveSpeed;
                if (this.isKeyDown(WebGame.Key.S))
                    move.z += moveSpeed;
                if (this.isKeyDown(WebGame.Key.A))
                    move.x -= moveSpeed;
                if (this.isKeyDown(WebGame.Key.D))
                    move.x += moveSpeed;
                if (move.lengthSq() > 0) {
                    this.mainCamera.applyRotationTo(move);
                    this.mainCamera.translate(move);
                    this.notMovedTime = 0;
                }
            }
            this.notMovedTime += dt;
            if (this.saveCameraPosInHash && wasBeforeSavePosPeriod && this.notMovedTime >= savePosPeriod) {
                var pos = this.mainCamera.getPosition(this.onUpdateFrame_temp);
                var pitch = this.lookAngs.x * 180.0 / Math.PI;
                var yaw = this.lookAngs.y * 180.0 / Math.PI;
                this.setHash({
                    x: pos.x.toFixed(1),
                    y: pos.y.toFixed(1),
                    z: pos.z.toFixed(1),
                    r: pitch.toFixed(1),
                    s: yaw.toFixed(1)
                });
            }
            // Diagnostics
            var drawCalls = this.mainCamera.getDrawCalls();
            if (drawCalls !== this.lastDrawCalls && this.showDebugPanel) {
                this.lastDrawCalls = drawCalls;
                this.onSetDebugText("debug-drawcalls", drawCalls.toString());
            }
            ++this.frameCount;
            var time = performance.now();
            if (this.lastProfileTime === undefined) {
                this.lastProfileTime = time;
            }
            else if (time - this.lastProfileTime >= 500) {
                var timeDiff = (time - this.lastProfileTime) / 1000;
                this.avgFrameTime = timeDiff * 1000 / this.frameCount;
                this.avgFrameRate = this.frameCount / timeDiff;
                if (this.showDebugPanel) {
                    this.onSetDebugText("debug-frametime", this.avgFrameTime.toPrecision(4));
                    this.onSetDebugText("debug-framerate", this.avgFrameRate.toPrecision(4));
                }
                if (!this.allLoaded) {
                    var visLoaded = this.visLoader.getLoadProgress();
                    var bspLoaded = this.bspModelLoader.getLoadProgress();
                    var lightmapLoaded = this.map.getLightmapLoadProgress();
                    var materialsLoaded = this.mapMaterialLoader.getLoadProgress();
                    var geomLoaded = this.leafGeometryLoader.getLoadProgress() * 0.5
                        + this.dispGeometryLoader.getLoadProgress() * 0.5;
                    var propsLoaded = this.vertLightingLoader.getLoadProgress() * 0.25
                        + this.studioModelLoader.getLoadProgress() * 0.75;
                    this.totalLoadProgress = (visLoaded + bspLoaded + lightmapLoaded + materialsLoaded + geomLoaded + propsLoaded) / 6;
                    if (this.showDebugPanel) {
                        this.onSetDebugText("debug-loadpercent", (this.totalLoadProgress * 100).toPrecision(3));
                    }
                    if (this.totalLoadProgress >= 1) {
                        this.allLoaded = true;
                    }
                }
                this.lastProfileTime = time;
                this.frameCount = 0;
            }
        };
        MapViewer.prototype.onRenderFrame = function (dt) {
            _super.prototype.onRenderFrame.call(this, dt);
            var gl = this.context;
            gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.depthFunc(gl.LEQUAL);
            gl.cullFace(gl.FRONT);
            this.mainCamera.render();
        };
        MapViewer.prototype.populateCommandBufferParameters = function (buf) {
            _super.prototype.populateCommandBufferParameters.call(this, buf);
            this.map.populateCommandBufferParameters(buf);
        };
        return MapViewer;
    }(WebGame.Game));
    MapViewer.hashKeyRegex = /^[a-z_]+$/i;
    MapViewer.hashObjectRegex = /^#((?:[a-z_]+)(?:-?[0-9]+(?:\.[0-9]+)?))+$/i;
    SourceUtils.MapViewer = MapViewer;
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
                _this.fogEnabled = true;
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
                _this.uFogParams = _this.addUniform("uFogParams", WebGame.Uniform4F);
                _this.uFogColor = _this.addUniform("uFogColor", WebGame.Uniform3F);
                _this.uFogEnabled = _this.addUniform("uFogEnabled", WebGame.Uniform1I);
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    attribute vec3 aPosition;\n                    attribute vec2 aTextureCoord;\n\n                    varying vec2 vTextureCoord;\n                    varying float vDepth;\n\n                    uniform mat4 " + _this.uProjection + ";\n                    uniform mat4 " + _this.uView + ";\n                    uniform mat4 " + _this.uModel + ";\n\n                    void ModelBase_main()\n                    {\n                        vec4 viewPos = " + _this.uView + " * " + _this.uModel + " * vec4(aPosition, 1.0);\n\n                        gl_Position = " + _this.uProjection + " * viewPos;\n\n                        vTextureCoord = aTextureCoord;\n                        vDepth = -viewPos.z;\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying vec2 vTextureCoord;\n                    varying float vDepth;\n\n                    uniform sampler2D " + _this.uBaseTexture + ";\n\n                    uniform float " + _this.uAlphaTest + ";   // [0, 1]\n                    uniform float " + _this.uTranslucent + "; // [0, 1]\n                    uniform float " + _this.uAlpha + ";       // [0..1]\n\n                    uniform vec4 " + _this.uFogParams + ";\n                    uniform vec3 " + _this.uFogColor + ";\n                    uniform int " + _this.uFogEnabled + ";\n\n                    vec3 ApplyFog(vec3 inColor)\n                    {\n                        if (" + _this.uFogEnabled + " == 0) return inColor;\n\n                        float fogDensity = " + _this.uFogParams + ".x + " + _this.uFogParams + ".y * vDepth;\n                        fogDensity = min(max(fogDensity, " + _this.uFogParams + ".z), " + _this.uFogParams + ".w);\n                        return mix(inColor, " + _this.uFogColor + ", fogDensity);\n                    }\n\n                    vec4 ModelBase_main()\n                    {\n                        vec4 sample = texture2D(" + _this.uBaseTexture + ", vTextureCoord);\n                        if (sample.a <= " + _this.uAlphaTest + " - 0.5) discard;\n\n                        float alpha = mix(1.0, " + _this.uAlpha + " * sample.a, " + _this.uTranslucent + ");\n\n                        return vec4(sample.rgb, alpha);\n                    }");
                _this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                _this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                _this.uBaseTexture.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                return _this;
            }
            ModelBase.prototype.bufferSetup = function (buf) {
                _super.prototype.bufferSetup.call(this, buf);
                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
                this.uFogParams.bufferParameter(buf, WebGame.Fog.fogInfoParam);
                this.uFogColor.bufferParameter(buf, WebGame.Fog.fogColorParam);
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
                this.uFogEnabled.bufferValue(buf, props.fogEnabled ? 1 : 0);
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
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    attribute vec2 aLightmapCoord;\n\n                    varying vec2 vLightmapCoord;\n\n                    void LightmappedBase_main()\n                    {\n                        ModelBase_main();\n\n                        vLightmapCoord = aLightmapCoord;\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying vec2 vLightmapCoord;\n\n                    uniform sampler2D " + _this.uLightmap + ";\n                    uniform vec4 " + _this.uLightmap.getSizeUniform() + ";\n\n                    vec3 DecompressLightmapSample(vec4 sample)\n                    {\n                        float exp = sample.a * 255.0 - 128.0;\n                        return pow(sample.rgb * pow(2.0, exp), vec3(0.5, 0.5, 0.5));\n                    }\n\n                    vec3 ApplyLightmap(vec3 inColor)\n                    {\n                        vec2 size = " + _this.uLightmap.getSizeUniform() + ".xy;\n                        vec2 invSize = " + _this.uLightmap.getSizeUniform() + ".zw;\n                        vec2 scaledCoord = vLightmapCoord * size - vec2(0.5, 0.5);\n                        vec2 minCoord = floor(scaledCoord) + vec2(0.5, 0.5);\n                        vec2 maxCoord = minCoord + vec2(1.0, 1.0);\n                        vec2 delta = scaledCoord - floor(scaledCoord);\n\n                        minCoord *= invSize;\n                        maxCoord *= invSize;\n\n                        vec3 sampleA = DecompressLightmapSample(texture2D(" + _this.uLightmap + ", vec2(minCoord.x, minCoord.y)));\n                        vec3 sampleB = DecompressLightmapSample(texture2D(" + _this.uLightmap + ", vec2(maxCoord.x, minCoord.y)));\n                        vec3 sampleC = DecompressLightmapSample(texture2D(" + _this.uLightmap + ", vec2(minCoord.x, maxCoord.y)));\n                        vec3 sampleD = DecompressLightmapSample(texture2D(" + _this.uLightmap + ", vec2(maxCoord.x, maxCoord.y)));\n\n                        vec3 sample = mix(mix(sampleA, sampleB, delta.x), mix(sampleC, sampleD, delta.x), delta.y);\n\n                        return inColor * sample;\n                    }");
                _this.addAttribute("aLightmapCoord", WebGame.VertexAttribute.uv2);
                _this.uLightmap.setDefault(WebGame.TextureUtils.getWhiteTexture(context));
                return _this;
            }
            LightmappedBase.prototype.bufferSetup = function (buf) {
                _super.prototype.bufferSetup.call(this, buf);
                this.uLightmap.bufferParameter(buf, SourceUtils.Map.lightmapParam);
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
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying float vAlpha;\n\n                    uniform sampler2D uBaseTexture2;\n                    uniform sampler2D uBlendModulateTexture;\n\n                    uniform int uBlendModulate; // [0, 1]\n\n                    void main()\n                    {\n                        vec3 sample0 = texture2D(uBaseTexture, vTextureCoord).rgb;\n                        vec3 sample1 = texture2D(uBaseTexture2, vTextureCoord).rgb;\n\n                        float blend;\n                        if (uBlendModulate != 0) {\n                            vec3 blendSample = texture2D(uBlendModulateTexture, vTextureCoord).rga;\n\n                            float blendMin = max(0.0, blendSample.y - blendSample.x * 0.5);\n                            float blendMax = min(1.0, blendSample.y + blendSample.x * 0.5);\n\n                            blend = max(0.0, min(1.0, (vAlpha - blendMin) / max(0.0, blendMax - blendMin)));\n                        } else {\n                            blend = vAlpha;\n                        }\n\n                        vec3 blendedSample = mix(sample0, sample1, blend);\n                        vec3 lightmapped = ApplyLightmap(blendedSample);\n\n                        gl_FragColor = vec4(ApplyFog(lightmapped), 1.0);\n                    }");
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
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    void main()\n                    {\n                        vec4 modelBase = ModelBase_main();\n                        vec3 lightmapped = ApplyLightmap(modelBase.rgb);\n\n                        gl_FragColor = vec4(ApplyFog(lightmapped), modelBase.a);\n                    }");
                _this.compile();
                return _this;
            }
            return LightmappedGeneric;
        }(Shaders.LightmappedBase));
        Shaders.LightmappedGeneric = LightmappedGeneric;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var SkyMaterial = (function (_super) {
            __extends(SkyMaterial, _super);
            function SkyMaterial() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.facePosX = null;
                _this.faceNegX = null;
                _this.facePosY = null;
                _this.faceNegY = null;
                _this.facePosZ = null;
                _this.faceNegZ = null;
                _this.hdrCompressed = false;
                _this.aspect = 1;
                return _this;
            }
            return SkyMaterial;
        }(Shaders.BaseMaterial));
        Shaders.SkyMaterial = SkyMaterial;
        var Sky = (function (_super) {
            __extends(Sky, _super);
            function Sky(context) {
                var _this = _super.call(this, context, SkyMaterial) || this;
                _this.uProjection = _this.addUniform("uProjection", WebGame.UniformMatrix4);
                _this.uView = _this.addUniform("uView", WebGame.UniformMatrix4);
                _this.uFacePosX = _this.addUniform("uFacePosX", WebGame.UniformSampler);
                _this.uFaceNegX = _this.addUniform("uFaceNegX", WebGame.UniformSampler);
                _this.uFacePosY = _this.addUniform("uFacePosY", WebGame.UniformSampler);
                _this.uFaceNegY = _this.addUniform("uFaceNegY", WebGame.UniformSampler);
                _this.uFacePosZ = _this.addUniform("uFacePosZ", WebGame.UniformSampler);
                _this.uFaceNegZ = _this.addUniform("uFaceNegZ", WebGame.UniformSampler);
                _this.uHdrCompressed = _this.addUniform("uHdrCompressed", WebGame.Uniform1I);
                _this.sortOrder = -1000;
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    attribute vec2 aTextureCoord;\n                    attribute float aFace;\n\n                    varying float vFace;\n                    varying vec2 vTextureCoord;\n\n                    uniform mat4 " + _this.uProjection + ";\n                    uniform mat4 " + _this.uView + ";\n\n                    vec3 GetPosition()\n                    {\n                        vec2 pos = aTextureCoord - vec2(0.5, 0.5);\n                        int face = int(aFace + 0.5);\n                        if (face == 0) return vec3( 0.5, -pos.x, -pos.y);\n                        if (face == 1) return vec3(-0.5, pos.x, -pos.y);\n                        if (face == 2) return vec3( pos.x, 0.5, -pos.y);\n                        if (face == 3) return vec3(-pos.x, -0.5, -pos.y);\n                        if (face == 4) return vec3( pos.y,-pos.x, 0.5);\n                        if (face == 5) return vec3( pos.y, pos.x, -0.5);\n                        return vec3(0.0, 0.0, 0.0);\n                    }\n\n                    void main()\n                    {\n                        vec4 viewPos = " + _this.uView + " * vec4(GetPosition() * 128.0, 0.0);\n\n                        gl_Position = " + _this.uProjection + " * vec4(viewPos.xyz, 1.0);\n\n                        vFace = aFace;\n                        vTextureCoord = aTextureCoord;\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying float vFace;\n                    varying vec2 vTextureCoord;\n\n                    uniform sampler2D " + _this.uFacePosX + "; uniform vec4 " + _this.uFacePosX.getSizeUniform() + ";\n                    uniform sampler2D " + _this.uFaceNegX + "; uniform vec4 " + _this.uFaceNegX.getSizeUniform() + ";\n                    uniform sampler2D " + _this.uFacePosY + "; uniform vec4 " + _this.uFacePosY.getSizeUniform() + ";\n                    uniform sampler2D " + _this.uFaceNegY + "; uniform vec4 " + _this.uFaceNegY.getSizeUniform() + ";\n                    uniform sampler2D " + _this.uFacePosZ + "; uniform vec4 " + _this.uFacePosZ.getSizeUniform() + ";\n                    uniform sampler2D " + _this.uFaceNegZ + "; uniform vec4 " + _this.uFaceNegZ.getSizeUniform() + ";\n\n                    uniform int " + _this.uHdrCompressed + ";\n\n                    vec4 GetFaceSize()\n                    {\n                        int face = int(vFace + 0.5);\n                        if (face == 0) return " + _this.uFacePosX.getSizeUniform() + ";\n                        if (face == 1) return " + _this.uFaceNegX.getSizeUniform() + ";\n                        if (face == 2) return " + _this.uFacePosY.getSizeUniform() + ";\n                        if (face == 3) return " + _this.uFaceNegY.getSizeUniform() + ";\n                        if (face == 4) return " + _this.uFacePosZ.getSizeUniform() + ";\n                        if (face == 5) return " + _this.uFaceNegZ.getSizeUniform() + ";\n                        return vec4(1.0, 1.0, 1.0, 1.0);\n                    }\n\n                    vec4 GetFaceSample(vec2 uv)\n                    {\n                        int face = int(vFace + 0.5);\n                        if (face == 0) return texture2D(" + _this.uFacePosX + ", uv);\n                        if (face == 1) return texture2D(" + _this.uFaceNegX + ", uv);\n                        if (face == 2) return texture2D(" + _this.uFacePosY + ", uv);\n                        if (face == 3) return texture2D(" + _this.uFaceNegY + ", uv);\n                        if (face == 4) return texture2D(" + _this.uFacePosZ + ", uv);\n                        if (face == 5) return texture2D(" + _this.uFaceNegZ + ", uv);\n                        return vec4(0.0, 0.0, 0.0, 1.0);\n                    }\n\n                    vec3 DecompressHdr(vec4 sample)\n                    {\n                        return sample.rgb * sample.a * 2.0;\n                    }\n\n                    void main()\n                    {\n                        if (" + _this.uHdrCompressed + " != 0) {\n                            vec4 size = GetFaceSize();\n                            vec2 scaledCoord = vTextureCoord * size.xy * vec2(1.0, size.x * size.w) - vec2(0.5, 0.5);\n                            vec2 minCoord = floor(scaledCoord) + vec2(0.5, 0.5);\n                            vec2 maxCoord = minCoord + vec2(1.0, 1.0);\n                            vec2 delta = scaledCoord - floor(scaledCoord);\n\n                            minCoord *= size.zw;\n                            maxCoord *= size.zw;\n\n                            vec3 sampleA = DecompressHdr(GetFaceSample(vec2(minCoord.x, minCoord.y)));\n                            vec3 sampleB = DecompressHdr(GetFaceSample(vec2(maxCoord.x, minCoord.y)));\n                            vec3 sampleC = DecompressHdr(GetFaceSample(vec2(minCoord.x, maxCoord.y)));\n                            vec3 sampleD = DecompressHdr(GetFaceSample(vec2(maxCoord.x, maxCoord.y)));\n\n                            vec3 sample = mix(mix(sampleA, sampleB, delta.x), mix(sampleC, sampleD, delta.x), delta.y);\n\n                            gl_FragColor = vec4(sample, 1.0);\n                        } else {\n                            vec4 sample = GetFaceSample(vTextureCoord);\n                            gl_FragColor = vec4(sample.rgb, 1.0);\n                        }\n                    }");
                _this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                _this.addAttribute("aFace", WebGame.VertexAttribute.alpha);
                _this.uFacePosX.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.uFaceNegX.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.uFacePosY.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.uFaceNegY.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.uFacePosZ.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.uFaceNegZ.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.compile();
                return _this;
            }
            Sky.prototype.bufferSetup = function (buf) {
                _super.prototype.bufferSetup.call(this, buf);
                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
                buf.depthMask(false);
            };
            Sky.prototype.bufferMaterialProps = function (buf, props) {
                _super.prototype.bufferMaterialProps.call(this, buf, props);
                this.uFacePosX.bufferValue(buf, props.facePosX);
                this.uFaceNegX.bufferValue(buf, props.faceNegX);
                this.uFacePosY.bufferValue(buf, props.facePosY);
                this.uFaceNegY.bufferValue(buf, props.faceNegY);
                this.uFacePosZ.bufferValue(buf, props.facePosZ);
                this.uFaceNegZ.bufferValue(buf, props.faceNegZ);
                this.uHdrCompressed.bufferValue(buf, props.hdrCompressed ? 1 : 0);
            };
            return Sky;
        }(Shaders.BaseShaderProgram));
        Shaders.Sky = Sky;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="ModelBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var Shaders;
    (function (Shaders) {
        var UnlitGenericMaterial = (function (_super) {
            __extends(UnlitGenericMaterial, _super);
            function UnlitGenericMaterial() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return UnlitGenericMaterial;
        }(Shaders.ModelBaseMaterial));
        Shaders.UnlitGenericMaterial = UnlitGenericMaterial;
        var UnlitGeneric = (function (_super) {
            __extends(UnlitGeneric, _super);
            function UnlitGeneric(context) {
                var _this = _super.call(this, context, UnlitGenericMaterial) || this;
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    void main()\n                    {\n                        ModelBase_main();\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    void main()\n                    {\n                        vec4 mainSample = ModelBase_main();\n                        gl_FragColor = vec4(ApplyFog(mainSample.rgb), mainSample.a);\n                    }");
                _this.compile();
                return _this;
            }
            return UnlitGeneric;
        }(Shaders.ModelBase));
        Shaders.UnlitGeneric = UnlitGeneric;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="ModelBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var VertexLitGenericMaterial = (function (_super) {
            __extends(VertexLitGenericMaterial, _super);
            function VertexLitGenericMaterial() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return VertexLitGenericMaterial;
        }(Shaders.ModelBaseMaterial));
        Shaders.VertexLitGenericMaterial = VertexLitGenericMaterial;
        var VertexLitGeneric = (function (_super) {
            __extends(VertexLitGeneric, _super);
            function VertexLitGeneric(context) {
                var _this = _super.call(this, context, VertexLitGenericMaterial) || this;
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    attribute vec3 aEncodedColors;\n\n                    varying vec3 vVertexLighting;\n                    varying vec3 vAlbedoModulation;\n\n                    void main()\n                    {\n                        vVertexLighting = floor(aEncodedColors) * (2.0 / 255.0);\n                        vAlbedoModulation = fract(aEncodedColors) * (256.0 / 255.0);\n\n                        ModelBase_main();\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    varying vec3 vVertexLighting;\n                    varying vec3 vAlbedoModulation;\n\n                    void main()\n                    {\n                        vec4 mainSample = ModelBase_main();\n                        gl_FragColor = vec4(ApplyFog(mainSample.rgb * vVertexLighting * vAlbedoModulation), mainSample.a);\n                    }");
                _this.addAttribute("aEncodedColors", WebGame.VertexAttribute.rgb);
                _this.compile();
                return _this;
            }
            return VertexLitGeneric;
        }(Shaders.ModelBase));
        Shaders.VertexLitGeneric = VertexLitGeneric;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="LightmappedBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var WaterMaterial = (function (_super) {
            __extends(WaterMaterial, _super);
            function WaterMaterial() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.fogStart = 8192;
                _this.fogEnd = 16384;
                _this.fogColor = new Facepunch.Vector3(1, 1, 1);
                _this.fogLightmapped = true;
                _this.translucent = true;
                _this.refract = true;
                _this.refractTint = new Facepunch.Vector3(1, 1, 1);
                _this.normalMap = null;
                _this.cullFace = false;
                return _this;
            }
            return WaterMaterial;
        }(Shaders.LightmappedBaseMaterial));
        Shaders.WaterMaterial = WaterMaterial;
        var Water = (function (_super) {
            __extends(Water, _super);
            function Water(context) {
                var _this = _super.call(this, context, WaterMaterial) || this;
                _this.uCameraPos = _this.addUniform("uCameraPos", WebGame.Uniform3F);
                _this.uInverseProjection = _this.addUniform("uInverseProjection", WebGame.UniformMatrix4);
                _this.uInverseView = _this.addUniform("uInverseView", WebGame.UniformMatrix4);
                _this.uScreenParams = _this.addUniform("uScreenParams", WebGame.Uniform4F);
                _this.uOpaqueColor = _this.addUniform("uOpaqueColor", WebGame.UniformSampler);
                _this.uOpaqueDepth = _this.addUniform("uOpaqueDepth", WebGame.UniformSampler);
                _this.uWaterFogParams = _this.addUniform("uWaterFogParams", WebGame.Uniform4F);
                _this.uWaterFogColor = _this.addUniform("uWaterFogColor", WebGame.Uniform3F);
                _this.uWaterFogLightmapped = _this.addUniform("uWaterFogLightmapped", WebGame.Uniform1F);
                _this.uNormalMap = _this.addUniform("uNormalMap", WebGame.UniformSampler);
                _this.uRefractTint = _this.addUniform("uRefractTint", WebGame.Uniform3F);
                _this.sortOrder = -10;
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    void main()\n                    {\n                        LightmappedBase_main();\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    uniform vec3 " + _this.uCameraPos + ";\n\n                    uniform vec4 " + _this.uScreenParams + ";\n                    uniform highp mat4 " + _this.uProjection + ";\n                    uniform mat4 " + _this.uInverseProjection + ";\n                    uniform mat4 " + _this.uInverseView + ";\n\n                    uniform sampler2D " + _this.uOpaqueColor + ";\n                    uniform sampler2D " + _this.uOpaqueDepth + ";\n\n                    uniform vec4 " + _this.uWaterFogParams + ";\n                    uniform vec3 " + _this.uWaterFogColor + ";\n                    uniform float " + _this.uWaterFogLightmapped + ";\n\n                    uniform sampler2D " + _this.uNormalMap + ";\n                    uniform vec3 " + _this.uRefractTint + ";\n\n                    vec4 CalcEyeFromWindow(in vec3 fragCoord)\n                    {\n                        vec3 ndcPos;\n                        ndcPos.xy = (2.0 * fragCoord.xy) * (uScreenParams.zw) - vec2(1.0, 1.0);\n                        ndcPos.z = (2.0 * fragCoord.z - gl_DepthRange.near - gl_DepthRange.far) / (gl_DepthRange.far - gl_DepthRange.near);\n\n                        vec4 clipPos;\n                        clipPos.w = " + _this.uProjection + "[3][2] / (ndcPos.z - (" + _this.uProjection + "[2][2] / " + _this.uProjection + "[2][3]));\n                        clipPos.xyz = ndcPos * clipPos.w;\n\n                        return " + _this.uInverseProjection + " * clipPos;\n                    }\n\n                    vec3 GetWorldPos(float fragZ)\n                    {\n                        return (" + _this.uInverseView + " * CalcEyeFromWindow(vec3(gl_FragCoord.xy, fragZ))).xyz;\n                    }\n\n                    void main()\n                    {\n                        vec2 screenPos = gl_FragCoord.xy * " + _this.uScreenParams + ".zw;\n\n                        vec3 normal = normalize(texture2D(" + _this.uNormalMap + ", vTextureCoord).xyz - vec3(0.5, 0.5, 0.5));\n                        vec3 surfacePos = GetWorldPos(gl_FragCoord.z);\n                        vec3 viewDir = normalize(surfacePos - uCameraPos);\n\n                        float opaqueDepthSample = texture2D(" + _this.uOpaqueDepth + ", screenPos).r;\n                        vec3 opaquePos = GetWorldPos(opaqueDepthSample);\n                        float opaqueDepth = surfacePos.z - opaquePos.z;\n                        vec2 refractedScreenPos = screenPos + normal.xy * opaqueDepth * 1.0 / 512.0;\n                        float refractedOpaqueDepthSample = texture2D(" + _this.uOpaqueDepth + ", refractedScreenPos).r;\n                        vec3 opaqueColor = texture2D(" + _this.uOpaqueColor + ",\n                            refractedOpaqueDepthSample > gl_FragCoord.z ? refractedScreenPos : screenPos).rgb * " + _this.uRefractTint + ";\n\n                        float relativeDepth = (opaqueDepth - " + _this.uWaterFogParams + ".x) * " + _this.uWaterFogParams + ".y;\n                        float fogDensity = max(" + _this.uWaterFogParams + ".z, min(" + _this.uWaterFogParams + ".w, relativeDepth)) * float(opaqueDepthSample < 1.0);\n\n                        vec3 waterFogColor = " + _this.uWaterFogColor + ";\n\n                        if (" + _this.uWaterFogLightmapped + " > 0.5) {\n                            waterFogColor = ApplyLightmap(waterFogColor);\n                        }\n\n                        vec3 waterFogged = mix(opaqueColor, ApplyFog(waterFogColor), fogDensity);\n                        gl_FragColor = vec4(waterFogged, 1.0);\n                    }");
                _this.uOpaqueColor.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.uOpaqueDepth.setDefault(WebGame.TextureUtils.getBlackTexture(context));
                _this.uNormalMap.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.compile();
                return _this;
            }
            Water.prototype.bufferSetup = function (buf) {
                _super.prototype.bufferSetup.call(this, buf);
                this.uCameraPos.bufferParameter(buf, WebGame.Camera.cameraPosParam);
                this.uScreenParams.bufferParameter(buf, WebGame.Game.screenInfoParam);
                this.uInverseProjection.bufferParameter(buf, WebGame.Camera.inverseProjectionMatrixParam);
                this.uInverseView.bufferParameter(buf, WebGame.Camera.inverseViewMatrixParam);
            };
            Water.prototype.bufferMaterialProps = function (buf, props) {
                _super.prototype.bufferMaterialProps.call(this, buf, props);
                this.uWaterFogColor.bufferValue(buf, props.fogColor.x, props.fogColor.y, props.fogColor.z);
                this.uWaterFogParams.bufferValue(buf, props.fogStart, 1 / (props.fogEnd - props.fogStart), 0, 1);
                this.uWaterFogLightmapped.bufferValue(buf, props.fogLightmapped ? 1 : 0);
                this.uNormalMap.bufferValue(buf, props.normalMap);
                this.uRefractTint.bufferValue(buf, props.refractTint.x, props.refractTint.y, props.refractTint.z);
                if (props.translucent) {
                    this.uOpaqueColor.bufferParameter(buf, WebGame.Camera.opaqueColorParam);
                    this.uOpaqueDepth.bufferParameter(buf, WebGame.Camera.opaqueDepthParam);
                }
                else {
                    this.uOpaqueColor.bufferValue(buf, null);
                    this.uOpaqueDepth.bufferValue(buf, null);
                }
            };
            return Water;
        }(Shaders.LightmappedBase));
        Shaders.Water = Water;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
/// <reference path="LightmappedBase.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var Shaders;
    (function (Shaders) {
        var WorldTwoTextureBlendMaterial = (function (_super) {
            __extends(WorldTwoTextureBlendMaterial, _super);
            function WorldTwoTextureBlendMaterial() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.detail = null;
                _this.detailScale = 1;
                return _this;
            }
            return WorldTwoTextureBlendMaterial;
        }(Shaders.LightmappedBaseMaterial));
        Shaders.WorldTwoTextureBlendMaterial = WorldTwoTextureBlendMaterial;
        var WorldTwoTextureBlend = (function (_super) {
            __extends(WorldTwoTextureBlend, _super);
            function WorldTwoTextureBlend(context) {
                var _this = _super.call(this, context, WorldTwoTextureBlendMaterial) || this;
                _this.uDetail = _this.addUniform("uDetail", WebGame.UniformSampler);
                _this.uDetailScale = _this.addUniform("uDetailScale", WebGame.Uniform1F);
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, "\n                    void main()\n                    {\n                        LightmappedBase_main();\n                    }");
                _this.includeShaderSource(gl.FRAGMENT_SHADER, "\n                    precision mediump float;\n\n                    uniform sampler2D uDetail;\n                    uniform float uDetailScale;\n\n                    void main()\n                    {\n                        vec3 base = texture2D(uBaseTexture, vTextureCoord).rgb;\n                        vec4 detail = texture2D(uDetail, vTextureCoord * uDetailScale).rgb;\n\n                        vec3 blendedSample = mix(base, detail, detail.a);\n                        vec3 lightmapped = ApplyLightmap(blendedSample);\n\n                        gl_FragColor = vec4(ApplyFog(lightmapped), 1.0);\n                    }");
                _this.uDetail.setDefault(WebGame.TextureUtils.getTranslucentTexture(gl));
                _this.compile();
                return _this;
            }
            WorldTwoTextureBlend.prototype.bufferMaterialProps = function (buf, props) {
                _super.prototype.bufferMaterialProps.call(this, buf, props);
                this.uDetail.bufferValue(buf, props.detail);
                this.uDetailScale.bufferValue(buf, props.detailScale);
            };
            return WorldTwoTextureBlend;
        }(Shaders.LightmappedBase));
        Shaders.WorldTwoTextureBlend = WorldTwoTextureBlend;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var SkyCube = (function (_super) {
        __extends(SkyCube, _super);
        function SkyCube(viewer, material) {
            var _this = _super.call(this) || this;
            var meshData = {
                attributes: [WebGame.VertexAttribute.uv, WebGame.VertexAttribute.alpha],
                elements: [
                    {
                        mode: WebGame.DrawMode.Triangles,
                        material: material,
                        indexOffset: 0,
                        indexCount: 36
                    }
                ],
                vertices: [],
                indices: []
            };
            for (var face = 0; face < 6; ++face) {
                meshData.vertices.push(0, 0, face);
                meshData.vertices.push(1, 0, face);
                meshData.vertices.push(1, 1, face);
                meshData.vertices.push(0, 1, face);
                var index = face * 4;
                meshData.indices.push(index + 0, index + 1, index + 2);
                meshData.indices.push(index + 0, index + 2, index + 3);
            }
            _this.addMeshHandles(viewer.meshes.addMeshData(meshData));
            return _this;
        }
        return SkyCube;
    }(WebGame.DrawListItem));
    SourceUtils.SkyCube = SkyCube;
})(SourceUtils || (SourceUtils = {}));
/// <reference path="PagedLoader.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var StudioModel = (function (_super) {
        __extends(StudioModel, _super);
        function StudioModel(viewer) {
            var _this = _super.call(this) || this;
            _this.viewer = viewer;
            return _this;
        }
        StudioModel.getOrCreateMatGroup = function (matGroups, attribs) {
            for (var _i = 0, matGroups_1 = matGroups; _i < matGroups_1.length; _i++) {
                var matGroup = matGroups_1[_i];
                if (matGroup.attributes.length !== attribs.length)
                    continue;
                var matches = true;
                for (var i = 0; i < attribs.length; ++i) {
                    if (matGroup.attributes[i].id !== attribs[i].id) {
                        matches = false;
                        break;
                    }
                }
                if (matches)
                    return matGroup;
            }
            var newGroup = WebGame.MeshManager.createEmpty(attribs);
            matGroups.push(newGroup);
            return newGroup;
        };
        StudioModel.encode2CompColor = function (vertLit, albedoMod) {
            return vertLit + albedoMod * 0.00390625;
        };
        StudioModel.prototype.createMeshHandles = function (bodyPartIndex, transform, vertLighting, albedoModulation) {
            var _this = this;
            var bodyPart = this.info.bodyParts[bodyPartIndex];
            var handles = [];
            var matGroups = [];
            if (albedoModulation === undefined)
                albedoModulation = 0xffffff;
            else
                albedoModulation &= 0xffffff;
            var albedoR = albedoModulation & 0xff;
            var albedoG = (albedoModulation >> 8) & 0xff;
            var albedoB = (albedoModulation >> 16) & 0xff;
            for (var _i = 0, _a = bodyPart.models; _i < _a.length; _i++) {
                var model = _a[_i];
                for (var _b = 0, _c = model.meshes; _b < _c.length; _b++) {
                    var mesh = _c[_b];
                    var srcGroup = this.page.getMaterialGroup(mesh.material);
                    var attribs = [];
                    attribs.push.apply(attribs, srcGroup.attributes);
                    attribs.push(WebGame.VertexAttribute.rgb);
                    var dstGroup = StudioModel.getOrCreateMatGroup(matGroups, attribs);
                    var newElem = WebGame.MeshManager.copyElement(srcGroup, dstGroup, mesh.element);
                    var rgbOffset = WebGame.MeshManager.getAttributeOffset(attribs, WebGame.VertexAttribute.rgb);
                    var vertLength = WebGame.MeshManager.getVertexLength(attribs);
                    var lighting = vertLighting == null ? null : vertLighting[mesh.meshId];
                    var vertData = dstGroup.vertices;
                    for (var i = newElem.vertexOffset + rgbOffset, iEnd = newElem.vertexOffset + newElem.vertexCount, j = 0; i < iEnd; i += vertLength, ++j) {
                        var lightValue = lighting == null ? 0x7f7f7f : lighting[j];
                        vertData[i] = StudioModel.encode2CompColor(lightValue & 0xff, albedoR);
                        vertData[i + 1] = StudioModel.encode2CompColor((lightValue >> 8) & 0xff, albedoG);
                        vertData[i + 2] = StudioModel.encode2CompColor((lightValue >> 16) & 0xff, albedoB);
                    }
                }
            }
            for (var _d = 0, matGroups_2 = matGroups; _d < matGroups_2.length; _d++) {
                var matGroup = matGroups_2[_d];
                WebGame.MeshManager.transform4F(matGroup, WebGame.VertexAttribute.position, function (pos) { return pos.applyMatrix4(transform); }, 1);
                WebGame.MeshManager.transform4F(matGroup, WebGame.VertexAttribute.normal, function (norm) { return norm.applyMatrix4(transform); }, 0);
                this.viewer.meshes.addMeshData(matGroup, function (index) { return _this.viewer.mapMaterialLoader.loadMaterial(index); }, handles);
            }
            return handles;
        };
        StudioModel.prototype.loadFromInfo = function (info, page) {
            this.info = info;
            this.page = page;
            this.dispatchOnLoadCallbacks();
        };
        StudioModel.prototype.isLoaded = function () { return this.info != null; };
        return StudioModel;
    }(WebGame.RenderResource));
    SourceUtils.StudioModel = StudioModel;
    var StudioModelPage = (function (_super) {
        __extends(StudioModelPage, _super);
        function StudioModelPage(page) {
            return _super.call(this, page) || this;
        }
        StudioModelPage.prototype.getMaterialGroup = function (index) {
            return this.matGroups[index];
        };
        StudioModelPage.prototype.onLoadValues = function (page) {
            this.models = page.models;
            this.matGroups = new Array(page.materials.length);
            for (var i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
                var matGroup = page.materials[i];
                this.matGroups[i] = WebGame.MeshManager.decompress(matGroup.meshData);
                for (var _i = 0, _a = this.matGroups[i].elements; _i < _a.length; _i++) {
                    var element = _a[_i];
                    element.material = matGroup.material;
                }
            }
            _super.prototype.onLoadValues.call(this, page);
        };
        StudioModelPage.prototype.onGetValue = function (index) {
            return this.models[index];
        };
        return StudioModelPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.StudioModelPage = StudioModelPage;
    var StudioModelLoader = (function (_super) {
        __extends(StudioModelLoader, _super);
        function StudioModelLoader(viewer) {
            var _this = _super.call(this) || this;
            _this.models = {};
            _this.viewer = viewer;
            return _this;
        }
        StudioModelLoader.prototype.update = function (requestQuota) {
            return _super.prototype.update.call(this, this.viewer.visLoader.getLoadProgress() < 1 ? 0 : requestQuota);
        };
        StudioModelLoader.prototype.loadModel = function (index) {
            var model = this.models[index];
            if (model !== undefined)
                return model;
            this.models[index] = model = new StudioModel(this.viewer);
            this.load(index, function (info, page) { return model.loadFromInfo(info, page); });
            return model;
        };
        StudioModelLoader.prototype.onCreatePage = function (page) {
            return new StudioModelPage(page);
        };
        return StudioModelLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.StudioModelLoader = StudioModelLoader;
    var VertexLightingPage = (function (_super) {
        __extends(VertexLightingPage, _super);
        function VertexLightingPage() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VertexLightingPage.prototype.onLoadValues = function (page) {
            this.props = new Array(page.props.length);
            for (var i = 0, iEnd = page.props.length; i < iEnd; ++i) {
                var srcProp = page.props[i];
                var dstProp = this.props[i] = srcProp == null ? null : new Array(srcProp.length);
                if (srcProp == null)
                    continue;
                for (var j = 0, jEnd = srcProp.length; j < jEnd; ++j) {
                    dstProp[j] = Facepunch.Utils.decompress(srcProp[j]);
                }
            }
            _super.prototype.onLoadValues.call(this, page);
        };
        VertexLightingPage.prototype.onGetValue = function (index) {
            return this.props[index];
        };
        return VertexLightingPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.VertexLightingPage = VertexLightingPage;
    var VertexLightingLoader = (function (_super) {
        __extends(VertexLightingLoader, _super);
        function VertexLightingLoader(viewer) {
            var _this = _super.call(this) || this;
            _this.viewer = viewer;
            return _this;
        }
        VertexLightingLoader.prototype.update = function (requestQuota) {
            return _super.prototype.update.call(this, this.viewer.visLoader.getLoadProgress() < 1 ? 0 : requestQuota);
        };
        VertexLightingLoader.prototype.onCreatePage = function (page) {
            return new VertexLightingPage(page);
        };
        return VertexLightingLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.VertexLightingLoader = VertexLightingLoader;
})(SourceUtils || (SourceUtils = {}));
var SourceUtils;
(function (SourceUtils) {
    var VisPage = (function (_super) {
        __extends(VisPage, _super);
        function VisPage() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        VisPage.prototype.onGetValue = function (index) {
            if (typeof (this.page.values[index]) === "string") {
                this.page.values[index] = Facepunch.Utils.decompress(this.page.values[index]);
            }
            return this.page.values[index];
        };
        return VisPage;
    }(SourceUtils.ResourcePage));
    SourceUtils.VisPage = VisPage;
    var VisLoader = (function (_super) {
        __extends(VisLoader, _super);
        function VisLoader() {
            var _this = _super.call(this) || this;
            _this.throwIfNotFound = false;
            return _this;
        }
        VisLoader.prototype.onCreatePage = function (page) {
            return new VisPage(page);
        };
        return VisLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.VisLoader = VisLoader;
})(SourceUtils || (SourceUtils = {}));
