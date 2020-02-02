/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VirtualDOMView = undefined;

var _inferno = require("inferno");

var _infernoHyperscript = require("inferno-hyperscript");

var VirtualDOMView = exports.VirtualDOMView = {
    init: function init(container, controller) {
        var _this = this;

        this.container = container;
        this.controller = controller;
        this.state = {};

        var repaintHandler = function repaintHandler() {
            return _this.repaint();
        };
        controller.addListener("repaint", repaintHandler);
        window.addEventListener("resize", repaintHandler);

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        return this;
    },
    repaint: function repaint() {
        var _this2 = this;

        (0, _inferno.render)(this.render(), this.container, function () {
            Object.keys(_this2.state).forEach(function (prop) {
                var elt = document.getElementById("field-" + prop);
                if (elt) {
                    Object.keys(_this2.state[prop]).forEach(function (attr) {
                        return elt[attr] = _this2.state[prop][attr];
                    });
                }
            });
        });
    },
    render: function render() {
        return (0, _infernoHyperscript.h)("div");
    }
};
