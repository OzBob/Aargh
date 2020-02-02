/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Presentation = exports.Layer = exports.Frame = exports.LayerProperties = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _utils = require("../utils");

var _CameraState = require("./CameraState");

function copyIfSet(dest, src, prop) {
    if (src.hasOwnProperty(prop)) {
        dest[prop] = src[prop];
    }
}

var LayerProperties = exports.LayerProperties = {

    link: false,
    referenceElementId: "",
    outlineElementId: "",
    outlineElementAuto: true,
    transitionTimingFunction: "linear",
    transitionRelativeZoom: 0,
    transitionPathId: "",

    init: function init(frame) {
        this.frame = frame;
        return this;
    },
    initFrom: function initFrom(other) {
        this.frame = other.frame;
        this.link = other.link;
        this.referenceElementId = other.referenceElementId;
        this.outlineElementId = other.outlineElementId;
        this.outlineElementAuto = other.outlineElementAuto;
        this.transitionTimingFunction = other.transitionTimingFunction;
        this.transitionRelativeZoom = other.transitionRelativeZoom;
        this.transitionPathId = other.transitionPathId;
        return this;
    },
    toStorable: function toStorable() {
        return {
            link: this.link,
            referenceElementId: this.referenceElementId,
            outlineElementId: this.outlineElementId,
            outlineElementAuto: this.outlineElementAuto,
            transitionTimingFunction: this.transitionTimingFunction,
            transitionRelativeZoom: this.transitionRelativeZoom,
            transitionPathId: this.transitionPathId
        };
    },
    toMinimalStorable: function toMinimalStorable() {
        return {
            transitionTimingFunction: this.transitionTimingFunction,
            transitionRelativeZoom: this.transitionRelativeZoom,
            transitionPathId: this.transitionPathId
        };
    },
    fromStorable: function fromStorable(storable) {
        copyIfSet(this, storable, "link");
        copyIfSet(this, storable, "referenceElementId");
        copyIfSet(this, storable, "outlineElementId");
        copyIfSet(this, storable, "outlineElementAuto");
        copyIfSet(this, storable, "transitionTimingFunction");
        copyIfSet(this, storable, "transitionRelativeZoom");
        copyIfSet(this, storable, "transitionPathId");
        return this;
    },


    get index() {
        return this.frame.layerProperties.indexOf(this);
    },

    get referenceElement() {
        return this.frame.presentation.document.root.getElementById(this.referenceElementId);
    },

    get outlineElement() {
        return this.frame.presentation.document.root.getElementById(this.outlineElementId);
    },

    get transitionPath() {
        return this.frame.presentation.document.root.getElementById(this.transitionPathId);
    },

    get outlineElementHide() {
        return this.frame.presentation.elementsToHide.indexOf(this.outlineElementId) >= 0;
    },

    set outlineElementHide(hide) {
        if (this.outlineElement === this.frame.presentation.document.root) {
            return;
        }
        var hidden = this.outlineElementHide;
        if (hide && !hidden) {
            this.frame.presentation.elementsToHide.push(this.outlineElementId);
        } else if (!hide && hidden) {
            var index = this.frame.presentation.elementsToHide.indexOf(this.outlineElementId);
            this.frame.presentation.elementsToHide.splice(index, 1);
        }
        if (this.outlineElement) {
            this.outlineElement.style.visibility = hide ? "hidden" : "visible";
        }
    },

    get transitionPathHide() {
        return this.frame.presentation.elementsToHide.indexOf(this.transitionPathId) >= 0;
    },

    set transitionPathHide(hide) {
        var hidden = this.transitionPathHide;
        if (hide && !hidden) {
            this.frame.presentation.elementsToHide.push(this.transitionPathId);
        } else if (!hide && hidden) {
            var index = this.frame.presentation.elementsToHide.indexOf(this.transitionPathId);
            this.frame.presentation.elementsToHide.splice(index, 1);
        }
        if (this.transitionPath) {
            this.transitionPath.style.visibility = hide ? "hidden" : "visible";
        }
    }
};

var Frame = exports.Frame = {

    // Default values for new frames
    title: "New frame",
    titleLevel: 0,
    notes: "",
    timeoutMs: 0,
    timeoutEnable: false,
    transitionDurationMs: 1000,
    showInFrameList: true,
    showFrameNumber: true,

    init: function init(presentation) {
        var _this = this;

        this.presentation = presentation;
        this.frameId = presentation.makeFrameId();
        this.layerProperties = presentation.layers.map(function (lp) {
            return Object.create(LayerProperties).init(_this);
        });
        this.cameraStates = presentation.layers.map(function (cs) {
            return Object.create(_CameraState.CameraState).init(presentation.document.root);
        });
        return this;
    },
    initFrom: function initFrom(other, preserveId) {
        this.presentation = other.presentation;
        if (!preserveId) {
            this.frameId = other.presentation.makeFrameId();
        }
        this.title = other.title;
        this.titleLevel = other.titleLevel;
        this.notes = other.notes;
        this.timeoutMs = other.timeoutMs;
        this.timeoutEnable = other.timeoutEnable;
        this.transitionDurationMs = other.transitionDurationMs;
        this.showInFrameList = other.showInFrameList;
        this.showFrameNumber = other.showFrameNumber;
        this.layerProperties = other.layerProperties.map(function (lp) {
            return Object.create(LayerProperties).initFrom(lp);
        });
        this.cameraStates = other.cameraStates.map(function (cs) {
            return Object.create(_CameraState.CameraState).initFrom(cs);
        });
        return this;
    },
    toStorable: function toStorable() {
        var _this2 = this;

        var layerProperties = {};
        var cameraStates = {};
        var cameraOffsets = {};

        this.presentation.layers.forEach(function (layer, index) {
            var lp = _this2.layerProperties[index];
            var cs = _this2.cameraStates[index];
            var re = lp.referenceElement;

            var key = layer.groupId;
            layerProperties[key] = lp.toStorable();
            cameraStates[key] = cs.toStorable();
            if (re) {
                cameraOffsets[key] = _this2.cameraStates[index].offsetFromElement(re);
            }
        });

        return {
            frameId: this.frameId,
            title: this.title,
            titleLevel: this.titleLevel,
            notes: this.notes,
            timeoutMs: this.timeoutMs,
            timeoutEnable: this.timeoutEnable,
            transitionDurationMs: this.transitionDurationMs,
            showInFrameList: this.showInFrameList,
            showFrameNumber: this.showFrameNumber,
            layerProperties: layerProperties,
            cameraStates: cameraStates,
            cameraOffsets: cameraOffsets
        };
    },
    toMinimalStorable: function toMinimalStorable() {
        var _this3 = this;

        var layerProperties = {};
        var cameraStates = {};

        this.presentation.layers.forEach(function (layer, index) {
            var lp = _this3.layerProperties[index];
            var cs = _this3.cameraStates[index];

            var key = layer.groupId;
            layerProperties[key] = lp.toMinimalStorable();
            cameraStates[key] = cs.toMinimalStorable();
        });

        return {
            frameId: this.frameId,
            title: this.title,
            titleLevel: this.titleLevel,
            notes: this.notes,
            timeoutMs: this.timeoutMs,
            timeoutEnable: this.timeoutEnable,
            transitionDurationMs: this.transitionDurationMs,
            showInFrameList: this.showInFrameList,
            showFrameNumber: this.showFrameNumber,
            layerProperties: layerProperties,
            cameraStates: cameraStates
        };
    },
    fromStorable: function fromStorable(storable) {
        var _this4 = this;

        copyIfSet(this, storable, "frameId");
        copyIfSet(this, storable, "title");
        copyIfSet(this, storable, "titleLevel");
        copyIfSet(this, storable, "notes");
        copyIfSet(this, storable, "timeoutMs");
        copyIfSet(this, storable, "timeoutEnable");
        copyIfSet(this, storable, "transitionDurationMs");
        copyIfSet(this, storable, "showInFrameList");
        copyIfSet(this, storable, "showFrameNumber");

        // TODO if storable.layerProperties has keys not in layers, create fake layers marked as "deleted"
        this.presentation.layers.forEach(function (layer, index) {
            // If the current layer has been added to the SVG after the frame
            // was created, copy the properties of the "auto" layer.
            var key = layer.groupId in storable.layerProperties ? layer.groupId : "__sozi_auto__";
            if (key in storable.layerProperties) {
                var lp = _this4.layerProperties[index];
                lp.fromStorable(storable.layerProperties[key]);

                var cs = _this4.cameraStates[index].fromStorable(storable.cameraStates[key]);
                var re = lp.referenceElement;
                if (re) {
                    var ofs = storable.cameraOffsets[key] || {};
                    cs.setAtElement(re, ofs.deltaX, ofs.deltaY, ofs.widthFactor, ofs.heightFactor, ofs.deltaAngle);
                    // TODO compare current camera state with stored camera state.
                    // If different, mark the current layer as "dirty".
                }
            }
        });

        return this;
    },


    get index() {
        return this.presentation.frames.indexOf(this);
    },

    setAtStates: function setAtStates(states) {
        var _this5 = this;

        states.forEach(function (state, index) {
            _this5.cameraStates[index].initFrom(state);
        });
    },


    /*
     * Check whether the current frame is linked to the given frame
     * at the given layer index.
     *
     * Returns true if there is a sequence of frames, between the first
     * and the last of the two frames, where the link attribute is set
     * in the layer at the given index.
     */
    isLinkedTo: function isLinkedTo(frame, layerIndex) {
        var _ref = this.index < frame.index ? [this, frame] : [frame, this],
            _ref2 = _slicedToArray(_ref, 2),
            first = _ref2[0],
            second = _ref2[1];

        return second.layerProperties[layerIndex].link && (second.index === first.index + 1 || second.index > first.index && this.presentation.frames[second.index - 1].isLinkedTo(first, layerIndex));
    }
};

var Layer = exports.Layer = {
    init: function init(presentation, label, auto) {
        this.presentation = presentation;
        this.label = label;
        this.auto = auto;
        this.svgNodes = [];
        return this;
    },


    get groupId() {
        return this.auto ? "__sozi_auto__" : this.svgNodes[0].getAttribute("id");
    },

    get index() {
        return this.presentation.layers.indexOf(this);
    },

    get isVisible() {
        return this.svgNodes.some(function (node) {
            return window.getComputedStyle(node).display !== "none";
        });
    },

    set isVisible(visible) {
        this.svgNodes.forEach(function (node) {
            node.style.display = visible ? "inline" : "none";
        });
    },

    contains: function contains(svgElement) {
        return this.svgNodes.some(function (node) {
            return node.contains(svgElement);
        });
    }
};

// Constant: the SVG namespace
var SVG_NS = "http://www.w3.org/2000/svg";

var Presentation = exports.Presentation = {

    aspectWidth: 4,
    aspectHeight: 3,
    enableKeyboardZoom: true,
    enableKeyboardRotation: true,
    enableKeyboardNavigation: true,
    enableMouseTranslation: true,
    enableMouseZoom: true,
    enableMouseRotation: true,
    enableMouseNavigation: true,

    /*
     * Initialize a Sozi document object.
     *
     * Returns:
     *    - The current presentation object.
     */
    init: function init() {
        this.frames = [];
        this.layers = [];
        this.elementsToHide = [];
        return this;
    },
    setSVGDocument: function setSVGDocument(svgDocument) {
        var _this6 = this;

        this.document = svgDocument;

        // Create an empty wrapper layer for elements that do not belong to a valid layer
        var autoLayer = Object.create(Layer).init(this, "auto", true);

        (0, _utils.toArray)(this.document.root.childNodes).forEach(function (svgNode) {
            if (svgNode instanceof SVGGElement) {
                var nodeId = svgNode.getAttribute("id");
                if (nodeId === null) {
                    autoLayer.svgNodes.push(svgNode);
                } else {
                    // Add the current node as a new layer.
                    var layer = Object.create(Layer).init(_this6, _this6.document.handler.getLabel(svgNode) || "#" + nodeId, false);
                    layer.svgNodes.push(svgNode);
                    _this6.layers.push(layer);
                }
            }
        });

        this.layers.push(autoLayer);

        return this;
    },
    setInitialCameraState: function setInitialCameraState() {
        this.initialCameraState = Object.create(_CameraState.CameraState).init(this.document.root);
    },
    toStorable: function toStorable() {
        return {
            aspectWidth: this.aspectWidth,
            aspectHeight: this.aspectHeight,
            enableKeyboardZoom: this.enableKeyboardZoom,
            enableKeyboardRotation: this.enableKeyboardRotation,
            enableKeyboardNavigation: this.enableKeyboardNavigation,
            enableMouseTranslation: this.enableMouseTranslation,
            enableMouseZoom: this.enableMouseZoom,
            enableMouseRotation: this.enableMouseRotation,
            enableMouseNavigation: this.enableMouseNavigation,
            frames: this.frames.map(function (frame) {
                return frame.toStorable();
            }),
            elementsToHide: this.elementsToHide.slice()
        };
    },
    toMinimalStorable: function toMinimalStorable() {
        return {
            enableKeyboardZoom: this.enableKeyboardZoom,
            enableKeyboardRotation: this.enableKeyboardRotation,
            enableKeyboardNavigation: this.enableKeyboardNavigation,
            enableMouseTranslation: this.enableMouseTranslation,
            enableMouseZoom: this.enableMouseZoom,
            enableMouseRotation: this.enableMouseRotation,
            enableMouseNavigation: this.enableMouseNavigation,
            frames: this.frames.map(function (frame) {
                return frame.toMinimalStorable();
            }),
            elementsToHide: this.elementsToHide.slice()
        };
    },
    fromStorable: function fromStorable(storable) {
        var _this7 = this;

        copyIfSet(this, storable, "aspectWidth");
        copyIfSet(this, storable, "aspectHeight");
        copyIfSet(this, storable, "enableKeyboardZoom");
        copyIfSet(this, storable, "enableKeyboardRotation");
        copyIfSet(this, storable, "enableKeyboardNavigation");
        copyIfSet(this, storable, "enableMouseTranslation");
        copyIfSet(this, storable, "enableMouseZoom");
        copyIfSet(this, storable, "enableMouseRotation");
        copyIfSet(this, storable, "enableMouseNavigation");

        this.frames = storable.frames.map(function (f) {
            return Object.create(Frame).init(_this7).fromStorable(f);
        });

        if (storable.elementsToHide) {
            this.elementsToHide = storable.elementsToHide.slice();
        }

        return this;
    },


    get title() {
        var svgTitles = this.document.root.getElementsByTagNameNS(SVG_NS, "title");
        return svgTitles.length ? svgTitles[0].firstChild.wholeText.trim() : "Untitled";
    },

    makeFrameId: function makeFrameId() {
        var prefix = "frame";
        var suffix = Math.floor(1000 * (1 + 9 * Math.random()));
        var frameId = void 0;
        do {
            frameId = prefix + suffix;
            suffix++;
        } while (this.frames.some(function (frame) {
            return frame.frameId === frameId;
        }));
        return frameId;
    },
    getFrameWithId: function getFrameWithId(frameId) {
        for (var i = 0; i < this.frames.length; i++) {
            if (this.frames[i].frameId === frameId) {
                return this.frames[i];
            }
        }
        return null;
    },
    getLayerWithId: function getLayerWithId(groupId) {
        for (var i = 0; i < this.layers.length; i++) {
            if (this.layers[i].groupId === groupId) {
                return this.layers[i];
            }
        }
        return null;
    },
    updateLinkedLayers: function updateLinkedLayers() {
        var _this8 = this;

        if (!this.frames.length) {
            return;
        }

        var firstCameraStates = this.frames[0].cameraStates;
        var defaultCameraState = firstCameraStates[firstCameraStates.length - 1];

        var firstLayerProperties = this.frames[0].layerProperties;
        var defaultLayerProperties = firstLayerProperties[firstLayerProperties.length - 1];

        this.layers.forEach(function (layer, layerIndex) {
            var cameraState = defaultCameraState;
            var layerProperties = defaultLayerProperties;

            _this8.frames.forEach(function (frame) {
                if (frame.layerProperties[layerIndex].link) {
                    frame.cameraStates[layerIndex].initFrom(cameraState);
                    frame.layerProperties[layerIndex].referenceElementId = layerProperties.referenceElementId;
                    frame.layerProperties[layerIndex].outlineElementId = layerProperties.outlineElementId;
                } else {
                    cameraState = frame.cameraStates[layerIndex];
                    layerProperties = frame.layerProperties[layerIndex];
                }
            });
        });
    }
};
