/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Controller = undefined;

var _Presentation = require("./model/Presentation");

var _CameraState = require("./model/CameraState");

var _events = require("events");

var Controller = exports.Controller = Object.create(_events.EventEmitter.prototype);

var UNDO_STACK_LIMIT = 100;

Controller.init = function (storage, preferences, presentation, selection, timeline, viewport, player, locale) {
    var _this = this;

    _events.EventEmitter.call(this);

    this.storage = storage;
    this.preferences = preferences;
    this.presentation = presentation;
    this.selection = selection;
    this.timeline = timeline;
    this.viewport = viewport;
    this.player = player;
    this.gettext = function (s) {
        return locale.gettext(s);
    };

    this.undoStack = [];
    this.redoStack = [];

    this.addListener("repaint", function () {
        return _this.onRepaint();
    });

    return this;
};

Controller.info = function (body) {
    var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (this.preferences.enableNotifications || force) {
        var _ = this.gettext;
        new Notification(_("Sozi (Information)"), { body: body, silent: true });
    }
};

Controller.error = function (body) {
    var _ = this.gettext;
    new Notification(_("Sozi (Error)"), { body: body });
};

Controller.onRepaint = function () {
    if (this.selection.currentFrame && this.selection.currentFrame !== this.player.currentFrame) {
        if (this.preferences.animateTransitions) {
            this.player.moveToFrame(this.selection.currentFrame);
        } else {
            this.player.jumpToFrame(this.selection.currentFrame);
        }
    }
};

Controller.onLoad = function () {
    this.storage.backend.loadPreferences(this.preferences);

    if (!this.selection.selectedFrames.length && this.presentation.frames.length) {
        this.selection.addFrame(this.presentation.frames[0]);
    }
    if (!this.selection.selectedLayers.length) {
        this.selection.selectedLayers = this.presentation.layers.slice();
    }
    if (this.selection.currentFrame) {
        this.player.jumpToFrame(this.selection.currentFrame);
    }
    this.updateCameraSelection();

    this.emit("ready");

    // Apply the preferences (will trigger a repaint of the editor views).
    this.applyPreferences();
};

Controller.save = function () {
    this.storage.save();
    this.emit("repaint");
};

Controller.reload = function () {
    this.storage.reload();
};

Controller.setSVGDocument = function (svgDocument) {
    this.presentation.init();
    this.presentation.setSVGDocument(svgDocument);
    this.emit("loadSVG");
    this.presentation.setInitialCameraState();
};

/*
 * Add a frame to the presentation.
 *
 * A new frame is added to the presentation after the
 * currently selected frame (see Selection.currentFrame).
 * If no frame is selected, the new frame is added at the
 * end of the presentation.
 */
Controller.addFrame = function () {
    // Create a new frame
    var frame = Object.create(_Presentation.Frame);

    var frameIndex = void 0;

    if (this.selection.currentFrame) {
        // If a frame is selected, insert the new frame after.
        frame.initFrom(this.selection.currentFrame);
        frameIndex = this.selection.currentFrame.index + 1;
    } else {
        // If no frame is selected, copy the state of the current viewport
        // and add the new frame at the end of the presentation.
        frame.init(this.presentation).setAtStates(this.viewport.cameras);
        frameIndex = this.presentation.frames.length;
    }

    // Set the 'link' flag to all layers in the new frame.
    if (frameIndex > 0) {
        frame.layerProperties.forEach(function (layer) {
            layer.link = true;
        });
    }

    this.perform(function onDo() {
        this.presentation.frames.splice(frameIndex, 0, frame);
        this.presentation.updateLinkedLayers();
        this.selection.selectedFrames = [frame];
    }, function onUndo() {
        this.presentation.frames.splice(frameIndex, 1);
        this.presentation.updateLinkedLayers();
    }, true, ["presentationChange", "editorStateChange", "repaint"]);
};

/*
 * Delete selected frames.
 */
Controller.deleteFrames = function () {
    // Sort the selected frames by presentation order.
    var framesByIndex = this.selection.selectedFrames.slice().sort(function (a, b) {
        return a.index - b.index;
    });
    var frameIndices = framesByIndex.map(function (frame) {
        return frame.index;
    });

    this.perform(function onDo() {
        var _this2 = this;

        // Remove the selected frames and clear the selection.
        framesByIndex.forEach(function (frame) {
            _this2.presentation.frames.splice(frame.index, 1);
        });
        this.selection.selectedFrames = [];
        this.presentation.updateLinkedLayers();
    }, function onUndo() {
        var _this3 = this;

        // Restore the deleted frames to their original locations.
        framesByIndex.forEach(function (frame, i) {
            _this3.presentation.frames.splice(frameIndices[i], 0, frame);
        });
        this.presentation.updateLinkedLayers();
    }, true, ["presentationChange", "editorStateChange", "repaint"]);
};

/*
 * Move frames.
 *
 * Move all selected frames to the given frame index.
 *
 * Parameters:
 *  - toFrameIndex: The index of the destination
 */
Controller.moveFrames = function (toFrameIndex) {
    var _this4 = this;

    // Sort the selected frames by presentation order.
    var framesByIndex = this.selection.selectedFrames.slice().sort(function (a, b) {
        return a.index - b.index;
    });
    var frameIndices = framesByIndex.map(function (frame) {
        return frame.index;
    });

    // Compute the new target frame index after the selection has been removed.
    framesByIndex.forEach(function (frame) {
        if (frame.index < toFrameIndex) {
            toFrameIndex--;
        }
    });

    // Keep a copy of the current frame list for the Undo operation.
    var savedFrames = this.presentation.frames.slice();

    // Create a new frame list by removing the selected frames
    // and inserting them at the target frame index.
    var reorderedFrames = this.presentation.frames.filter(function (frame) {
        return !_this4.selection.hasFrames([frame]);
    });
    Array.prototype.splice.apply(reorderedFrames, [toFrameIndex, 0].concat(framesByIndex));

    // Identify the frames and layers that must be unlinked after the move operation.
    // If a linked frame is moved after a frame to which it was not previously linked,
    // then it will be unlinked.
    var unlink = reorderedFrames.map(function (frame, frameIndex) {
        return frame.layerProperties.map(function (layer, layerIndex) {
            return layer.link && (frameIndex === 0 || !frame.isLinkedTo(reorderedFrames[frameIndex - 1], layerIndex));
        });
    });

    this.perform(function onDo() {
        this.presentation.frames = reorderedFrames;
        this.presentation.frames.forEach(function (frame, frameIndex) {
            frame.layerProperties.forEach(function (layer, layerIndex) {
                if (unlink[frameIndex][layerIndex]) {
                    layer.link = false;
                }
            });
        });
        this.presentation.updateLinkedLayers();
    }, function onUndo() {
        this.presentation.frames.forEach(function (frame, frameIndex) {
            frame.layerProperties.forEach(function (layer, layerIndex) {
                if (unlink[frameIndex][layerIndex]) {
                    layer.link = true;
                }
            });
        });
        this.presentation.frames = savedFrames;
        this.presentation.updateLinkedLayers();
    }, false, ["presentationChange", "editorStateChange", "repaint"]);
};

Controller.updateCameraSelection = function () {
    var _this5 = this;

    this.viewport.cameras.forEach(function (camera) {
        camera.selected = _this5.selection.hasLayers([camera.layer]);
    });
};

Controller.selectLayers = function (layers) {
    this.selection.selectedLayers = layers.slice();
    this.updateCameraSelection();
    this.emit("editorStateChange");
    this.emit("repaint");
};

Controller.addLayerToSelection = function (layer) {
    if (!this.selection.hasLayers([layer])) {
        this.selection.addLayer(layer);
        this.updateCameraSelection();
        this.emit("editorStateChange");
        this.emit("repaint");
    }
};

Controller.removeLayerFromSelection = function (layer) {
    if (this.selection.hasLayers([layer])) {
        this.selection.removeLayer(layer);
        this.updateCameraSelection();
        this.emit("editorStateChange");
        this.emit("repaint");
    }
};

/*
 * Select a specific frame.
 *
 * Parameters:
 *  - index: select the frame at this particular index
 *           A negative number counts backwards from the end
 */
Controller.selectFrame = function (index) {
    if (index < 0) {
        index = this.presentation.frames.length + index;
    }
    this.updateLayerAndFrameSelection(false, false, this.selection.selectedLayers, index);
};

/*
 * Select all frames.
 */
Controller.selectAllFrames = function () {
    this.selection.selectedFrames = this.presentation.frames.slice();
    this.updateCameraSelection();

    // Trigger a repaint of the editor views.
    this.emit("editorStateChange");
    this.emit("repaint");
};

/*
 * Select a specific frame.
 *
 * Parameters:
 *  - relativeIndex: select the frame at this offset relative to the current frame
 */
Controller.selectRelativeFrame = function (relativeIndex) {
    if (this.selection.currentFrame) {
        var lastIndex = this.presentation.frames.length - 1;
        var targetIndex = this.selection.currentFrame.index + relativeIndex;
        targetIndex = targetIndex < 0 ? 0 : targetIndex > lastIndex ? lastIndex : targetIndex;
        this.updateLayerAndFrameSelection(false, false, this.selection.selectedLayers, targetIndex);
    }
};

/*
 * Update the selection for a given frame.
 *
 * Parameters:
 *  - single: toggle the selection status of the given frame
 *  - sequence: toggle a sequence of frames to the given frame
 *  - frameIndex: The index of a frame in the presentation
 */
Controller.updateFrameSelection = function (single, sequence, frameIndex) {
    var frame = this.presentation.frames[frameIndex];
    if (single) {
        this.selection.toggleFrameSelection(frame);
    } else if (sequence) {
        if (!this.selection.selectedFrames.length) {
            this.selection.addFrame(frame);
        } else {
            var startIndex = this.selection.currentFrame.index;
            var inc = startIndex <= frameIndex ? 1 : -1;
            for (var i = startIndex + inc; startIndex <= frameIndex ? i <= frameIndex : i >= frameIndex; i += inc) {
                this.selection.toggleFrameSelection(this.presentation.frames[i]);
            }
        }
    } else {
        this.selection.selectedLayers = this.presentation.layers.slice();
        this.selection.selectedFrames = [frame];
        this.updateCameraSelection();
    }

    // Trigger a repaint of the editor views.
    this.emit("editorStateChange");
    this.emit("repaint");
};

/*
 * Update the selection for a given layer.
 *
 * Parameters:
 *  - single: toggle the selection status of the given layer
 *  - sequence: toggle a sequence of layers to the given layer
 *  - layers: The layers to select
 */
Controller.updateLayerSelection = function (single, sequence, layers) {
    var _this6 = this;

    if (single) {
        layers.forEach(function (layer) {
            _this6.selection.toggleLayerSelection(layer);
        });
    } else if (sequence) {
        // TODO toggle from last selected layer to current
    } else {
        this.selection.selectedLayers = layers.slice();
        this.selection.selectedFrames = this.presentation.frames.slice();
    }

    this.updateCameraSelection();

    // Trigger a repaint of the editor views.
    this.emit("editorStateChange");
    this.emit("repaint");
};

/*
 * Update the selection for a given layer and a given frame.
 *
 * Parameters:
 *  - single: toggle the selection status of the given frame and layer.
 *          If both are selected, they are removed from the selection.
 *          If at least one is not selected, they are added to the selection.
 *  - sequence: toggle a sequence of frames and layers to the given frame and layer.
 *  - layers: A set of layers
 *  - frameIndex: The index of a frame in the presentation
 */
Controller.updateLayerAndFrameSelection = function (single, sequence, layers, frameIndex) {
    var _this7 = this;

    var frame = this.presentation.frames[frameIndex];
    if (single) {
        if (this.selection.hasLayers(layers) && this.selection.hasFrames([frame])) {
            layers.forEach(function (layer) {
                _this7.selection.removeLayer(layer);
            });
            this.selection.removeFrame(frame);
        } else {
            layers.forEach(function (layer) {
                _this7.selection.addLayer(layer);
            });
            this.selection.addFrame(frame);
        }
    } else if (sequence) {
        if (!this.selection.selectedFrames.length) {
            this.selection.addFrame(frame);
        } else {
            var startIndex = this.selection.currentFrame.index;
            var inc = startIndex <= frameIndex ? 1 : -1;
            for (var i = startIndex + inc; startIndex <= frameIndex ? i <= frameIndex : i >= frameIndex; i += inc) {
                this.selection.toggleFrameSelection(this.presentation.frames[i]);
            }
        }
        // TODO toggle from last selected layer to current
    } else {
        this.selection.selectedLayers = layers.slice();
        this.selection.selectedFrames = [frame];
    }

    this.updateCameraSelection();

    // Trigger a repaint of the editor views.
    this.emit("editorStateChange");
    this.emit("repaint");
};

/*
 * Change the visibility of the given layer.
 *
 * Toggle the visibility of the given layer.
 * If the layer becomes visible, it is added to the selection,
 * otherwise, it is removed from the selection.
 *
 * Parameters:
 *  - layerIndex: The index of a layer in the presentation
 */
Controller.updateLayerVisibility = function (layers) {
    var _this8 = this;

    layers.forEach(function (layer) {
        layer.isVisible = !layer.isVisible;
        if (layer.isVisible) {
            _this8.selection.addLayer(layer);
        } else {
            _this8.selection.removeLayer(layer);
        }
    });

    // Trigger a repaint of the editor views.
    this.emit("editorStateChange");
    this.emit("repaint");
};

Controller.resetLayer = function () {
    var selectedFrames = this.selection.selectedFrames.slice();
    var selectedLayers = this.selection.selectedLayers.slice();

    var savedValues = selectedFrames.map(function (frame) {
        return selectedLayers.map(function (layer) {
            return {
                link: frame.layerProperties[layer.index].link
            };
        });
    });

    var savedCameraStates = selectedFrames.map(function (frame) {
        return selectedLayers.map(function (layer) {
            return Object.create(_CameraState.CameraState).initFrom(frame.cameraStates[layer.index]);
        });
    });

    this.perform(function onDo() {
        var _this9 = this;

        selectedFrames.forEach(function (frame) {
            selectedLayers.forEach(function (layer) {
                frame.cameraStates[layer.index].initFrom(_this9.presentation.initialCameraState);
                frame.layerProperties[layer.index].link = false;
            });

            _this9.presentation.updateLinkedLayers();
        });
    }, function onUndo() {
        var _this10 = this;

        selectedFrames.forEach(function (frame, frameIndex) {
            selectedLayers.forEach(function (layer, layerIndex) {
                frame.cameraStates[layer.index].initFrom(savedCameraStates[frameIndex][layerIndex]);
                frame.layerProperties[layer.index].link = savedValues[frameIndex][layerIndex].link;
            });

            _this10.presentation.updateLinkedLayers();
        });
    }, false, ["presentationChange", "repaint"]);
};

Controller.copyLayer = function (groupId) {
    var selectedFrames = this.selection.selectedFrames.slice();
    var selectedLayers = this.selection.selectedLayers.slice();
    var savedValues = selectedFrames.map(function (frame) {
        return selectedLayers.map(function (layer) {
            return Object.create(_Presentation.LayerProperties).initFrom(frame.layerProperties[layer.index]);
        });
    });

    var savedCameraStates = selectedFrames.map(function (frame) {
        return selectedLayers.map(function (layer) {
            return Object.create(_CameraState.CameraState).initFrom(frame.cameraStates[layer.index]);
        });
    });

    var layerToCopy = groupId == "__default__" ? this.timeline.refLayerInDefault : this.presentation.getLayerWithId(groupId);
    if (!layerToCopy) {
        return;
    }

    this.perform(function onDo() {
        var _this11 = this;

        selectedFrames.forEach(function (frame) {
            selectedLayers.forEach(function (layer) {
                if (layer != layerToCopy) {
                    frame.layerProperties[layer.index].initFrom(frame.layerProperties[layerToCopy.index]);
                    frame.cameraStates[layer.index].initFrom(frame.cameraStates[layerToCopy.index]);
                    if (frame.index === 0 || !_this11.selection.hasFrames([_this11.presentation.frames[frame.index - 1]])) {
                        frame.layerProperties[layer.index].link = false;
                    }
                }
            });
        });
        this.presentation.updateLinkedLayers();
    }, function onUndo() {
        selectedFrames.forEach(function (frame, frameIndex) {
            selectedLayers.forEach(function (layer, layerIndex) {
                frame.layerProperties[layer.index].initFrom(savedValues[frameIndex][layerIndex]);
                frame.cameraStates[layer.index].initFrom(savedCameraStates[frameIndex][layerIndex]);
            });
        });
        this.presentation.updateLinkedLayers();
    }, false, ["presentationChange", "repaint"]);
};

Controller.canFitElement = function () {
    var _this12 = this;

    return this.selection.selectedFrames.length === 1 && this.selection.selectedLayers.length >= 1 && this.selection.selectedLayers.every(function (layer) {
        var id = _this12.selection.currentFrame.layerProperties[layer.index].outlineElementId;
        var elt = _this12.presentation.document.root.getElementById(id);
        return elt && _this12.selection.selectedLayers.some(function (l) {
            return l.contains(elt);
        });
    });
};

Controller.fitElement = function () {
    var _this13 = this;

    var currentFrame = this.selection.currentFrame;
    if (currentFrame) {
        var savedFrame = Object.create(_Presentation.Frame).initFrom(currentFrame, true);
        var modifiedFrame = Object.create(_Presentation.Frame).initFrom(currentFrame, true);

        // Compute the offsets of each layer relative to the outline elements.
        var offsets = {};
        this.selection.selectedLayers.forEach(function (layer) {
            var id = currentFrame.layerProperties[layer.index].outlineElementId;
            var elt = _this13.presentation.document.root.getElementById(id);
            if (elt && layer.contains(elt)) {
                offsets[id] = modifiedFrame.cameraStates[layer.index].offsetFromElement(elt);
            }
        });

        // Apply the offsets to each layer
        this.selection.selectedLayers.forEach(function (layer) {
            var id = currentFrame.layerProperties[layer.index].outlineElementId;
            if (offsets[id]) {
                modifiedFrame.cameraStates[layer.index].applyOffset(offsets[id]).resetClipping();
            }
        });

        if (Object.keys(offsets).length) {
            this.perform(function onDo() {
                currentFrame.setAtStates(modifiedFrame.cameraStates);
                this.selection.selectedLayers.forEach(function (layer) {
                    currentFrame.layerProperties[layer.index].link = false;
                });
                this.presentation.updateLinkedLayers();
            }, function onUndo() {
                currentFrame.initFrom(savedFrame);
                this.presentation.updateLinkedLayers();
            }, false, ["presentationChange", "repaint"]);
        }
    }
};

Controller.getPresentationProperty = function (property) {
    return this.presentation[property];
};

Controller.setPresentationProperty = function (propertyName, propertyValue) {
    var pres = this.presentation;
    var savedValue = pres[propertyName];

    this.perform(function onDo() {
        pres[propertyName] = propertyValue;
    }, function onUndo() {
        pres[propertyName] = savedValue;
    }, false, ["presentationChange", "repaint"]);
};

Controller.getFrameProperty = function (property) {
    var values = [];

    this.selection.selectedFrames.forEach(function (frame) {
        var current = frame[property];
        if (values.indexOf(current) < 0) {
            values.push(current);
        }
    });

    return values;
};

Controller.setFrameProperty = function (propertyName, propertyValue) {
    var selectedFrames = this.selection.selectedFrames.slice();
    var savedValues = selectedFrames.map(function (frame) {
        return frame[propertyName];
    });

    this.perform(function onDo() {
        selectedFrames.forEach(function (frame) {
            frame[propertyName] = propertyValue;
        });
    }, function onUndo() {
        selectedFrames.forEach(function (frame, frameIndex) {
            frame[propertyName] = savedValues[frameIndex];
        });
    }, false, ["presentationChange", "repaint"]);
};

Controller.getLayerProperty = function (property) {
    var _this14 = this;

    var values = [];

    this.selection.selectedFrames.forEach(function (frame) {
        _this14.selection.selectedLayers.forEach(function (layer) {
            var current = frame.layerProperties[layer.index][property];
            if (values.indexOf(current) < 0) {
                values.push(current);
            }
        });
    });

    return values;
};

Controller.setLayerProperty = function (propertyName, propertyValue) {
    var selectedFrames = this.selection.selectedFrames.slice();
    var selectedLayers = this.selection.selectedLayers.slice();
    var savedValues = selectedFrames.map(function (frame) {
        return selectedLayers.map(function (layer) {
            return frame.layerProperties[layer.index][propertyName];
        });
    });

    var link = propertyName === "link" && propertyValue;

    var savedCameraStates = selectedFrames.map(function (frame) {
        return selectedLayers.map(function (layer) {
            return Object.create(_CameraState.CameraState).initFrom(frame.cameraStates[layer.index]);
        });
    });

    this.perform(function onDo() {
        selectedFrames.forEach(function (frame) {
            selectedLayers.forEach(function (layer) {
                frame.layerProperties[layer.index][propertyName] = propertyValue;
            });
        });

        this.presentation.updateLinkedLayers();
    }, function onUndo() {
        selectedFrames.forEach(function (frame, frameIndex) {
            selectedLayers.forEach(function (layer, layerIndex) {
                frame.layerProperties[layer.index][propertyName] = savedValues[frameIndex][layerIndex];
                if (link) {
                    frame.cameraStates[layer.index].initFrom(savedCameraStates[frameIndex][layerIndex]);
                }
            });
        });

        this.presentation.updateLinkedLayers();
    }, false, ["presentationChange", "repaint"]);
};

Controller.getCameraProperty = function (property) {
    var _this15 = this;

    var values = [];

    this.selection.selectedFrames.forEach(function (frame) {
        _this15.selection.selectedLayers.forEach(function (layer) {
            var current = frame.cameraStates[layer.index][property];
            if (values.indexOf(current) < 0) {
                values.push(current);
            }
        });
    });

    return values;
};

Controller.setCameraProperty = function (propertyName, propertyValue) {
    var selectedFrames = this.selection.selectedFrames.slice();
    var selectedLayers = this.selection.selectedLayers.slice();

    var savedValues = selectedFrames.map(function (frame) {
        return selectedLayers.map(function (layer) {
            return {
                prop: frame.cameraStates[layer.index][propertyName],
                link: frame.layerProperties[layer.index].link
            };
        });
    });

    this.perform(function onDo() {
        selectedFrames.forEach(function (frame) {
            selectedLayers.forEach(function (layer) {
                frame.cameraStates[layer.index][propertyName] = propertyValue;
                frame.layerProperties[layer.index].link = false;
            });
        });

        this.presentation.updateLinkedLayers();
    }, function onUndo() {
        selectedFrames.forEach(function (frame, frameIndex) {
            selectedLayers.forEach(function (layer, layerIndex) {
                frame.cameraStates[layer.index][propertyName] = savedValues[frameIndex][layerIndex].prop;
                frame.layerProperties[layer.index].link = savedValues[frameIndex][layerIndex].link;
            });
        });

        this.presentation.updateLinkedLayers();
    }, false, ["presentationChange", "repaint"]);
};

Controller.updateCameraStates = function () {
    var currentFrame = this.selection.currentFrame;
    if (currentFrame) {
        var savedFrame = Object.create(_Presentation.Frame).initFrom(currentFrame);
        var modifiedFrame = Object.create(_Presentation.Frame).initFrom(currentFrame);

        var outlineElt = null,
            outlineScore = null;

        this.viewport.cameras.forEach(function (camera, cameraIndex) {
            if (camera.selected) {
                // Update the camera states of the current frame
                modifiedFrame.cameraStates[cameraIndex].initFrom(camera);

                // We will update the layer properties corresponding to the
                // current camera in the modified frame
                var layerProperties = modifiedFrame.layerProperties[cameraIndex];

                // Mark the modified layers as unlinked in the current frame
                layerProperties.link = false;

                // Update the reference SVG element if applicable.

                var _camera$getCandidateR = camera.getCandidateReferenceElement(),
                    element = _camera$getCandidateR.element,
                    score = _camera$getCandidateR.score;

                if (element && element.hasAttribute("id")) {
                    layerProperties.referenceElementId = element.getAttribute("id");
                    if (outlineScore === null || score < outlineScore) {
                        outlineElt = element;
                        outlineScore = score;
                    }
                }
            }
        });

        if (outlineElt) {
            this.viewport.cameras.forEach(function (camera, cameraIndex) {
                if (camera.selected) {
                    var layerProperties = modifiedFrame.layerProperties[cameraIndex];
                    if (layerProperties.outlineElementAuto) {
                        layerProperties.outlineElementId = outlineElt.getAttribute("id");
                    }
                }
            });
        }

        this.perform(function onDo() {
            currentFrame.initFrom(modifiedFrame, true);
            this.presentation.updateLinkedLayers();
        }, function onUndo() {
            currentFrame.initFrom(savedFrame, true);
            this.presentation.updateLinkedLayers();
        }, false, ["presentationChange", "repaint"]);
    }
};

Controller.setOutlineElement = function (outlineElement) {
    var currentFrame = this.selection.currentFrame;
    if (currentFrame) {
        var properties = this.viewport.cameras.map(function (camera, cameraIndex) {
            if (camera.selected) {
                var layerProperties = currentFrame.layerProperties[cameraIndex];
                var savedProperties = Object.create(_Presentation.LayerProperties).initFrom(layerProperties);
                var modifiedProperties = Object.create(_Presentation.LayerProperties).initFrom(layerProperties);

                // Mark the modified layers as unlinked in the current frame
                modifiedProperties.link = false;

                modifiedProperties.outlineElementAuto = false;
                modifiedProperties.outlineElementId = outlineElement.getAttribute("id");

                return { layerProperties: layerProperties, savedProperties: savedProperties, modifiedProperties: modifiedProperties };
            }
        });

        this.perform(function onDo() {
            properties.forEach(function (p) {
                if (p) {
                    p.layerProperties.initFrom(p.modifiedProperties);
                }
            });
            this.presentation.updateLinkedLayers();
        }, function onUndo() {
            properties.forEach(function (p) {
                if (p) {
                    p.layerProperties.initFrom(p.savedProperties);
                }
            });
            this.presentation.updateLinkedLayers();
        }, false, ["presentationChange", "repaint"]);
    }
};

Controller.setAspectWidth = function (width) {
    var widthPrev = this.presentation.aspectWidth;
    this.perform(function onDo() {
        this.presentation.aspectWidth = width;
    }, function onUndo() {
        this.presentation.aspectWidth = widthPrev;
    }, false, ["presentationChange", "repaint"]);
};

Controller.setAspectHeight = function (height) {
    var heightPrev = this.presentation.aspectHeight;
    this.perform(function onDo() {
        this.presentation.aspectHeight = height;
    }, function onUndo() {
        this.presentation.aspectHeight = heightPrev;
    }, false, ["presentationChange", "repaint"]);
};

Controller.setDragMode = function (dragMode) {
    this.viewport.dragMode = dragMode;
    this.emit("repaint");
};

Controller.getPreference = function (key) {
    return this.preferences[key];
};

Controller.setPreference = function (key, value) {
    this.preferences[key] = value;
    this.applyPreferences();
};

Controller.getShortcut = function (key) {
    return this.preferences.keys[key];
};

Controller.setShortcut = function (key, value) {
    // Find occurrences of modifier keys in the given value.
    var ctrl = /\bCtrl\s*\+/i.test(value);
    var alt = /\bAlt\s*\+/i.test(value);
    var shift = /\bShift\s*\+/i.test(value);

    // Remove all occurrences of modifier keys and spaces in the given value.
    value = value.replace(/\bCtrl\s*\+\s*/gi, "");
    value = value.replace(/\bAlt\s*\+\s*/gi, "");
    value = value.replace(/\bShift\s*\+\s*/gi, "");
    value = value.replace(/\s/g, "").toUpperCase();
    if (value.length === 0) {
        return;
    }

    // Rewrite the shortcut in standard order.
    if (shift) {
        value = "Shift+" + value;
    }
    if (alt) {
        value = "Alt+" + value;
    }
    if (ctrl) {
        value = "Ctrl+" + value;
    }
    this.preferences.keys[key] = value;
};

Controller.applyPreferences = function () {
    if (this.preferences.fontSize > 0) {
        document.body.style.fontSize = this.preferences.fontSize + "pt";
    }
    this.emit("repaint");
};

Controller.perform = function (onDo, onUndo, updateSelection, events) {
    var _this16 = this;

    var action = { onDo: onDo, onUndo: onUndo, updateSelection: updateSelection, events: events };
    if (updateSelection) {
        action.selectedFrames = this.selection.selectedFrames.slice();
        action.selectedLayers = this.selection.selectedLayers.slice();
    }
    this.undoStack.push(action);
    while (this.undoStack.length > UNDO_STACK_LIMIT) {
        this.undoStack.shift();
    }
    this.redoStack = [];
    onDo.call(this);
    events.forEach(function (evt) {
        _this16.emit(evt);
    });
};

Controller.undo = function () {
    var _this17 = this;

    if (!this.undoStack.length) {
        return;
    }
    var action = this.undoStack.pop();
    this.redoStack.push(action);
    action.onUndo.call(this);
    if (action.updateSelection) {
        this.selection.selectedFrames = action.selectedFrames.slice();
        this.selection.selectedLayers = action.selectedLayers.slice();
    }
    action.events.forEach(function (evt) {
        _this17.emit(evt);
    });
};

Controller.redo = function () {
    var _this18 = this;

    if (!this.redoStack.length) {
        return;
    }
    var action = this.redoStack.pop();
    this.undoStack.push(action);
    action.onDo.call(this);
    action.events.forEach(function (evt) {
        _this18.emit(evt);
    });
};
