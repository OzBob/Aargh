/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/*
 * The Selection object holds the currently selected
 * frames and layers of the presentation.
 *
 * Events:
 *  - change: when the content of the selection has changed
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});
var Selection = exports.Selection = {

    /*
     * Initialize a selection for a given presentation.
     *
     * The selection is initialized with the first frame
     * and all layers.
     *
     * Parameters:
     *  - pres: A Sozi presentation object
     *
     * Returns:
     *  - The current selection object
     */
    init: function init(presentation) {
        this.presentation = presentation;
        this.selectedFrames = [];
        this.selectedLayers = [];
        return this;
    },
    toStorable: function toStorable() {
        return {
            selectedFrames: this.selectedFrames.map(function (frame) {
                return frame.frameId;
            }),
            selectedLayers: this.selectedLayers.map(function (layer) {
                return layer.groupId;
            })
        };
    },
    fromStorable: function fromStorable(storable) {
        var _this = this;

        if ("selectedFrames" in storable) {
            this.selectedFrames = [];
            storable.selectedFrames.forEach(function (frameId) {
                var frame = _this.presentation.getFrameWithId(frameId);
                if (frame) {
                    _this.selectedFrames.push(frame);
                }
            });
        }

        if ("selectedLayers" in storable) {
            this.selectedLayers = [];
            storable.selectedLayers.forEach(function (groupId) {
                var layer = _this.presentation.getLayerWithId(groupId);
                if (layer) {
                    _this.selectedLayers.push(layer);
                }
            });
        }
    },


    /*
     * Get the last selected frame.
     *
     * Returns:
     *  - The frame that has been selected last, null if no frame is selected.
     */
    get currentFrame() {
        return this.selectedFrames.length ? this.selectedFrames[this.selectedFrames.length - 1] : null;
    },

    hasFrames: function hasFrames(frames) {
        var _this2 = this;

        return frames.every(function (frame) {
            return _this2.selectedFrames.indexOf(frame) >= 0;
        });
    },
    addFrame: function addFrame(frame) {
        if (this.selectedFrames.indexOf(frame) < 0) {
            this.selectedFrames.push(frame);
        }
    },
    removeFrame: function removeFrame(frame) {
        var index = this.selectedFrames.indexOf(frame);
        if (index >= 0) {
            this.selectedFrames.splice(index, 1);
        }
    },
    toggleFrameSelection: function toggleFrameSelection(frame) {
        var index = this.selectedFrames.indexOf(frame);
        if (index >= 0) {
            this.selectedFrames.splice(index, 1);
        } else {
            this.selectedFrames.push(frame);
        }
    },
    hasLayers: function hasLayers(layers) {
        var _this3 = this;

        return layers.every(function (layer) {
            return _this3.selectedLayers.indexOf(layer) >= 0;
        });
    },
    addLayer: function addLayer(layer) {
        if (this.selectedLayers.indexOf(layer) < 0) {
            this.selectedLayers.push(layer);
        }
    },
    removeLayer: function removeLayer(layer) {
        var index = this.selectedLayers.indexOf(layer);
        if (index >= 0) {
            this.selectedLayers.splice(index, 1);
        }
    },
    toggleLayerSelection: function toggleLayerSelection(layer) {
        var index = this.selectedLayers.indexOf(layer);
        if (index >= 0) {
            this.selectedLayers.splice(index, 1);
        } else {
            this.selectedLayers.push(layer);
        }
    }
};
