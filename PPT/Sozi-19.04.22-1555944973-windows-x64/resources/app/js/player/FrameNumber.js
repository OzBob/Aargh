/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = init;

var _FrameList = require("./FrameList");

var FrameList = _interopRequireWildcard(_FrameList);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(player) {
    var frameNumber = document.querySelector(".sozi-frame-number");

    player.addListener("frameChange", function () {
        frameNumber.innerHTML = player.currentFrame.index + 1;
        frameNumber.style.visibility = player.currentFrame.showFrameNumber ? "visible" : "hidden";
    });

    frameNumber.addEventListener("click", FrameList.open);
}
