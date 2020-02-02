/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Player = undefined;

var _Animator = require("./Animator");

var _Timing = require("./Timing");

var Timing = _interopRequireWildcard(_Timing);

var _CameraState = require("../model/CameraState");

var _Presentation = require("../model/Presentation");

var _events = require("events");

var _Media = require("./Media");

var Media = _interopRequireWildcard(_Media);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Constants: default animation properties
// for out-of-sequence transitions
var DEFAULT_TRANSITION_DURATION_MS = 500;
var DEFAULT_RELATIVE_ZOOM = 0;
var DEFAULT_TIMING_FUNCTION = "ease";

// Zoom factor for user zoom action (keyboard and mouse wheel)
var SCALE_FACTOR = 1.05;

// Rotation step for user rotate action (keyboard and mouse wheel)
var ROTATE_STEP = 5;

var Player = exports.Player = Object.create(_events.EventEmitter.prototype);

Player.init = function (viewport, presentation) {
    var _this = this;

    var editMode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    _events.EventEmitter.call(this);
    this.editMode = !!editMode;
    this.viewport = viewport;
    this.presentation = presentation;
    this.animator = Object.create(_Animator.Animator).init();
    this.playing = false;
    this.waitingTimeout = false;
    this.currentFrame = presentation.frames[0];
    this.targetFrame = presentation.frames[0];
    this.timeoutHandle = null;
    this.transitions = [];

    if (!this.editMode) {
        this.viewport.addListener("click", function (btn) {
            return _this.onClick(btn);
        });
        window.addEventListener("keydown", function (evt) {
            return _this.onKeyDown(evt);
        }, false);
        if (this.presentation.enableMouseTranslation) {
            this.viewport.addListener("dragStart", function () {
                return _this.pause();
            });
        }
        this.viewport.addListener("userChangeState", function () {
            return _this.pause();
        });
        window.addEventListener("keypress", function (evt) {
            return _this.onKeyPress(evt);
        }, false);
    }
    this.animator.addListener("step", function (p) {
        return _this.onAnimatorStep(p);
    });
    this.animator.addListener("stop", function () {
        return _this.onAnimatorStop();
    });
    this.animator.addListener("done", function () {
        return _this.onAnimatorDone();
    });

    return this;
};

Player.onClick = function (button) {
    if (this.presentation.enableMouseNavigation) {
        switch (button) {
            case 0:
                this.moveToNext();break;
            case 2:
                this.moveToPrevious();break;
        }
    }
};

Player.onKeyDown = function (evt) {
    // Keys with Alt/Ctrl/Meta modifiers are ignored
    if (evt.altKey || evt.ctrlKey || evt.metaKey) {
        return;
    }

    switch (evt.keyCode) {
        case 36:
            // Home
            if (this.presentation.enableKeyboardNavigation) {
                if (evt.shiftKey) {
                    this.jumpToFirst();
                } else {
                    this.moveToFirst();
                }
            }
            break;

        case 35:
            // End
            if (this.presentation.enableKeyboardNavigation) {
                if (evt.shiftKey) {
                    this.jumpToLast();
                } else {
                    this.moveToLast();
                }
            }
            break;

        case 38: // Arrow up
        case 33: // Page up
        case 37:
            // Arrow left
            if (this.presentation.enableKeyboardNavigation) {
                if (evt.shiftKey) {
                    this.jumpToPrevious();
                } else {
                    this.moveToPrevious();
                }
            }
            break;

        case 40: // Arrow down
        case 34: // Page down
        case 39: // Arrow right
        case 13: // Enter
        case 32:
            // Space
            if (this.presentation.enableKeyboardNavigation) {
                if (evt.shiftKey) {
                    this.jumpToNext();
                } else {
                    this.moveToNext();
                }
            }
            break;

        default:
            return;
    }

    evt.stopPropagation();
    evt.preventDefault();
};

/**
 * Event handler: key press.
 *
 * This method handles character keys:
 *    - "+", "-": zoom in/out
 *    - "R", "r": rotate clockwise/counter-clockwise.
 *
 * Parameters:
 *    - evt: The DOM event object
 *
 * TODO use keydown event
 */
Player.onKeyPress = function (evt) {
    // Keys with modifiers are ignored
    if (evt.altKey || evt.ctrlKey || evt.metaKey) {
        return;
    }

    switch (evt.charCode || evt.which) {
        case 43:
            // +
            if (this.presentation.enableKeyboardZoom) {
                this.viewport.zoom(SCALE_FACTOR, this.viewport.width / 2, this.viewport.height / 2);
                this.pause();
            }
            break;

        case 45:
            // -
            if (this.presentation.enableKeyboardZoom) {
                this.viewport.zoom(1 / SCALE_FACTOR, this.viewport.width / 2, this.viewport.height / 2);
                this.pause();
            }
            break;

        case 82:
            // R
            if (this.presentation.enableKeyboardRotation) {
                this.viewport.rotate(-ROTATE_STEP);
                this.pause();
            }
            break;

        case 114:
            // r
            if (this.presentation.enableKeyboardRotation) {
                this.viewport.rotate(ROTATE_STEP);
                this.pause();
            }
            break;

        case 80: // P
        case 112:
            //p
            if (this.playing) {
                this.pause();
            } else {
                this.resume();
            }
            break;

        case 46:
            // .
            if (this.presentation.enableKeyboardNavigation) {
                this.toggleBlankScreen();
            }
            break;

        default:
            return;
    }

    evt.stopPropagation();
    evt.preventDefault();
};

Player.findFrame = function (frame) {
    if (_Presentation.Frame.isPrototypeOf(frame)) {
        return frame;
    }
    if (typeof frame === "string") {
        return this.presentation.getFrameWithId(frame);
    }
    if (typeof frame === "number") {
        return this.presentation.frames[frame];
    }
    return null;
};

Object.defineProperty(Player, "previousFrame", {
    get: function get() {
        var frame = this.animator.running ? this.targetFrame : this.currentFrame;
        var index = (frame.index + this.presentation.frames.length - 1) % this.presentation.frames.length;
        return this.presentation.frames[index];
    }
});

Object.defineProperty(Player, "nextFrame", {
    get: function get() {
        var frame = this.animator.running ? this.targetFrame : this.currentFrame;
        var index = (frame.index + 1) % this.presentation.frames.length;
        return this.presentation.frames[index];
    }
});

Player.showCurrentFrame = function () {
    this.viewport.setAtStates(this.currentFrame.cameraStates).update();
    this.emit("frameChange");
    return this;
};

/*
 * Start the presentation from the given frame.
 *
 * This method sets the "playing" flag, shows the desired frame
 * and waits for the frame timeout if needed.
 */
Player.playFromFrame = function (frame) {
    if (!this.playing) {
        this.playing = true;
        this.emit("stateChange");
    }
    this.waitingTimeout = false;
    this.targetFrame = this.currentFrame = this.findFrame(frame);
    this.showCurrentFrame();
    this.waitTimeout();
    return this;
};

/*
 * Pause the presentation.
 *
 * This method clears the "playing" flag.
 * If the presentation was in "waiting" mode due to a timeout
 * in the current frame, then it stops waiting.
 * The current animation is stopped in its current state.
 */
Player.pause = function () {
    this.animator.stop();
    if (this.waitingTimeout) {
        window.clearTimeout(this.timeoutHandle);
        this.waitingTimeout = false;
    }
    if (this.playing) {
        this.playing = false;
        this.emit("stateChange");
    }
    this.targetFrame = this.currentFrame;
    return this;
};

/*
 * Resume playing from the current frame.
 */
Player.resume = function () {
    this.playFromFrame(this.currentFrame);
    return this;
};

/*
 * Starts waiting before moving to the next frame.
 *
 * It the current frame has a timeout set, this method
 * will register a timer to move to the next frame automatically
 * after the specified time.
 *
 * If the current frame is the last, the presentation will
 * move to the first frame.
 */
Player.waitTimeout = function () {
    var _this2 = this;

    if (this.currentFrame.timeoutEnable) {
        this.waitingTimeout = true;
        this.timeoutHandle = window.setTimeout(function () {
            return _this2.moveToNext();
        }, this.currentFrame.timeoutMs);
    }
    return this;
};

/*
 * Jump to a frame.
 *
 * This method does not animate the transition from the current
 * state of the viewport to the desired frame.
 *
 * The presentation is stopped: if a timeout has been set for the
 * target frame, it will be ignored.
 */
Player.jumpToFrame = function (frame) {
    this.disableBlankScreen();

    this.pause();

    this.targetFrame = this.currentFrame = this.findFrame(frame);
    this.showCurrentFrame();
    return this;
};

/*
 * Jumps to the first frame of the presentation.
 */
Player.jumpToFirst = function () {
    return this.jumpToFrame(0);
};

/*
 * Jump to the last frame of the presentation.
 */
Player.jumpToLast = function () {
    return this.jumpToFrame(this.presentation.frames.length - 1);
};

/*
 * Jumps to the previous frame.
 */
Player.jumpToPrevious = function () {
    return this.jumpToFrame(this.previousFrame);
};

/*
 * Jumps to the next frame.
 */
Player.jumpToNext = function () {
    return this.jumpToFrame(this.nextFrame);
};

/*
 * Move to a frame.
 *
 * This method animates the transition from the current
 * state of the viewport to the desired frame.
 *
 * If the given frame corresponds to the next frame in the list,
 * the transition properties of the next frame are used.
 * Otherwise, default transition properties are used.
 */
Player.moveToFrame = function (frame) {
    var _this3 = this;

    this.disableBlankScreen();

    if (this.waitingTimeout) {
        window.clearTimeout(this.timeoutHandle);
        this.waitingTimeout = false;
    }

    this.targetFrame = this.findFrame(frame);

    var layerProperties = null;
    var durationMs = DEFAULT_TRANSITION_DURATION_MS;
    var useTransitionPath = false;
    var backwards = false;

    if (this.currentFrame) {
        if (this.targetFrame === this.nextFrame) {
            durationMs = this.targetFrame.transitionDurationMs;
            layerProperties = this.targetFrame.layerProperties;
            useTransitionPath = true;
        } else if (this.targetFrame === this.previousFrame) {
            durationMs = this.currentFrame.transitionDurationMs;
            layerProperties = this.currentFrame.layerProperties;
            useTransitionPath = true;
            backwards = true;
        }
    }

    if (!this.editMode && !this.playing) {
        this.playing = true;
        this.emit("stateChange");
    }

    this.viewport.cameras.forEach(function (camera) {
        var timingFunction = Timing[DEFAULT_TIMING_FUNCTION];
        var relativeZoom = DEFAULT_RELATIVE_ZOOM;
        var transitionPath = null;

        if (layerProperties) {
            var lp = layerProperties[camera.layer.index];
            relativeZoom = lp.transitionRelativeZoom;
            timingFunction = Timing[lp.transitionTimingFunction];
            if (useTransitionPath) {
                transitionPath = lp.transitionPath;
            }
            if (backwards) {
                timingFunction = timingFunction.reverse;
            }
        }

        _this3.setupTransition(camera, timingFunction, relativeZoom, transitionPath, backwards);
    });

    this.animator.start(durationMs);

    return this;
};

/*
 * Move to the first frame of the presentation.
 */
Player.moveToFirst = function () {
    return this.moveToFrame(0);
};

/*
 * Move to the last frame of the presentation.
 */
Player.moveToLast = function () {
    return this.moveToFrame(this.presentation.frames.length - 1);
};

/*
 * Move to the previous frame.
 *
 * This method skips previous frames with 0 ms timeout.
 */
Player.moveToPrevious = function () {
    for (var index = this.previousFrame.index; index >= 0; index--) {
        var frame = this.presentation.frames[index];
        if (!frame.timeoutEnable || frame.timeoutMs !== 0) {
            this.moveToFrame(frame);
            break;
        }
    }
    return this;
};

/*
 * Move to the next frame.
 */
Player.moveToNext = function () {
    return this.moveToFrame(this.nextFrame);
};

/*
 * Restore the current frame.
 *
 * This method restores the viewport to fit the current frame,
 * e.g. after the viewport has been zoomed or dragged.
 */
Player.moveToCurrent = function () {
    return this.moveToFrame(this.currentFrame);
};

/*
 * Move to a frame.
 *
 * This method animates the transition from the current
 * state of the viewport to the desired frame, using
 * default transition settings.
 */
Player.previewFrame = function (frame) {
    var _this4 = this;

    this.targetFrame = this.findFrame(frame);

    this.viewport.cameras.forEach(function (camera) {
        _this4.setupTransition(camera, Timing[DEFAULT_TIMING_FUNCTION], DEFAULT_RELATIVE_ZOOM);
    });

    this.animator.start(DEFAULT_TRANSITION_DURATION_MS);
    return this;
};

Player.setupTransition = function (camera, timingFunction, relativeZoom, svgPath, reverse) {
    if (this.animator.running) {
        this.animator.stop();
    }

    this.transitions.push({
        camera: camera,
        initialState: Object.create(_CameraState.CameraState).initFrom(camera),
        finalState: this.targetFrame.cameraStates[camera.layer.index],
        timingFunction: timingFunction,
        relativeZoom: relativeZoom,
        svgPath: svgPath,
        reverse: reverse
    });

    return this;
};

Player.onAnimatorStep = function (progress) {
    this.transitions.forEach(function (transition) {
        transition.camera.interpolate(transition.initialState, transition.finalState, progress, transition.timingFunction, transition.relativeZoom, transition.svgPath, transition.reverse);
        transition.camera.update();
    });
};

Player.onAnimatorStop = function () {
    this.transitions = [];
    this.currentFrame = this.targetFrame;
    this.emit("frameChange");
};

Player.onAnimatorDone = function () {
    this.transitions = [];
    this.currentFrame = this.targetFrame;
    this.emit("frameChange");
    if (this.playing) {
        this.waitTimeout();
    }
};

Object.defineProperty(Player, "blankScreenIsVisible", {
    get: function get() {
        return document.querySelector(".sozi-blank-screen").style.visibility === "visible";
    }
});

Player.enableBlankScreen = function () {
    this.pause();
    var blankScreen = document.querySelector(".sozi-blank-screen");
    if (blankScreen) {
        blankScreen.style.opacity = 1;
        blankScreen.style.visibility = "visible";
    }
};

Player.disableBlankScreen = function () {
    var blankScreen = document.querySelector(".sozi-blank-screen");
    if (blankScreen) {
        blankScreen.style.opacity = 0;
        blankScreen.style.visibility = "hidden";
    }
};

Player.toggleBlankScreen = function () {
    if (this.blankScreenIsVisible) {
        this.disableBlankScreen();
    } else {
        this.enableBlankScreen();
    }
};

Player.disableMedia = function () {
    Media.disable();
};
