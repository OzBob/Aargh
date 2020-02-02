/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function copyIfSet(dest, src, prop) {
    if (src.hasOwnProperty(prop)) {
        dest[prop] = src[prop];
    }
}

var CameraState = exports.CameraState = {
    opacity: 1.0,
    clipped: false,
    clipXOffset: 0,
    clipYOffset: 0,
    clipWidthFactor: 1,
    clipHeightFactor: 1,

    set width(w) {
        this._width = !isNaN(w) && w >= 1 ? w : 1;
    },

    get width() {
        return this._width;
    },

    set height(h) {
        this._height = !isNaN(h) && h >= 1 ? h : 1;
    },

    get height() {
        return this._height;
    },

    /*
     * Set the angle of the current camera state.
     * The angle of the current state is normalized
     * in the interval [-180 ; 180]
     */
    set angle(a) {
        this._angle = !isNaN(a) ? (a + 180) % 360 : 180;
        if (this._angle < 0) {
            this._angle += 180;
        } else {
            this._angle -= 180;
        }
    },

    get angle() {
        return this._angle;
    },

    init: function init(svgRoot) {
        this.svgRoot = svgRoot;

        var initialBBox = svgRoot.getBBox();

        // Center coordinates
        this.cx = initialBBox.x + initialBBox.width / 2;
        this.cy = initialBBox.y + initialBBox.height / 2;

        // Dimensions
        this.width = initialBBox.width;
        this.height = initialBBox.height;

        this.angle = 0;

        return this;
    },
    initFrom: function initFrom(state) {
        this.svgRoot = state.svgRoot;
        this.cx = state.cx;
        this.cy = state.cy;
        this.width = state.width;
        this.height = state.height;
        this.opacity = state.opacity;
        this.angle = state.angle;
        this.clipped = state.clipped;
        this.clipXOffset = state.clipXOffset;
        this.clipYOffset = state.clipYOffset;
        this.clipWidthFactor = state.clipWidthFactor;
        this.clipHeightFactor = state.clipHeightFactor;
        return this;
    },
    toStorable: function toStorable() {
        return {
            cx: this.cx,
            cy: this.cy,
            width: this.width,
            height: this.height,
            opacity: this.opacity,
            angle: this.angle,
            clipped: this.clipped,
            clipXOffset: this.clipXOffset,
            clipYOffset: this.clipYOffset,
            clipWidthFactor: this.clipWidthFactor,
            clipHeightFactor: this.clipHeightFactor
        };
    },
    toMinimalStorable: function toMinimalStorable() {
        return this.toStorable();
    },
    fromStorable: function fromStorable(storable) {
        copyIfSet(this, storable, "cx");
        copyIfSet(this, storable, "cy");
        copyIfSet(this, storable, "width");
        copyIfSet(this, storable, "height");
        copyIfSet(this, storable, "opacity");
        copyIfSet(this, storable, "angle");
        copyIfSet(this, storable, "clipped");
        copyIfSet(this, storable, "clipXOffset");
        copyIfSet(this, storable, "clipYOffset");
        copyIfSet(this, storable, "clipWidthFactor");
        copyIfSet(this, storable, "clipHeightFactor");
        return this;
    },


    /*
     * Set the current camera's properties to the given SVG element.
     *
     * Otherwise, the properties of the frame are based on the bounding box
     * of the given element.
     *
     * Parameters:
     *    - svgElement: an element from the SVG DOM
     */
    setAtElement: function setAtElement(svgElement) {
        var deltaX = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var deltaY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var widthFactor = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
        var heightFactor = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
        var deltaAngle = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;

        // Read the raw bounding box of the given SVG element
        var bbox = svgElement.getBBox();

        // Compute the raw coordinates of the center
        // of the given SVG element
        var bboxCenter = this.svgRoot.createSVGPoint();
        bboxCenter.x = bbox.x + bbox.width / 2;
        bboxCenter.y = bbox.y + bbox.height / 2;

        // Find the transform group corresponding to the layer
        // that contains the given element
        var layerGroup = svgElement;
        while (layerGroup.parentNode.parentNode !== this.svgRoot) {
            layerGroup = layerGroup.parentNode;
        }

        // Compute the coordinates of the center of the given SVG element
        // after its current transformation
        var matrix = layerGroup.getCTM().inverse().multiply(svgElement.getCTM());
        bboxCenter = bboxCenter.matrixTransform(matrix);

        // Compute the scaling factor applied to the given SVG element
        var scale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);

        // Update the camera to match the bounding box information of the
        // given SVG element after its current transformation
        this.cx = bboxCenter.x + deltaX;
        this.cy = bboxCenter.y + deltaY;
        this.width = bbox.width * scale * widthFactor;
        this.height = bbox.height * scale * heightFactor;
        this.angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI + deltaAngle;

        return this;
    },
    resetClipping: function resetClipping() {
        this.clipXOffset = this.clipYOffset = 0;
        this.clipWidthFactor = this.clipHeightFactor = 1;
        return this;
    },
    offsetFromElement: function offsetFromElement(svgElement) {
        var cam = Object.create(CameraState).init(this.svgRoot).setAtElement(svgElement);
        return {
            deltaX: this.cx - cam.cx,
            deltaY: this.cy - cam.cy,
            widthFactor: this.width / cam.width,
            heightFactor: this.height / cam.height,
            deltaAngle: this.angle - cam.angle
        };
    },
    applyOffset: function applyOffset(_ref) {
        var deltaX = _ref.deltaX,
            deltaY = _ref.deltaY,
            widthFactor = _ref.widthFactor,
            heightFactor = _ref.heightFactor,
            deltaAngle = _ref.deltaAngle;

        this.cx -= deltaX;
        this.cy -= deltaY;
        this.width /= widthFactor;
        this.height /= heightFactor;
        this.angle -= deltaAngle;
        return this;
    }
};
