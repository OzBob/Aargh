/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var PREVIEW_MARGIN = 15;

var Preview = exports.Preview = {
    init: function init(container, presentation, selection, viewport, controller) {
        var _this = this;

        this.container = container;
        this.presentation = presentation;
        this.selection = selection;
        this.viewport = viewport;
        this.controller = controller;

        controller.addListener("loadSVG", function () {
            return _this.onLoad();
        });
        window.addEventListener("resize", function () {
            return _this.repaint();
        });
        viewport.addListener("mouseDown", function () {
            return document.activeElement.blur();
        });
        viewport.addListener("click", function (btn, evt) {
            return _this.onClick(btn, evt);
        });
        viewport.addListener("userChangeState", function () {
            return controller.updateCameraStates();
        });
        controller.addListener("repaint", function () {
            return _this.repaint();
        });
        container.addEventListener("mouseenter", function () {
            return _this.onMouseEnter();
        }, false);
        container.addEventListener("mouseleave", function () {
            return _this.onMouseLeave();
        }, false);

        return this;
    },
    onLoad: function onLoad() {
        // Set the window title to the presentation title
        document.querySelector("html head title").innerHTML = this.presentation.title;

        // Replace the content of the preview area with the SVG document
        while (this.container.hasChildNodes()) {
            this.container.removeChild(this.container.firstChild);
        }
        this.container.appendChild(this.presentation.document.root);

        this.viewport.onLoad();
    },
    repaint: function repaint() {
        // this.container is assumed to have padding: 0
        var parentWidth = this.container.parentNode.clientWidth;
        var parentHeight = this.container.parentNode.clientHeight;

        var maxWidth = parentWidth - 2 * PREVIEW_MARGIN;
        var maxHeight = parentHeight - 2 * PREVIEW_MARGIN;

        var width = Math.min(maxWidth, maxHeight * this.presentation.aspectWidth / this.presentation.aspectHeight);
        var height = Math.min(maxHeight, maxWidth * this.presentation.aspectHeight / this.presentation.aspectWidth);

        this.container.style.left = (parentWidth - width) / 2 + "px";
        this.container.style.top = (parentHeight - height) / 2 + "px";
        this.container.style.width = width + "px";
        this.container.style.height = height + "px";

        if (this.selection.currentFrame) {
            this.viewport.setAtStates(this.selection.currentFrame.cameraStates);
        }

        if (this.viewport.ready) {
            this.viewport.repaint();
        }
    },
    onClick: function onClick(button, evt) {
        if (button === 0 && evt.altKey) {
            var outlineElement = evt.target;
            if (outlineElement.hasAttribute("id") && outlineElement.getBBox) {
                this.controller.setOutlineElement(outlineElement);
            }
        }
    },


    /*
     * When the mouse enters the preview area,
     * show the document outside the clipping rectangle
     * and show the hidden SVG elements.
     */
    onMouseEnter: function onMouseEnter() {
        this.viewport.cameras.forEach(function (camera) {
            if (camera.selected) {
                camera.revealClipping();
            }
        });
        this.viewport.showHiddenElements = true;
        this.viewport.repaint();
    },


    /*
     * When the mouse leaves the preview area,
     * hide the document outside the clipping rectangle
     * and hide the hidden SVG elements.
     */
    onMouseLeave: function onMouseLeave() {
        this.viewport.cameras.forEach(function (camera) {
            if (camera.selected) {
                camera.concealClipping();
            }
        });
        this.viewport.showHiddenElements = false;
        this.viewport.repaint();
    }
};
