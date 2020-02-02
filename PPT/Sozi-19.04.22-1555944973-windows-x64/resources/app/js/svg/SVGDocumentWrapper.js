/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SVGDocumentWrapper = exports.DefaultHandler = undefined;
exports.registerHandler = registerHandler;

var _utils = require("../utils");

// Constant: the SVG namespace
var SVG_NS = "http://www.w3.org/2000/svg";

// Constant: The SVG element names that can be found in layers
var DRAWABLE_TAGS = ["g", "image", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "clippath"];

var handlers = {};

function registerHandler(name, handler) {
    handlers[name] = handler;
}

var DefaultHandler = exports.DefaultHandler = {
    matches: function matches(svgRoot) {
        return true;
    },
    transform: function transform(svgRoot) {
        return this;
    },
    isLayer: function isLayer(svgElement) {
        return true;
    },
    getLabel: function getLabel(svgElement) {
        return null;
    }
};

var SVGDocumentWrapper = exports.SVGDocumentWrapper = {
    asText: "",
    root: undefined,
    handler: DefaultHandler,

    init: function init(svgRoot) {
        this.root = svgRoot;

        // Prevent event propagation on hyperlinks
        var links = (0, _utils.toArray)(this.root.getElementsByTagName("a"));
        links.forEach(function (link) {
            link.addEventListener("mousedown", function (evt) {
                return evt.stopPropagation();
            }, false);
        });

        return this;
    },


    get isValidSVG() {
        return this.root instanceof SVGSVGElement;
    },

    /*
     * The given node is a valid layer if it has the following characteristics:
     *    - it is an SVG group element
     *    - it has an id that has not been met before
     *    - it is recognized as a layer by the current SVG handler
     */
    isLayer: function isLayer(svgNode) {
        return svgNode instanceof SVGGElement && svgNode.hasAttribute("id") && this.handler.isLayer(svgNode);
    },
    initFromString: function initFromString(data) {
        var _this = this;

        this.root = new DOMParser().parseFromString(data, "image/svg+xml").documentElement;

        this.handler = DefaultHandler;
        for (var name in handlers) {
            if (handlers[name].matches(this.root)) {
                console.log("Using handler: " + name);
                this.handler = handlers[name];
                break;
            }
        }

        // Check that the root is an SVG element
        if (this.isValidSVG) {
            // Apply handler-specific transformations
            this.handler.transform(this.root);

            // Remove attributes that prevent correct rendering
            this.removeViewbox();

            // Remove any existing script inside the SVG DOM tree
            this.removeScripts();

            // Disable hyperlinks
            this.disableHyperlinks();

            // Fix <switch> elements from Adobe Illustrator
            var aiHandler = handlers["Adobe Illustrator"];
            if (aiHandler && this.handler !== aiHandler) {
                aiHandler.transform(this.root);
            }

            // Wrap isolated elements into groups
            var svgWrapper = document.createElementNS(SVG_NS, "g");

            // Get all child nodes of the SVG root.
            // Make a copy of root.childNodes before modifying the document.
            (0, _utils.toArray)(this.root.childNodes).forEach(function (svgNode) {
                // Remove text nodes and comments
                if (svgNode.tagName === undefined) {
                    _this.root.removeChild(svgNode);
                }
                // Reorganize drawable SVG elements into top-level groups
                else if (DRAWABLE_TAGS.indexOf(svgNode.localName) >= 0) {
                        // If the current node is not a layer,
                        // add it to the current wrapper.
                        if (!_this.isLayer(svgNode)) {
                            svgWrapper.appendChild(svgNode);
                        }
                        // If the current node is a layer and the current
                        // wrapper contains elements, insert the wrapper
                        // into the document and create a new empty wrapper.
                        else if (svgWrapper.firstChild) {
                                _this.root.insertBefore(svgWrapper, svgNode);
                                svgWrapper = document.createElementNS(SVG_NS, "g");
                            }
                    }
            });

            // If the current wrapper layer contains elements,
            // add it to the document.
            if (svgWrapper.firstChild) {
                this.root.appendChild(svgWrapper);
            }
        }

        this.asText = new XMLSerializer().serializeToString(this.root);

        return this;
    },
    removeViewbox: function removeViewbox() {
        this.root.removeAttribute("viewBox");
        this.root.style.width = this.root.style.height = "100%";
    },
    removeScripts: function removeScripts() {
        var scripts = (0, _utils.toArray)(this.root.getElementsByTagName("script"));
        scripts.forEach(function (script) {
            script.parentNode.removeChild(script);
        });
    },
    disableHyperlinks: function disableHyperlinks() {
        var links = (0, _utils.toArray)(this.root.getElementsByTagName("a"));
        links.forEach(function (link) {
            link.addEventListener("click", function (evt) {
                return evt.preventDefault();
            }, false);
        });
    }
};
