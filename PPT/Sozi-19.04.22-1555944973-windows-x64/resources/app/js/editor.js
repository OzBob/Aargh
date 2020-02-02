/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

require("./backend");

require("./svg");

var _SVGDocumentWrapper = require("./svg/SVGDocumentWrapper");

var _Presentation = require("./model/Presentation");

var _Selection = require("./model/Selection");

var _Preferences = require("./model/Preferences");

var _Storage = require("./Storage");

var _Viewport = require("./player/Viewport");

var _Player = require("./player/Player");

var _Controller = require("./Controller");

var _Preview = require("./view/Preview");

var _Properties = require("./view/Properties");

var _Toolbar = require("./view/Toolbar");

var _Timeline = require("./view/Timeline");

var _nunjucks = require("nunjucks");

var _nunjucks2 = _interopRequireDefault(_nunjucks);

var _i18n = require("./i18n");

var i18n = _interopRequireWildcard(_i18n);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.addEventListener("load", function () {
    _nunjucks2.default.configure({ watch: false });

    Notification.requestPermission();

    _Presentation.Presentation.init();
    _Selection.Selection.init(_Presentation.Presentation);
    _Viewport.Viewport.init(_Presentation.Presentation, true);
    _Player.Player.init(_Viewport.Viewport, _Presentation.Presentation, true);

    var locale = i18n.init();

    _Controller.Controller.init(_Storage.Storage, _Preferences.Preferences, _Presentation.Presentation, _Selection.Selection, _Timeline.Timeline, _Viewport.Viewport, _Player.Player, locale);

    _Preview.Preview.init(document.getElementById("sozi-editor-view-preview"), _Presentation.Presentation, _Selection.Selection, _Viewport.Viewport, _Controller.Controller);

    _Properties.Properties.init(document.getElementById("sozi-editor-view-properties"), _Selection.Selection, _Controller.Controller, _Timeline.Timeline, locale);
    _Toolbar.Toolbar.init(document.getElementById("sozi-editor-view-toolbar"), _Storage.Storage, _Presentation.Presentation, _Viewport.Viewport, _Controller.Controller, locale);
    _Timeline.Timeline.init(document.getElementById("sozi-editor-view-timeline"), _Presentation.Presentation, _Selection.Selection, _Controller.Controller, locale);
    _Storage.Storage.init(_Controller.Controller, _SVGDocumentWrapper.SVGDocumentWrapper, _Presentation.Presentation, _Selection.Selection, _Timeline.Timeline, locale);

    var body = document.querySelector("body");
    var left = document.querySelector(".left");
    var right = document.querySelector(".right");
    var top = document.querySelector(".top");
    var bottom = document.querySelector(".bottom");
    var hsplitter = document.querySelector(".hsplitter");
    var vsplitter = document.querySelector(".vsplitter");

    var hsplitterStartY = void 0,
        vsplitterStartX = void 0;

    var hsplitterHeight = hsplitter.getBoundingClientRect().height;
    var vsplitterWidth = vsplitter.getBoundingClientRect().width;

    function hsplitterOnMouseMove(evt) {
        var topHeightPercent = 100 * (hsplitterStartY + evt.clientY) / window.innerHeight;
        top.style.height = topHeightPercent + "%";
        hsplitter.style.top = topHeightPercent + "%";
        bottom.style.height = "calc(" + (100 - topHeightPercent) + "% - " + hsplitterHeight + "px)";
        window.dispatchEvent(new UIEvent("resize"));
        return false;
    }

    function hsplitterOnMouseUp() {
        body.removeEventListener("mousemove", hsplitterOnMouseMove);
        body.removeEventListener("mouseup", hsplitterOnMouseUp);
    }

    function vsplitterOnMouseMove(evt) {
        var leftWidthPercent = 100 * (vsplitterStartX + evt.clientX) / window.innerWidth;
        left.style.width = leftWidthPercent + "%";
        vsplitter.style.left = leftWidthPercent + "%";
        right.style.width = "calc(" + (100 - leftWidthPercent) + "% - " + vsplitterWidth + "px)";
        window.dispatchEvent(new UIEvent("resize"));
        return false;
    }

    function vsplitterOnMouseUp() {
        body.removeEventListener("mousemove", vsplitterOnMouseMove);
        body.removeEventListener("mouseup", vsplitterOnMouseUp);
    }

    hsplitter.addEventListener("mousedown", function (evt) {
        hsplitterStartY = hsplitter.getBoundingClientRect().top - evt.clientY;
        body.addEventListener("mousemove", hsplitterOnMouseMove);
        body.addEventListener("mouseup", hsplitterOnMouseUp);
    });

    vsplitter.addEventListener("mousedown", function (evt) {
        vsplitterStartX = vsplitter.getBoundingClientRect().left - evt.clientX;
        body.addEventListener("mousemove", vsplitterOnMouseMove);
        body.addEventListener("mouseup", vsplitterOnMouseUp);
    });

    window.addEventListener("keydown", function (evt) {
        var key = "";
        if (evt.ctrlKey) {
            key += "Ctrl+";
        }
        if (evt.altKey) {
            key += "Alt+";
        }
        if (evt.shiftKey) {
            key += "Shift+";
        }
        key += evt.key.toUpperCase();

        var actionFound = null;

        for (var action in _Preferences.Preferences.keys) {
            if (_Preferences.Preferences.keys[action] === key) {
                actionFound = action;
                break;
            }
        }

        switch (actionFound) {
            case "fitElement":
                _Controller.Controller.fitElement();
                break;
            case "resetLayer":
                _Controller.Controller.resetLayer();
                break;
            case "addFrame":
                _Controller.Controller.addFrame();
                break;
            case "save":
                _Controller.Controller.save();
                break;
            case "redo":
                _Controller.Controller.redo();
                break;
            case "undo":
                _Controller.Controller.undo();
                break;
            case "focusTitleField":
                document.getElementById('field-title').select();
                break;
            case "reload":
                _Controller.Controller.reload();
                break;
            case "toggleFullscreen":
                document.getElementById('btn-fullscreen').click();
                break;
            case "toggleDevTools":
                _Storage.Storage.backend.toggleDevTools();
                break;
        }

        // Keyboard acctions that may collide with text inputs.
        if (!actionFound && !/INPUT|SELECT|TEXTAREA|SECTION/.test(document.activeElement.tagName)) {
            actionFound = true;
            switch (evt.key) {
                case "End":
                    _Controller.Controller.selectFrame(-1);
                    break;
                case "Home":
                    _Controller.Controller.selectFrame(0);
                    break;
                case "ArrowLeft":
                    _Controller.Controller.selectRelativeFrame(-1);
                    break;
                case "ArrowRight":
                    _Controller.Controller.selectRelativeFrame(1);
                    break;
                case "Delete":
                    _Controller.Controller.deleteFrames();
                    break;
                case "a":
                    if (evt.ctrlKey) {
                        _Controller.Controller.selectAllFrames();
                    } else {
                        actionFound = false;
                    }
                    break;
                default:
                    actionFound = false;
            }
        }

        if (actionFound) {
            evt.preventDefault();
        }
    }, false);
}, false);
