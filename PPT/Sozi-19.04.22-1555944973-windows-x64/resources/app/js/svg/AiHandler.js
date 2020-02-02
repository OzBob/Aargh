/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var _utils = require("../utils");

var _SVGDocumentWrapper = require("./SVGDocumentWrapper");

var AiHandler = Object.create(_SVGDocumentWrapper.DefaultHandler);

AiHandler.matches = function (svgRoot) {
    return (/^http:\/\/ns.adobe.com\/AdobeIllustrator/.test(svgRoot.getAttribute("xmlns:i")) && (0, _utils.toArray)(svgRoot.childNodes).some(function (svgNode) {
            return svgNode instanceof SVGSwitchElement;
        })
    );
};

AiHandler.transform = function (svgRoot) {
    (0, _utils.toArray)(svgRoot.getElementsByTagName("switch")).forEach(function (svgSwitch) {
        // Remove first foreignObject child node
        var svgForeignObject = svgSwitch.firstElementChild;
        if (svgForeignObject && svgForeignObject instanceof SVGForeignObjectElement && svgForeignObject.hasAttribute("requiredExtensions") && svgForeignObject.getAttribute("requiredExtensions").startsWith("http://ns.adobe.com/AdobeIllustrator")) {
            // Remove foreign objet element
            svgSwitch.removeChild(svgForeignObject);

            // Unwrap main group
            var svgGroup = svgSwitch.firstElementChild;
            if (!svgGroup || svgGroup instanceof SVGGElement || svgGroup.getAttribute("i:extraneous") !== "self") {
                svgGroup = svgSwitch;
            }
            (0, _utils.toArray)(svgGroup.childNodes).forEach(function (childNode) {
                svgSwitch.parentNode.insertBefore(childNode, svgSwitch);
            });

            // Remove switch element
            svgSwitch.parentNode.removeChild(svgSwitch);
        }
    });
    return this;
};

AiHandler.isLayer = function (svgElement) {
    return svgElement.getAttribute("i:layer") === "yes";
};

(0, _SVGDocumentWrapper.registerHandler)("Adobe Illustrator", AiHandler);
