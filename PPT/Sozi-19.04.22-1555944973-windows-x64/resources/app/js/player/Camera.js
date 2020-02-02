/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Camera = undefined;

var _CameraState = require("../model/CameraState");

// Constant: the Sozi namespace
var SVG_NS = "http://www.w3.org/2000/svg";

var Camera = exports.Camera = Object.create(_CameraState.CameraState);

Camera.init = function (viewport, layer) {
    _CameraState.CameraState.init.call(this, viewport.svgRoot);

    this.viewport = viewport;
    this.layer = layer;
    this.selected = true;

    // The clipping rectangle of this camera
    this.svgClipRect = document.createElementNS(SVG_NS, "rect");

    var svgClipId = void 0;

    if (viewport.editMode) {
        // In edit mode, we set up a mask outside the clipping rectangle.
        // This value allows to set the opacity of the mask.
        this.maskValue = 0;

        var svgMask = document.createElementNS(SVG_NS, "mask");
        svgClipId = viewport.makeUniqueId("sozi-mask-");
        svgMask.setAttribute("id", svgClipId);
        viewport.svgRoot.appendChild(svgMask);

        this.svgMaskRect = document.createElementNS(SVG_NS, "rect");
        svgMask.appendChild(this.svgMaskRect);

        this.svgClipRect.setAttribute("fill", "white");
        svgMask.appendChild(this.svgClipRect);

        // We also define two rectangles that will show the outline
        // of the clipped region in alternating white and black dashes.
        this.svgClipOutlineRect1 = document.createElementNS(SVG_NS, "rect");
        this.svgClipOutlineRect1.setAttribute("stroke", "black");
        this.svgClipOutlineRect1.setAttribute("fill", "none");
        viewport.svgRoot.appendChild(this.svgClipOutlineRect1);

        this.svgClipOutlineRect2 = document.createElementNS(SVG_NS, "rect");
        this.svgClipOutlineRect2.setAttribute("stroke", "white");
        this.svgClipOutlineRect2.setAttribute("fill", "none");
        this.svgClipOutlineRect2.setAttribute("stroke-dasharray", "2,2");
        viewport.svgRoot.appendChild(this.svgClipOutlineRect2);

        this.concealClipping();
    } else {
        // When playing the presentation, we use the default SVG
        // clipping technique.
        var svgClipPath = document.createElementNS(SVG_NS, "clipPath");
        svgClipId = viewport.makeUniqueId("sozi-clip-path-");
        svgClipPath.setAttribute("id", svgClipId);
        svgClipPath.appendChild(this.svgClipRect);
        viewport.svgRoot.appendChild(svgClipPath);
    }

    // The groups that will support transformations
    this.svgTransformGroups = layer.svgNodes.map(function (svgNode) {
        // The group that will support the clipping operation
        var svgClippedGroup = document.createElementNS(SVG_NS, "g");
        viewport.svgRoot.insertBefore(svgClippedGroup, svgNode);

        if (viewport.editMode) {
            svgClippedGroup.setAttribute("mask", "url(#" + svgClipId + ")");
        } else {
            svgClippedGroup.setAttribute("clip-path", "url(#" + svgClipId + ")");
        }

        var svgGroup = document.createElementNS(SVG_NS, "g");
        svgGroup.appendChild(svgNode);
        svgClippedGroup.appendChild(svgGroup);
        return svgGroup;
    });

    return this;
};

Camera.revealClipping = function () {
    this.maskValue = 64;
    this.svgClipOutlineRect1.style.display = "inline";
    this.svgClipOutlineRect2.style.display = "inline";
};

Camera.concealClipping = function () {
    this.maskValue = 0;
    this.svgClipOutlineRect1.style.display = "none";
    this.svgClipOutlineRect2.style.display = "none";
};

Object.defineProperty(Camera, "scale", {
    get: function get() {
        return Math.min(this.viewport.width / this.width, this.viewport.height / this.height);
    }
});

Camera.rotate = function (angle) {
    this.restoreAspectRatio();
    this.angle += angle;
    return this.update();
};

Camera.zoom = function (factor, x, y) {
    this.width /= factor;
    this.height /= factor;
    this.restoreAspectRatio();
    return this.translate((1 - factor) * (x - this.viewport.width / 2), (1 - factor) * (y - this.viewport.height / 2));
};

Camera.translate = function (deltaX, deltaY) {
    var scale = this.scale;
    var angleRad = this.angle * Math.PI / 180;
    var si = Math.sin(angleRad);
    var co = Math.cos(angleRad);
    this.cx -= (deltaX * co - deltaY * si) / scale;
    this.cy -= (deltaX * si + deltaY * co) / scale;
    this.restoreAspectRatio();
    return this.update();
};

Camera.clip = function (x0, y0, x1, y1) {
    this.clipped = true;
    var scale = this.scale;
    var clipWidth = Math.abs(x1 - x0) + 1;
    var clipHeight = Math.abs(y1 - y0) + 1;
    this.clipXOffset = (Math.min(x0, x1) - (this.viewport.width - clipWidth) / 2) * this.width / clipWidth;
    this.clipYOffset = (Math.min(y0, y1) - (this.viewport.height - clipHeight) / 2) * this.height / clipHeight;
    this.clipWidthFactor = clipWidth / this.width / scale;
    this.clipHeightFactor = clipHeight / this.height / scale;
    return this.update();
};

Camera.restoreAspectRatio = function () {
    var viewportRatio = this.viewport.width / this.viewport.height;
    var camRatio = this.width / this.height;
    var ratio = viewportRatio / camRatio;
    if (ratio > 1) {
        this.width *= ratio;
        if (this.clipped) {
            this.clipWidthFactor /= ratio;
        }
    } else {
        this.height /= ratio;
        if (this.clipped) {
            this.clipHeightFactor *= ratio;
        }
    }
};

Camera.getCandidateReferenceElement = function () {
    // getIntersectionList is not supported in Gecko
    if (!this.layer.svgNodes.length || !this.svgRoot.getIntersectionList) {
        return { element: null, score: null };
    }

    // Get all elements that intersect with the viewport.
    var viewportRect = this.svgRoot.createSVGRect();
    viewportRect.x = 0;
    viewportRect.y = 0;
    viewportRect.width = this.viewport.width;
    viewportRect.height = this.viewport.height;
    var viewportArea = this.viewport.width * this.viewport.height;

    var intersectionList = this.svgRoot.getIntersectionList(viewportRect, this.layer.svgNodes[0]);

    // Find the element which bounding box best fits in the viewport.
    var element = null;
    var score = null;

    for (var i = 0; i < intersectionList.length; i++) {
        var elt = intersectionList[i];
        if (elt.hasAttribute("id")) {
            // TODO getBoundingClientRect returns bounding box of bounding box
            var eltRect = elt.getBoundingClientRect();
            var eltArea = eltRect.width * eltRect.height;

            // Compute the intersection of the element's bounding
            // box with the current viewport.
            var l = Math.max(eltRect.left, this.viewport.x);
            var t = Math.max(eltRect.top, this.viewport.y);
            var r = Math.min(eltRect.right, this.viewport.x + this.viewport.width);
            var b = Math.min(eltRect.bottom, this.viewport.y + this.viewport.height);

            var intersectArea = (r - l) * (b - t);

            // An element is selected if it has the biggest intersect area
            // and the smallest area outside the intersection.
            var eltScore = viewportArea + eltArea - 2 * intersectArea;
            if (score === null || eltScore < score) {
                score = eltScore;
                element = elt;
            }
        }
    }

    return { element: element, score: score };
};

Object.defineProperty(Camera, "clipRect", {
    get: function get() {
        var width = void 0,
            height = void 0,
            x = void 0,
            y = void 0;
        if (this.clipped) {
            var scale = this.scale;
            width = Math.round(this.width * this.clipWidthFactor * scale);
            height = Math.round(this.height * this.clipHeightFactor * scale);
            x = Math.round((this.viewport.width - width) / 2 + this.clipXOffset * this.clipWidthFactor * scale);
            y = Math.round((this.viewport.height - height) / 2 + this.clipYOffset * this.clipHeightFactor * scale);
        } else {
            width = this.viewport.width;
            height = this.viewport.height;
            x = 0;
            y = 0;
        }
        return { width: width, height: height, x: x, y: y };
    }
});

Camera.update = function () {
    var _this = this;

    // Adjust the location and size of the clipping rectangle
    var rect = this.clipRect;
    this.svgClipRect.setAttribute("x", rect.x);
    this.svgClipRect.setAttribute("y", rect.y);
    this.svgClipRect.setAttribute("width", rect.width);
    this.svgClipRect.setAttribute("height", rect.height);

    if (this.viewport.editMode) {
        this.svgMaskRect.setAttribute("fill", "rgb(" + this.maskValue + "," + this.maskValue + "," + this.maskValue + ")");
        this.svgMaskRect.setAttribute("x", 0);
        this.svgMaskRect.setAttribute("y", 0);
        this.svgMaskRect.setAttribute("width", this.viewport.width);
        this.svgMaskRect.setAttribute("height", this.viewport.height);

        this.svgClipOutlineRect1.setAttribute("x", rect.x);
        this.svgClipOutlineRect1.setAttribute("y", rect.y);
        this.svgClipOutlineRect1.setAttribute("width", rect.width);
        this.svgClipOutlineRect1.setAttribute("height", rect.height);

        this.svgClipOutlineRect2.setAttribute("x", rect.x);
        this.svgClipOutlineRect2.setAttribute("y", rect.y);
        this.svgClipOutlineRect2.setAttribute("width", rect.width);
        this.svgClipOutlineRect2.setAttribute("height", rect.height);
    }

    // Compute and apply the geometrical transformation to the layer group
    var scale = this.scale;
    var translateX = this.viewport.width / scale / 2 - this.cx;
    var translateY = this.viewport.height / scale / 2 - this.cy;

    this.svgTransformGroups.forEach(function (svgGroup) {
        svgGroup.setAttribute("transform", "scale(" + scale + ")" + "translate(" + translateX + "," + translateY + ")" + "rotate(" + -_this.angle + ',' + _this.cx + "," + _this.cy + ")");
        svgGroup.setAttribute("opacity", _this.opacity);
    });

    return this;
};

Camera.interpolate = function (initialState, finalState, progress, timingFunction, relativeZoom, svgPath, reversePath) {
    var tfProgress = timingFunction(progress);
    var tfRemaining = 1 - tfProgress;

    function linear(initial, final) {
        return final * tfProgress + initial * tfRemaining;
    }

    function quadratic(u0, u1) {
        var um = (relativeZoom > 0 ? Math.min(u0, u1) : Math.max(u0, u1)) * (1 - relativeZoom);
        var du0 = u0 - um;
        var du1 = u1 - um;
        var r = Math.sqrt(du0 / du1);
        var tm = r / (1 + r);
        var k = du0 / tm / tm;
        var dt = progress - tm;
        return k * dt * dt + um;
    }

    // Interpolate camera width and height
    if (relativeZoom) {
        this.width = quadratic(initialState.width, finalState.width);
        this.height = quadratic(initialState.height, finalState.height);
    } else {
        this.width = linear(initialState.width, finalState.width);
        this.height = linear(initialState.height, finalState.height);
    }

    // Interpolate camera location
    if (svgPath) {
        var pathLength = svgPath.getTotalLength();
        var startPoint = svgPath.getPointAtLength(reversePath ? pathLength : 0);
        var endPoint = svgPath.getPointAtLength(reversePath ? 0 : pathLength);
        var currentPoint = svgPath.getPointAtLength(pathLength * (reversePath ? tfRemaining : tfProgress));

        this.cx = currentPoint.x + linear(initialState.cx - startPoint.x, finalState.cx - endPoint.x);
        this.cy = currentPoint.y + linear(initialState.cy - startPoint.y, finalState.cy - endPoint.y);
    } else {
        this.cx = linear(initialState.cx, finalState.cx);
        this.cy = linear(initialState.cy, finalState.cy);
    }

    // Interpolate opacity
    this.opacity = linear(initialState.opacity, finalState.opacity);

    // Interpolate camera angle
    // Keep the smallest angle between the initial and final states
    if (finalState.angle - initialState.angle > 180) {
        this.angle = linear(initialState.angle, finalState.angle - 360);
    } else if (finalState.angle - initialState.angle < -180) {
        this.angle = linear(initialState.angle - 360, finalState.angle);
    } else {
        this.angle = linear(initialState.angle, finalState.angle);
    }

    // Interpolate clip rectangle
    this.clipped = true;
    var scale = this.scale;
    var clipDefaults = {
        clipXOffset: 0,
        clipYOffset: 0,
        clipWidthFactor: this.viewport.width / this.width / scale,
        clipHeightFactor: this.viewport.height / this.height / scale
    };
    var initialClipping = initialState.clipped ? initialState : clipDefaults;
    var finalClipping = finalState.clipped ? finalState : clipDefaults;
    for (var clipProp in clipDefaults) {
        this[clipProp] = linear(initialClipping[clipProp], finalClipping[clipProp]);
    }
};
