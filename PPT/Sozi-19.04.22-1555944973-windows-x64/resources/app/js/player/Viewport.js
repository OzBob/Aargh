/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Viewport = undefined;

var _Camera = require("./Camera");

var _events = require("events");

// Use left mouse button to drag
var DRAG_BUTTON = 0;

// Minimum distance to detect a drag action
var DRAG_THRESHOLD_PX = 5;

// Zoom factor for user zoom action (keyboard and mouse wheel)
var SCALE_FACTOR = 1.05;

// Rotation step for user rotate action (keyboard and mouse wheel)
var ROTATE_STEP = 5;

// The delay after the last mouse wheel event
// to consider that the wheel action is terminated
var WHEEL_TIMEOUT_MS = 200;

var CLIP_BORDER = 3;

var Viewport = exports.Viewport = Object.create(_events.EventEmitter.prototype);

/*
 * Initialize a new viewport for the given presentation.
 *
 * Parameters:
 *    - presentation: The presentations to display.
 *    - editMode: true if the presentation is opened in an editor.
 *
 * Returns:
 *    - The current viewport.
 */
Viewport.init = function (presentation, editMode) {
    var _this = this;

    _events.EventEmitter.call(this);

    this.presentation = presentation;
    this.editMode = !!editMode;
    this.cameras = [];
    this.mouseDragX = 0;
    this.mouseDragY = 0;
    this.dragMode = "translate";
    this.clipMode = { cameras: [], operation: "select" };
    this.showHiddenElements = false;
    this.wheelTimeout = null;

    // Setup mouse and keyboard event handlers.
    this.dragHandler = function (evt) {
        return _this.onDrag(evt);
    };
    this.dragEndHandler = function (evt) {
        return _this.onDragEnd(evt);
    };

    return this;
};

Viewport.makeUniqueId = function (prefix) {
    var suffix = Math.floor(1000 * (1 + 9 * Math.random()));
    var id = void 0;
    do {
        id = prefix + suffix;
        suffix++;
    } while (this.svgRoot.getElementById(id));
    return id;
};

Viewport.onLoad = function () {
    var _this2 = this;

    this.svgRoot.addEventListener("mousedown", function (evt) {
        return _this2.onMouseDown(evt);
    }, false);
    this.svgRoot.addEventListener("mousemove", function (evt) {
        return _this2.onMouseMove(evt);
    }, false);
    this.svgRoot.addEventListener("contextmenu", function (evt) {
        return _this2.onContextMenu(evt);
    }, false);

    var wheelEvent = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
    document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
    "DOMMouseScroll"; // Firefox < 17
    this.svgRoot.addEventListener(wheelEvent, function (evt) {
        return _this2.onWheel(evt);
    }, false);

    this.cameras = this.presentation.layers.map(function (layer) {
        return Object.create(_Camera.Camera).init(_this2, layer);
    });

    return this;
};

Object.defineProperty(Viewport, "ready", {
    get: function get() {
        return !!(this.presentation.document && this.presentation.document.root);
    }
});

Object.defineProperty(Viewport, "svgRoot", {
    get: function get() {
        return this.presentation.document.root;
    }
});

Viewport.getLayer = function (nodeId) {
    return this.layers.filter(function (layer) {
        return layer.nodeId === nodeId;
    })[0];
};

Viewport.onContextMenu = function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.emit("click", 2, evt);
};

Viewport.onMouseMove = function (evt) {
    if (this.dragMode === "clip") {
        switch (this.getClipMode(evt).operation) {
            case "select":
                this.svgRoot.style.cursor = "crosshair";
                break;
            case "n":
            case "s":
                this.svgRoot.style.cursor = "ns-resize";
                break;
            case "w":
            case "e":
                this.svgRoot.style.cursor = "ew-resize";
                break;
            case "nw":
            case "se":
                this.svgRoot.style.cursor = "nwse-resize";
                break;
            case "ne":
            case "sw":
                this.svgRoot.style.cursor = "nesw-resize";
                break;
            case "move":
                this.svgRoot.style.cursor = "move";
                break;
            default:
                this.svgRoot.style.cursor = "default";
        }
    } else {
        this.svgRoot.style.cursor = "default";
    }
};

/*
 * Event handler: mouse down.
 *
 * If the mouse button pressed is the left button,
 * this method will setup event listeners for detecting a drag action.
 *
 * Parameters:
 *    - evt: The DOM event object
 *
 * Fires:
 *    - mouseDown(button)
 */
Viewport.onMouseDown = function (evt) {
    evt.stopPropagation();
    evt.preventDefault();

    if (evt.button === DRAG_BUTTON) {
        this.mouseDragged = false;
        this.mouseDragChangedState = false;
        this.mouseDragX = this.mouseDragStartX = evt.clientX;
        this.mouseDragY = this.mouseDragStartY = evt.clientY;

        document.documentElement.addEventListener("mousemove", this.dragHandler, false);
        document.documentElement.addEventListener("mouseup", this.dragEndHandler, false);

        if (this.dragMode === "clip") {
            this.clipMode = this.getClipMode(evt);
        }
    }

    this.emit("mouseDown", evt.button);
};

Viewport.getClipMode = function (evt) {
    var x = evt.clientX - this.x;
    var y = evt.clientY - this.y;

    var camerasByOperation = {
        nw: [],
        sw: [],
        ne: [],
        se: [],
        w: [],
        e: [],
        n: [],
        s: [],
        move: []
    };

    var selectedCameras = this.cameras.filter(function (camera) {
        return camera.selected;
    });

    selectedCameras.forEach(function (camera) {
        var rect = camera.clipRect;
        if (x >= rect.x - CLIP_BORDER && x <= rect.x + rect.width + CLIP_BORDER && y >= rect.y - CLIP_BORDER && y <= rect.y + rect.height + CLIP_BORDER) {
            var w = x <= rect.x + CLIP_BORDER;
            var e = x >= rect.x + rect.width - CLIP_BORDER - 1;
            var n = y <= rect.y + CLIP_BORDER;
            var s = y >= rect.y + rect.height - CLIP_BORDER - 1;
            var operation = w || e || n || s ? (n ? "n" : s ? "s" : "") + (w ? "w" : e ? "e" : "") : "move";
            camerasByOperation[operation].push(camera);
        }
    });

    for (var operation in camerasByOperation) {
        if (camerasByOperation[operation].length) {
            return {
                cameras: camerasByOperation[operation],
                operation: operation
            };
        }
    }

    return {
        cameras: selectedCameras,
        operation: "select"
    };
};

/*
 * Event handler: mouse move after mouse down.
 *
 * Parameters:
 *    - evt: The DOM event object
 *
 * Fires:
 *    - dragStart
 */
Viewport.onDrag = function (evt) {
    evt.stopPropagation();

    var xFromCenter = evt.clientX - this.x - this.width / 2;
    var yFromCenter = evt.clientY - this.y - this.height / 2;
    var angle = 180 * Math.atan2(yFromCenter, xFromCenter) / Math.PI;
    var translateX = evt.clientX;
    var translateY = evt.clientY;
    var zoom = Math.sqrt(xFromCenter * xFromCenter + yFromCenter * yFromCenter);
    var deltaX = evt.clientX - this.mouseDragX;
    var deltaY = evt.clientY - this.mouseDragY;

    // The drag action is confirmed when one of the mouse coordinates
    // has moved past the threshold
    if (!this.mouseDragged && (Math.abs(deltaX) > DRAG_THRESHOLD_PX || Math.abs(deltaY) > DRAG_THRESHOLD_PX)) {
        this.mouseDragged = true;

        this.rotateStart = this.rotatePrev = angle;
        this.translateStartX = this.translateXPrev = translateX;
        this.translateStartY = this.translateYPrev = translateY;
        this.zoomPrev = zoom;

        this.emit("dragStart");
    }

    if (this.mouseDragged) {
        var mode = this.dragMode;
        if (mode == "translate") {
            if (evt.altKey) {
                mode = "scale";
            } else if (evt.shiftKey) {
                mode = "rotate";
            }
        }

        switch (mode) {
            case "scale":
                if (this.editMode || this.presentation.enableMouseZoom) {
                    if (this.zoomPrev !== 0) {
                        this.zoom(zoom / this.zoomPrev, this.width / 2, this.height / 2);
                        this.mouseDragChangedState = true;
                    }
                    this.zoomPrev = zoom;
                }
                break;

            case "rotate":
                if (this.editMode || this.presentation.enableMouseRotation) {
                    if (evt.ctrlKey) {
                        angle = 10 * Math.round((angle - this.rotateStart) / 10) + this.rotateStart;
                    }
                    this.rotate(this.rotatePrev - angle);
                    this.mouseDragChangedState = true;
                    this.rotatePrev = angle;
                }
                break;

            case "clip":
                switch (this.clipMode.operation) {
                    case "select":
                        this.clip(this.mouseDragStartX - this.x, this.mouseDragStartY - this.y, this.mouseDragX - this.x, this.mouseDragY - this.y);
                        break;
                    case "move":
                        this.clipRel(deltaX, deltaY, deltaX, deltaY);
                        break;
                    case "w":
                        this.clipRel(deltaX, 0, 0, 0);
                        break;
                    case "e":
                        this.clipRel(0, 0, deltaX, 0);
                        break;
                    case "n":
                        this.clipRel(0, deltaY, 0, 0);
                        break;
                    case "s":
                        this.clipRel(0, 0, 0, deltaY);
                        break;
                    case "nw":
                        this.clipRel(deltaX, deltaY, 0, 0);
                        break;
                    case "ne":
                        this.clipRel(0, deltaY, deltaX, 0);
                        break;
                    case "sw":
                        this.clipRel(deltaX, 0, 0, deltaY);
                        break;
                    case "se":
                        this.clipRel(0, 0, deltaX, deltaY);
                        break;
                }
                this.mouseDragChangedState = true;
                break;

            default:
                // case "translate":
                if (this.editMode || this.presentation.enableMouseTranslation) {
                    if (evt.ctrlKey) {
                        if (Math.abs(translateX - this.translateStartX) >= Math.abs(translateY - this.translateStartY)) {
                            translateY = this.translateStartY;
                        } else {
                            translateX = this.translateStartX;
                        }
                    }
                    this.translate(translateX - this.translateXPrev, translateY - this.translateYPrev);
                    this.mouseDragChangedState = true;
                    this.translateXPrev = translateX;
                    this.translateYPrev = translateY;
                }
        }
        this.mouseDragX = evt.clientX;
        this.mouseDragY = evt.clientY;
    }
};

/*
 * Event handler: mouse up after mouse down.
 *
 * If the mouse has been moved past the drag threshold, this method
 * will fire a "dragEnd" event. Otherwise, it will fire a "click" event.
 *
 * Parameters:
 *    - evt: The DOM event object
 *
 * Fires:
 *    - dragEnd
 *    - userChangeState
 *    - click(button, event)
 */
Viewport.onDragEnd = function (evt) {
    evt.stopPropagation();
    evt.preventDefault();

    if (evt.button === DRAG_BUTTON) {
        if (this.mouseDragged) {
            this.emit("dragEnd");
            if (this.mouseDragChangedState) {
                this.emit("userChangeState");
            }
        } else {
            this.emit("click", evt.button, evt);
        }

        document.documentElement.removeEventListener("mousemove", this.dragHandler, false);
        document.documentElement.removeEventListener("mouseup", this.dragEndHandler, false);
    } else {
        this.emit("click", evt.button, evt);
    }
};

/*
 * Event handler: mouse wheel.
 *
 * The effect of the mouse wheel depends on the state of the Shift key:
 *    - released: zoom in and out,
 *    - pressed: rotate clockwise or counter-clockwise
 *
 * Parameters:
 *    - evt: The DOM event object
 *
 * Fires:
 *    - userChangeState
 */
Viewport.onWheel = function (evt) {
    var _this3 = this;

    if (this.wheelTimeout !== null) {
        window.clearTimeout(this.wheelTimeout);
    }

    evt.stopPropagation();
    evt.preventDefault();

    var delta = 0;
    if (evt.wheelDelta) {
        // "mousewheel" event
        delta = evt.wheelDelta;
    } else if (evt.detail) {
        // "DOMMouseScroll" event
        delta = -evt.detail;
    } else {
        // "wheel" event
        delta = -evt.deltaY;
    }

    var changed = false;

    if (delta !== 0) {
        if (evt.shiftKey) {
            // TODO rotate around mouse cursor
            if (this.editMode || this.presentation.enableMouseRotation) {
                this.rotate(delta > 0 ? ROTATE_STEP : -ROTATE_STEP);
                changed = true;
            }
        } else {
            if (this.editMode || this.presentation.enableMouseZoom) {
                this.zoom(delta > 0 ? SCALE_FACTOR : 1 / SCALE_FACTOR, evt.clientX - this.x, evt.clientY - this.y);
                changed = true;
            }
        }
    }

    if (changed) {
        this.wheelTimeout = window.setTimeout(function () {
            _this3.wheelTimeout = null;
            _this3.emit("userChangeState");
        }, WHEEL_TIMEOUT_MS);
    }
};

/*
 * Get the X coordinate of the current viewport in the current browser window.
 *
 * If the SVG is a standalone document, the returned value is 0.
 *
 * Returns:
 *    - The X coordinate of the current viewport.
 */
Object.defineProperty(Viewport, "x", {
    get: function get() {
        return this.svgRoot.getScreenCTM().e;
    }
});

/*
 * Get the Y coordinate of the current viewport in the current browser window.
 *
 * If the SVG is a standalone document, the returned value is 0.
 *
 * Returns:
 *    - The Y coordinate of the current viewport.
 */
Object.defineProperty(Viewport, "y", {
    get: function get() {
        return this.svgRoot.getScreenCTM().f;
    }
});

/*
 * Get the width of the current viewport.
 *
 * If the SVG is inlined in an HTML document, the returned width
 * includes the padding width of the container.
 *
 * If the SVG is a standalone document, the returned width is the
 * window's inner width.
 *
 * Returns:
 *    - The width of the current viewport.
 */
Object.defineProperty(Viewport, "width", {
    get: function get() {
        return this.svgRoot === document.documentElement ? window.innerWidth : this.svgRoot.parentNode.clientWidth;
    }
});

/*
 * Get the height of the current viewport.
 *
 * If the SVG is inlined in an HTML document, the returned height
 * includes the padding height of the container.
 *
 * If the SVG is a standalone document, the returned height is the
 * window's inner height.
 *
 * Returns:
 *    - The height of the current viewport.
 */
Object.defineProperty(Viewport, "height", {
    get: function get() {
        return this.svgRoot === document.documentElement ? window.innerHeight : this.svgRoot.parentNode.clientHeight;
    }
});

Viewport.repaint = function () {
    var _this4 = this;

    this.svgRoot.setAttribute("width", this.width);
    this.svgRoot.setAttribute("height", this.height);

    this.update();

    this.presentation.elementsToHide.forEach(function (id) {
        var elt = document.getElementById(id);
        if (elt) {
            elt.style.visibility = _this4.showHiddenElements ? "visible" : "hidden";
        }
    });

    return this;
};

Viewport.update = function () {
    this.cameras.forEach(function (camera) {
        camera.update();
    });
    return this;
};

/*
 * Set the states of the cameras of the current viewport.
 *
 * Parameters:
 *    - states: An array of camera states
 */
Viewport.setAtStates = function (states) {
    var _this5 = this;

    states.forEach(function (state, index) {
        _this5.cameras[index].initFrom(state);
    });
    return this;
};

/*
 * Apply an additional translation to the SVG document based on onscreen coordinates.
 *
 * This method delegates to the cameras of the currently selected layers.
 *
 * Parameters:
 *    - deltaX: The horizontal displacement, in pixels
 *    - deltaY: The vertical displacement, in pixels
 *
 * Returns:
 *    - The current viewport.
 */
Viewport.translate = function (deltaX, deltaY) {
    this.cameras.forEach(function (camera) {
        if (camera.selected) {
            camera.translate(deltaX, deltaY);
        }
    });
    return this;
};

/*
 * Zooms the display with the given factor.
 *
 * The zoom is centered around (x, y) with respect to the center of the display area.
 *
 * This method delegates to the cameras of the currently selected layers.
 *
 * Parameters:
 *    - factor: The zoom factor (relative to the current state of the viewport).
 *    - x, y: The coordinates of the center of the zoom operation.
 *
 * Returns:
 *    - The current viewport.
 */
Viewport.zoom = function (factor, x, y) {
    this.cameras.forEach(function (camera) {
        if (camera.selected) {
            camera.zoom(factor, x, y);
        }
    });
    return this;
};

/*
 * Rotate the display with the given angle.
 *
 * The rotation is centered around the center of the display area.
 *
 * This method delegates to the cameras of the currently selected layers.
 *
 * Parameters:
 *    - angle: The rotation angle, in degrees.
 *
 * Returns:
 *    - The current viewport.
 */
Viewport.rotate = function (angle) {
    this.cameras.forEach(function (camera) {
        if (camera.selected) {
            camera.rotate(angle);
        }
    });
    return this;
};

Viewport.clip = function (x0, y0, x1, y1) {
    this.clipMode.cameras.forEach(function (camera) {
        camera.clip(x0, y0, x1, y1);
    });
    return this;
};

Viewport.clipRel = function (w, n, e, s) {
    this.clipMode.cameras.forEach(function (camera) {
        var rect = camera.clipRect;
        if (w <= rect.width + e - 1 && n <= rect.height + s - 1) {
            camera.clip(rect.x + w, rect.y + n, rect.x + rect.width + e - 1, rect.y + rect.height + s - 1);
        }
    });
    return this;
};
