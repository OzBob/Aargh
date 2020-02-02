/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _SVGDocumentWrapper = require("./SVGDocumentWrapper");

// Constant: the Inkscape namespace
var INKSCAPE_NS = "http://www.inkscape.org/namespaces/inkscape";
var SODIPODI_NS = "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd";

var InkscapeHandler = Object.create(_SVGDocumentWrapper.DefaultHandler);

InkscapeHandler.matches = function (svgRoot) {
    return svgRoot.getAttribute("xmlns:inkscape") === INKSCAPE_NS;
};

InkscapeHandler.transform = function (svgRoot) {
    var pageColor = "#ffffff";
    var pageOpacity = "0";

    // Get page color and opacity from Inkscape document properties
    var namedViews = svgRoot.getElementsByTagNameNS(SODIPODI_NS, "namedview");
    for (var i = 0; i < namedViews.length; i++) {
        if (namedViews[i].hasAttribute("pagecolor")) {
            pageColor = namedViews[i].getAttribute("pagecolor");
            if (namedViews[i].hasAttributeNS(INKSCAPE_NS, "pageopacity")) {
                pageOpacity = namedViews[i].getAttributeNS(INKSCAPE_NS, "pageopacity");
            }
            break;
        }
    }

    // Extract RGB assuming page color is in 6-digit hex format

    var _$exec = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(pageColor),
        _$exec2 = _slicedToArray(_$exec, 4),
        red = _$exec2[1],
        green = _$exec2[2],
        blue = _$exec2[3];

    var style = document.createElement("style");
    style.innerHTML = "svg {\n        background: rgba(" + parseInt(red, 16) + ", " + parseInt(green, 16) + ", " + parseInt(blue, 16) + ", " + pageOpacity + ");\n    }";
    svgRoot.insertBefore(style, svgRoot.firstChild);
};

InkscapeHandler.isLayer = function (svgElement) {
    return svgElement.getAttribute("inkscape:groupmode") === "layer";
};

InkscapeHandler.getLabel = function (svgElement) {
    return svgElement.getAttribute("inkscape:label");
};

(0, _SVGDocumentWrapper.registerHandler)("Inkscape", InkscapeHandler);
