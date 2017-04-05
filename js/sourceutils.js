var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
            _this.isStatic = true;
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
    var WebGame = Facepunch.WebGame;
    var Entities;
    (function (Entities) {
        var BrushEntity = (function (_super) {
            __extends(BrushEntity, _super);
            function BrushEntity(map, info) {
                var _this = _super.call(this) || this;
                _this.map = map;
                _this.info = info;
                _this.model = map.viewer.bspModelLoader.load(info.modelUrl);
                _this.model.addUsage(_this);
                return _this;
            }
            BrushEntity.prototype.isInCluster = function (cluster) {
                var clusters = this.info.clusters;
                if (clusters == null)
                    return false;
                for (var i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    if (clusters[i] === cluster)
                        return true;
                }
                return false;
            };
            BrushEntity.prototype.isInAnyCluster = function (clusters) {
                if (clusters == null)
                    return false;
                for (var i = 0, iEnd = clusters.length; i < iEnd; ++i) {
                    if (this.isInCluster(clusters[i]))
                        return true;
                }
                return false;
            };
            BrushEntity.prototype.populateDrawList = function (drawList, clusters) {
                if (!this.isInAnyCluster(clusters))
                    return;
                drawList.addItem(this);
                this.onPopulateDrawList(drawList, clusters);
            };
            BrushEntity.prototype.onPopulateDrawList = function (drawList, pvsClusters) {
                var leaves = this.model.getLeaves();
                if (leaves != null)
                    drawList.addItems(leaves);
            };
            return BrushEntity;
        }(WebGame.DrawableEntity));
        Entities.BrushEntity = BrushEntity;
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
            return Worldspawn;
        }(BrushEntity));
        Entities.Worldspawn = Worldspawn;
    })(Entities = SourceUtils.Entities || (SourceUtils.Entities = {}));
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
                this.pages[i] = this.createPage(pages[i]);
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
            var _loop_2 = function (i, iEnd) {
                var matGroup = page.materials[i];
                var mat = this_2.viewer.materialLoader.load(matGroup.materialUrl);
                var data = WebGame.MeshManager.decompress(matGroup.meshData);
                this_2.matGroups[i] = this_2.viewer.meshes.addMeshData(data, function (index) { return mat; });
            };
            var this_2 = this;
            for (var i = 0, iEnd = page.materials.length; i < iEnd; ++i) {
                _loop_2(i, iEnd);
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
        LeafGeometryLoader.prototype.createPage = function (page) {
            return new LeafGeometryPage(this.viewer, page);
        };
        return LeafGeometryLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.LeafGeometryLoader = LeafGeometryLoader;
})(SourceUtils || (SourceUtils = {}));
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
            this.viewer.visLoader.setPageLayout(info.visPages);
            this.lightmap = this.viewer.textureLoader.load(info.lightmapUrl);
            for (var i = 0, iEnd = info.brushEntities.length; i < iEnd; ++i) {
                var ent = info.brushEntities[i];
                switch (ent.classname) {
                    case "worldspawn":
                        this.worldspawn = new SourceUtils.Entities.Worldspawn(this, ent);
                        this.lightmap.addUsage(this.worldspawn);
                        break;
                }
            }
            this.viewer.forceDrawListInvalidation(true);
        };
        Map.prototype.populateDrawList = function (drawList, camera) {
            var _this = this;
            if (this.worldspawn == null)
                return;
            var vis = null;
            var pos = Facepunch.Vector3.pool.create();
            if (this.worldspawn.model != null) {
                var leaf = this.worldspawn.model.getLeafAt(camera.getPosition(pos));
                if (leaf != null && leaf.cluster !== undefined) {
                    var cluster_1 = leaf.cluster;
                    vis = this.clusterVis[cluster_1];
                    if (vis == null) {
                        var immediate_1 = true;
                        this.viewer.visLoader.load(cluster_1, function (loaded) {
                            _this.clusterVis[cluster_1] = vis = loaded;
                            if (!immediate_1)
                                _this.viewer.forceDrawListInvalidation(true);
                        });
                        immediate_1 = false;
                        if (vis == null) {
                            this.clusterVis[cluster_1] = vis = [cluster_1];
                        }
                    }
                }
            }
            this.worldspawn.populateDrawList(drawList, vis);
            pos.release();
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
/// <reference path="../js/facepunch.webgame.d.ts"/>
var SourceUtils;
(function (SourceUtils) {
    var WebGame = Facepunch.WebGame;
    var MapViewer = (function (_super) {
        __extends(MapViewer, _super);
        function MapViewer() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.map = new SourceUtils.Map(_this);
            _this.leafGeometryLoader = _this.addLoader(new SourceUtils.LeafGeometryLoader(_this));
            _this.bspModelLoader = _this.addLoader(new SourceUtils.BspModelLoader(_this));
            _this.visLoader = _this.addLoader(new SourceUtils.VisLoader());
            _this.time = 0;
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
            this.mainCamera = new WebGame.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 1, 8192);
            this.mainRenderContext = new WebGame.RenderContext(this);
            _super.prototype.onInitialize.call(this);
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
            this.map.populateDrawList(drawList, camera);
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
        var LightmappedGenericMaterial = (function (_super) {
            __extends(LightmappedGenericMaterial, _super);
            function LightmappedGenericMaterial() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.basetexture = null;
                return _this;
            }
            return LightmappedGenericMaterial;
        }(BaseMaterial));
        Shaders.LightmappedGenericMaterial = LightmappedGenericMaterial;
        var LightmappedGeneric = (function (_super) {
            __extends(LightmappedGeneric, _super);
            function LightmappedGeneric(context) {
                var _this = _super.call(this, context, LightmappedGenericMaterial) || this;
                _this.uProjection = _this.addUniform("uProjection", WebGame.UniformMatrix4);
                _this.uView = _this.addUniform("uView", WebGame.UniformMatrix4);
                _this.uModel = _this.addUniform("uModel", WebGame.UniformMatrix4);
                _this.uBaseTexture = _this.addUniform("uBaseTexture", WebGame.UniformSampler);
                _this.uLightmap = _this.addUniform("uLightmap", WebGame.UniformSampler);
                _this.uLightmapParams = _this.addUniform("uLightmapParams", WebGame.Uniform4F);
                var gl = context;
                _this.includeShaderSource(gl.VERTEX_SHADER, LightmappedGeneric.vertSource);
                _this.includeShaderSource(gl.FRAGMENT_SHADER, LightmappedGeneric.fragSource);
                _this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                _this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                _this.addAttribute("aLightmapCoord", WebGame.VertexAttribute.uv2);
                _this.uBaseTexture.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                _this.uLightmap.setDefault(WebGame.TextureUtils.getWhiteTexture(context));
                _this.compile();
                return _this;
            }
            LightmappedGeneric.prototype.bufferSetup = function (buf) {
                _super.prototype.bufferSetup.call(this, buf);
                this.uProjection.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                this.uView.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
                this.uLightmap.bufferParameter(buf, SourceUtils.Map.lightmapParam);
                this.uLightmapParams.bufferParameter(buf, SourceUtils.Map.lightmapInfoParam);
            };
            LightmappedGeneric.prototype.bufferModelMatrix = function (buf, value) {
                _super.prototype.bufferModelMatrix.call(this, buf, value);
                this.uModel.bufferValue(buf, false, value);
            };
            LightmappedGeneric.prototype.bufferMaterialProps = function (buf, props) {
                _super.prototype.bufferMaterialProps.call(this, buf, props);
                this.uBaseTexture.bufferValue(buf, props.basetexture);
            };
            return LightmappedGeneric;
        }(BaseShaderProgram));
        LightmappedGeneric.vertSource = "\n                attribute vec3 aPosition;\n                attribute vec2 aTextureCoord;\n                attribute vec2 aLightmapCoord;\n\n                varying vec2 vTextureCoord;\n                varying vec2 vLightmapCoord;\n\n                uniform mat4 uProjection;\n                uniform mat4 uView;\n                uniform mat4 uModel;\n\n                void main()\n                {\n                    vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);\n\n                    gl_Position = uProjection * viewPos;\n\n                    vTextureCoord = aTextureCoord;\n                    vLightmapCoord = aLightmapCoord;\n                }";
        LightmappedGeneric.fragSource = "\n                precision mediump float;\n\n                varying float vDepth;\n                varying vec2 vTextureCoord;\n                varying vec2 vLightmapCoord;\n\n                uniform sampler2D uBaseTexture;\n\n                uniform sampler2D uLightmap;\n                uniform vec4 uLightmapParams;\n\n                vec3 DecompressLightmapSample(vec4 sample)\n                {\n                    float exp = sample.a * 255.0 - 128.0;\n                    return sample.rgb * pow(2.0, exp);\n                }\n\n                vec3 ApplyLightmap(vec3 inColor)\n                {\n                    const float gamma = 0.5;\n\n                    vec2 size = uLightmapParams.xy;\n                    vec2 invSize = uLightmapParams.zw;\n                    vec2 scaledCoord = vLightmapCoord * size;\n                    vec2 minCoord = floor(scaledCoord);\n                    vec2 maxCoord = minCoord + vec2(1.0, 1.0);\n                    vec2 delta = scaledCoord - minCoord;\n\n                    minCoord *= invSize;\n                    maxCoord *= invSize;\n\n                    vec3 sampleA = DecompressLightmapSample(texture2D(uLightmap, vec2(minCoord.x, minCoord.y)));\n                    vec3 sampleB = DecompressLightmapSample(texture2D(uLightmap, vec2(maxCoord.x, minCoord.y)));\n                    vec3 sampleC = DecompressLightmapSample(texture2D(uLightmap, vec2(minCoord.x, maxCoord.y)));\n                    vec3 sampleD = DecompressLightmapSample(texture2D(uLightmap, vec2(maxCoord.x, maxCoord.y)));\n\n                    vec3 sample = mix(mix(sampleA, sampleB, delta.x), mix(sampleC, sampleD, delta.x), delta.y);\n\n                    return inColor * pow(sample, vec3(gamma, gamma, gamma));\n                }\n\n                void main()\n                {\n                    vec4 baseSample = texture2D(uBaseTexture, vTextureCoord);\n                    vec3 lightmapped = ApplyLightmap(baseSample.rgb);\n\n                    gl_FragColor = vec4(lightmapped, 1);\n                }";
        Shaders.LightmappedGeneric = LightmappedGeneric;
    })(Shaders = SourceUtils.Shaders || (SourceUtils.Shaders = {}));
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
        VisLoader.prototype.createPage = function (page) {
            return new VisPage(page);
        };
        return VisLoader;
    }(SourceUtils.PagedLoader));
    SourceUtils.VisLoader = VisLoader;
})(SourceUtils || (SourceUtils = {}));
