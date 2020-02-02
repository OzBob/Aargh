/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = init;
exports.open = open;
exports.close = close;
exports.toggle = toggle;

var _utils = require("../utils");

var _Animator = require("./Animator");

var _Timing = require("./Timing");

var Timing = _interopRequireWildcard(_Timing);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var DURATION_MS = 500;

var frameList = void 0;
var links = void 0;
var player = void 0;
var animator = void 0;
var isOpen = false;
var startOffset = -1;
var endOffset = -1;
var currentOffset = startOffset;

function init(aPlayer) {
    player = aPlayer;

    frameList = document.querySelector(".sozi-frame-list");

    links = (0, _utils.toArray)(frameList.querySelectorAll("li a"));
    links.forEach(function (link) {
        link.addEventListener("click", function (evt) {
            if (evt.button === 0) {
                player.previewFrame(link.hash.slice(1));
                evt.preventDefault();
            }
        });
    });

    animator = Object.create(_Animator.Animator).init();
    animator.addListener("step", onAnimatorStep);
    window.addEventListener("keypress", onKeyPress, false);
    window.addEventListener("resize", function () {
        return setCurrentOffset(currentOffset);
    });
    player.viewport.addListener("mouseDown", onMouseDown);
    frameList.addEventListener("mouseout", onMouseOut, false);
    aPlayer.addListener("frameChange", onFrameChange);
    setCurrentOffset(startOffset);
}

function setCurrentOffset(offset) {
    currentOffset = offset;
    frameList.style.left = currentOffset * frameList.offsetWidth + "px";
}

function moveTo(offset) {
    player.pause();
    startOffset = currentOffset;
    endOffset = offset;
    animator.start(Math.abs(endOffset - startOffset) * DURATION_MS);
}

function open() {
    moveTo(0);
}

function close() {
    moveTo(-1);
}

function toggle() {
    moveTo(-1 - endOffset);
}

function onKeyPress(evt) {
    // Keys with modifiers are ignored
    if (evt.altKey || evt.ctrlKey || evt.metaKey) {
        return;
    }

    switch (evt.charCode || evt.which) {
        case 84: // T
        case 116:
            // t
            if (player.presentation.enableKeyboardNavigation) {
                player.disableBlankScreen();
                toggle();
            }
            break;
        default:
            return;
    }

    evt.stopPropagation();
    evt.preventDefault();
}

function onAnimatorStep(progress) {
    var p = Timing.ease(progress);
    setCurrentOffset(endOffset * p + startOffset * (1 - p));
}

function onMouseDown(button) {
    if (player.presentation.enableMouseNavigation && button === 1) {
        toggle();
    }
}

function onMouseOut(evt) {
    var rel = evt.relatedTarget;
    while (rel && rel !== frameList && rel !== document.documentElement) {
        rel = rel.parentNode;
    }
    if (rel !== frameList) {
        close();
        evt.stopPropagation();
    }
}

function onFrameChange() {
    links.forEach(function (link) {
        link.className = link.hash === "#" + player.currentFrame.frameId ? "current" : "";
    });
}
