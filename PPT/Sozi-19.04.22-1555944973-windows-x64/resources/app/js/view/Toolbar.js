/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Toolbar = undefined;

var _infernoHyperscript = require("inferno-hyperscript");

var _VirtualDOMView = require("./VirtualDOMView");

var _Properties = require("./Properties");

var _screenfull = require("screenfull");

var _screenfull2 = _interopRequireDefault(_screenfull);

var _package = require("../../package.json");

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Toolbar = exports.Toolbar = Object.create(_VirtualDOMView.VirtualDOMView);

Toolbar.init = function (container, storage, presentation, viewport, controller, locale) {
    _VirtualDOMView.VirtualDOMView.init.call(this, container, controller);

    this.storage = storage;
    this.presentation = presentation;
    this.viewport = viewport;
    this.gettext = function (s) {
        return locale.gettext(s);
    };

    return this;
};

Toolbar.render = function () {
    var _ = this.gettext;
    var c = this.controller;
    var v = this.viewport;
    var t = this;

    this.state["aspect-width"] = { value: this.presentation.aspectWidth };
    this.state["aspect-height"] = { value: this.presentation.aspectHeight };

    return (0, _infernoHyperscript.h)("div", [(0, _infernoHyperscript.h)("span.group", [_("Aspect ratio: "), (0, _infernoHyperscript.h)("input.aspect", {
        id: "field-aspect-width",
        type: "number",
        pattern: "\\d+",
        min: "1",
        step: "1",
        size: "3",
        onchange: function onchange() {
            var width = parseInt(this.value);
            if (!width.isNaN) {
                c.setAspectWidth(width);
            }
        }
    }), " : ", (0, _infernoHyperscript.h)("input.aspect", {
        id: "field-aspect-height",
        type: "number",
        pattern: "\\d+",
        min: "1",
        step: "1",
        size: "3",
        onchange: function onchange() {
            var height = parseInt(this.value);
            if (!height.isNaN) {
                c.setAspectHeight(height);
            }
        }
    })]), (0, _infernoHyperscript.h)("span.group.btn-group", [(0, _infernoHyperscript.h)("button", {
        title: _("Move the selected layers (hold Alt to zoom, Shift to rotate)"),
        className: v.dragMode === "translate" ? "active" : "",
        onclick: function onclick() {
            c.setDragMode("translate");
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-arrows-alt")), (0, _infernoHyperscript.h)("button", {
        title: _("Zoom in/out on the selected layers (you can also hold the Alt key in Move mode)"),
        className: v.dragMode === "scale" ? "active" : "",
        onclick: function onclick() {
            c.setDragMode("scale");
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-expand")), (0, _infernoHyperscript.h)("button", {
        title: _("Rotate the selected layers (you can also hold the Shift key in Move mode)"),
        className: v.dragMode === "rotate" ? "active" : "",
        onclick: function onclick() {
            c.setDragMode("rotate");
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-undo")), // "undo" icon shows a counter-clockwise circular arrow
    (0, _infernoHyperscript.h)("button", {
        title: _("Edit the clipping area"),
        className: v.dragMode === "clip" ? "active" : "",
        onclick: function onclick() {
            c.setDragMode("clip");
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-crop"))]), (0, _infernoHyperscript.h)("span.group.btn-group", [(0, _infernoHyperscript.h)("button", {
        title: _("Undo"),
        disabled: c.undoStack.length ? undefined : "disabled",
        onclick: function onclick() {
            c.undo();
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-reply")), // "reply" icon preferred to the official "undo" icon
    (0, _infernoHyperscript.h)("button", {
        title: _("Redo"),
        disabled: c.redoStack.length ? undefined : "disabled",
        onclick: function onclick() {
            c.redo();
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-share")) // "share" icon preferred to the official "redo" icon
    ]), (0, _infernoHyperscript.h)("span.group", [(0, _infernoHyperscript.h)("button", {
        title: _screenfull2.default.isFullscreen ? _("Disable full-screen mode") : _("Enable full-screen mode"),
        id: "btn-fullscreen",
        className: _screenfull2.default.isFullscreen ? "active" : undefined,
        disabled: !_screenfull2.default.enabled,
        onclick: function onclick() {
            _screenfull2.default.toggle(document.documentElement);
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-desktop"))]), (0, _infernoHyperscript.h)("span.group.btn-group", [(0, _infernoHyperscript.h)("button", {
        title: _("Save the presentation"),
        disabled: this.storage.htmlNeedsSaving ? undefined : "disabled",
        onclick: function onclick() {
            c.save();
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-download")), // "download" icon preferred to the official "save" icon
    (0, _infernoHyperscript.h)("button", {
        title: _("Reload the SVG document"),
        onclick: function onclick() {
            c.reload();
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-sync"))]), (0, _infernoHyperscript.h)("span.group.btn-group", [(0, _infernoHyperscript.h)("button", {
        title: _("Preferences"),
        className: _Properties.Properties.preferencesMode ? "active" : undefined,
        onclick: function onclick() {
            _Properties.Properties.togglePreferencesMode();t.repaint();
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-sliders-h")), (0, _infernoHyperscript.h)("button", {
        title: _("Information"),
        onclick: function onclick() {
            c.info("Sozi " + _package2.default.version, true);
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-info"))])]);
};
