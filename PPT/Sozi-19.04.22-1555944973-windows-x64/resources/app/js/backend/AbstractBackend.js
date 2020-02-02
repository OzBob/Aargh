/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AbstractBackend = exports.backendList = undefined;
exports.addBackend = addBackend;

var _events = require("events");

var backendList = exports.backendList = [];

function addBackend(backend) {
    backendList.push(backend);
}

var AbstractBackend = exports.AbstractBackend = Object.create(_events.EventEmitter.prototype);

AbstractBackend.init = function (controller, container, buttonId, buttonLabel) {
    var _this = this;

    this.controller = controller;

    _events.EventEmitter.call(this);
    this.autosavedFiles = [];
    container.innerHTML = "<button id=\"" + buttonId + "\">" + buttonLabel + "</button>";

    this.hasFocus = false;
    window.addEventListener("focus", function () {
        _this.hasFocus = true;
        _this.emit("focus");
    });
    window.addEventListener("blur", function () {
        _this.hasFocus = false;
        _this.emit("blur");
    });
    return this;
};

AbstractBackend.openFileChooser = function () {
    // Not implemented
    return this;
};

/*
 * Return the base name of the file
 * represented by the given descriptor.
 *
 * Parameters:
 *  - fileDescriptor (backend-dependent)
 *
 * Returns:
 *  - The file name (string)
 */
AbstractBackend.getName = function (fileDescriptor) {
    // Not implemented
    return "";
};

/*
 * Return the location of the file
 * represented by the given descriptor.
 *
 * Parameters:
 *  - fileDescriptor (backend-dependent)
 *
 * Returns:
 *  - The file location (backend-dependent)
 */
AbstractBackend.getLocation = function (fileDescriptor) {
    // Not implemented
    return null;
};

/*
 * Find a file.
 *
 * Parameters
 *  - name (string) The base name of the file
 *  - location (backend-dependent)
 *  - callback (function) The function to call when the operation completes
 *
 * The callback function accepts the following parameters:
 *  - fileDescriptor (backend-dependent), null if no file was found
 */
AbstractBackend.find = function (name, location, callback) {
    // Not implemented
    callback(null);
};

/*
 * Load a file.
 *
 * This method loads a file and fires the "load" event. This event
 * must be fired even if loading failed.
 *
 * If the file was successfully loaded and if the backend supports it,
 * a "change" event can be fired when the file is modified after being
 * loaded. The "change" event must be fired only on the first modification
 * after the file has been loaded.
 *
 * Parameters
 *  - fileDescriptor (backend-dependent)
 *
 * Events
 *  - load(fileDescriptor, data, err)
 *  - change(fileDescriptor)
 */
AbstractBackend.load = function (fileDescriptor) {
    // Not implemented
    this.emit("load", fileDescriptor, "", "Not implemented");
};

/*
 * Create a new file.
 *
 * Parameters:
 *  - name (string)
 *  - location (backend-dependent)
 *  - mimeType (string)
 *  - data (string)
 *  - callback (function) The function to call when the operation completes
 *
 * The callback function accepts the following parameters:
 *  - fileDescriptor (backend-dependent)
 *  - err (string)
 */
AbstractBackend.create = function (name, location, mimeType, data, callback) {
    // Not implemented
    callback(null, "Not implemented");
};

/*
 * Save data to an existing file.
 *
 * Parameters:
 *  - fileDescriptor (backend-dependent)
 *  - data (string)
 *
 * Events:
 *  - save(fileDescriptor, err)
 *
 * TODO use a callback instead of an event
 */
AbstractBackend.save = function (fileDescriptor, data) {
    // Not implemented
    this.emit("save", fileDescriptor, "Not implemented");
};

/*
 * Add the given file to the list of files to save automatically.
 *
 * Parameters:
 *  - descriptor (backend-dependent)
 *  - needsSaving (function) A function that returns true if the file needs saving
 *  - getData (function) A function that returns the data to save.
 */
AbstractBackend.autosave = function (descriptor, needsSaving, getData) {
    this.autosavedFiles.push({ descriptor: descriptor, needsSaving: needsSaving, getData: getData });
};

/*
 * Check whether at least one file needs saving.
 */
AbstractBackend.hasOutdatedFiles = function () {
    return this.autosavedFiles.some(function (file) {
        return file.needsSaving();
    });
};

/*
 * Save all outdated files.
 */
AbstractBackend.saveOutdatedFiles = function () {
    var _this2 = this;

    this.autosavedFiles.forEach(function (file) {
        if (file.needsSaving()) {
            _this2.save(file.descriptor, file.getData());
        }
    });
};

/*
 * Save all files previously added to the list of files to save automatically.
 *
 * Typically, we want to call this method each time the editor loses focus
 * and when the editor closes.
 */
AbstractBackend.doAutosave = function () {
    this.savePreferences();
    this.saveOutdatedFiles();
};

AbstractBackend.toggleDevTools = function () {
    // Not implemented
};

AbstractBackend.loadPreferences = function (prefs) {
    this.preferences = prefs;
    Object.keys(prefs).forEach(function (key) {
        var value = localStorage.getItem(key);
        if (value !== null) {
            prefs[key] = JSON.parse(value);
        }
    });
};

AbstractBackend.savePreferences = function () {
    var _this3 = this;

    if (this.preferences) {
        Object.keys(this.preferences).forEach(function (key) {
            localStorage.setItem(key, JSON.stringify(_this3.preferences[key]));
        });
    }
};
