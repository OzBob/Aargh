/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var _SVGDocumentWrapper = require("./svg/SVGDocumentWrapper");

var _Presentation = require("./model/Presentation");

var _Viewport = require("./player/Viewport");

var _Player = require("./player/Player");

var _Media = require("./player/Media");

var Media = _interopRequireWildcard(_Media);

var _FrameList = require("./player/FrameList");

var FrameList = _interopRequireWildcard(_FrameList);

var _FrameNumber = require("./player/FrameNumber");

var FrameNumber = _interopRequireWildcard(_FrameNumber);

var _FrameURL = require("./player/FrameURL");

var FrameURL = _interopRequireWildcard(_FrameURL);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

window.addEventListener("load", function () {
    var svgRoot = document.querySelector("svg");
    svgRoot.style.display = "inline";

    _SVGDocumentWrapper.SVGDocumentWrapper.init(svgRoot);
    _Presentation.Presentation.init().setSVGDocument(_SVGDocumentWrapper.SVGDocumentWrapper);
    _Viewport.Viewport.init(_Presentation.Presentation, false).onLoad();

    _Presentation.Presentation.fromStorable(window.soziPresentationData);
    _Player.Player.init(_Viewport.Viewport, _Presentation.Presentation);

    Media.init(_Player.Player);
    FrameList.init(_Player.Player);
    FrameNumber.init(_Player.Player);
    FrameURL.init(_Player.Player);

    window.sozi = {
        presentation: _Presentation.Presentation,
        viewport: _Viewport.Viewport,
        player: _Player.Player
    };

    _Player.Player.addListener("stateChange", function () {
        if (_Player.Player.playing) {
            document.title = _Presentation.Presentation.title;
        } else {
            document.title = _Presentation.Presentation.title + " (Paused)";
        }
    });

    window.addEventListener("resize", function () {
        return _Viewport.Viewport.repaint();
    });

    if (_Presentation.Presentation.frames.length) {
        _Player.Player.playFromFrame(FrameURL.getFrame());
    }

    _Viewport.Viewport.repaint();
    _Player.Player.disableBlankScreen();

    document.querySelector(".sozi-blank-screen .spinner").style.display = "none";
});
