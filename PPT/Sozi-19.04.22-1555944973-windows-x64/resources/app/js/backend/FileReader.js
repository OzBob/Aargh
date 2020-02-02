/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FileReaderBackend = undefined;

var _AbstractBackend = require("./AbstractBackend");

var FileReaderBackend = exports.FileReaderBackend = Object.create(_AbstractBackend.AbstractBackend);

FileReaderBackend.init = function (controller, container, _) {
    var _this = this;

    _AbstractBackend.AbstractBackend.init.call(this, controller, container, "sozi-editor-backend-FileReader-input", _('Open an SVG file from your computer (<i class="fas fa-exclamation-triangle"></i> read-only)'));

    document.getElementById("sozi-editor-backend-FileReader-input").addEventListener("click", function () {
        return _this.openFileChooser();
    });

    this.fileInput = document.createElement("input");
    this.fileInput.style.display = "none";
    this.fileInput.setAttribute("type", "file");
    this.fileInput.setAttribute("accept", "image/svg+xml");
    container.appendChild(this.fileInput);

    // Load the SVG document selected in the file input
    this.fileInput.addEventListener("change", function (evt) {
        if (evt.target.files.length) {
            _this.load(evt.target.files[0]);
        }
    });

    return this;
};

FileReaderBackend.openFileChooser = function () {
    this.fileInput.dispatchEvent(new MouseEvent("click"));
};

FileReaderBackend.getName = function (fileDescriptor) {
    return fileDescriptor.name;
};

FileReaderBackend.load = function (fileDescriptor) {
    var _this2 = this;

    var reader = new FileReader();
    reader.readAsText(fileDescriptor, "utf8");
    reader.onload = function () {
        _this2.emit("load", fileDescriptor, reader.result, reader.error && reader.error.name);
    };
};

(0, _AbstractBackend.addBackend)(FileReaderBackend);
