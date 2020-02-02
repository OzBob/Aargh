/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Electron = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _AbstractBackend = require("./AbstractBackend");

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _process = require("process");

var _process2 = _interopRequireDefault(_process);

var _jed = require("jed");

var _jed2 = _interopRequireDefault(_jed);

var _screenfull = require("screenfull");

var _screenfull2 = _interopRequireDefault(_screenfull);

var _electron = require("electron");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var browserWindow = _electron.remote.getCurrentWindow();

// Get the current working directory.
// We use the PWD environment variable directly because
// process.cwd() returns the installation path of Sozi.
var cwd = _process2.default.env.PWD;

console.log("Current working dir: " + cwd);

var Electron = exports.Electron = Object.create(_AbstractBackend.AbstractBackend);

Electron.init = function (controller, container, _) {
    var _this = this;

    _AbstractBackend.AbstractBackend.init.call(this, controller, container, "sozi-editor-backend-Electron-input", _("Open an SVG file from your computer"));

    this.loadConfiguration();

    document.getElementById("sozi-editor-backend-Electron-input").addEventListener("click", function () {
        return _this.openFileChooser(_);
    });

    // Save automatically when the window loses focus
    var onBlur = function onBlur() {
        if (_this.controller.getPreference("saveMode") === "onblur") {
            _this.doAutosave();
        }
    };
    this.addListener("blur", onBlur);

    // Save files when closing the window
    var closing = false;

    window.addEventListener("beforeunload", function (evt) {
        // Workaround for a bug in Electron where the window closes after a few
        // seconds even when calling dialog.showMessageBox() synchronously.
        if (closing) {
            return;
        }
        closing = true;
        evt.returnValue = false;

        _this.removeListener("blur", onBlur);

        if (_this.controller.getPreference("saveMode") === "onblur") {
            window.setTimeout(function () {
                return _this.quit(true);
            });
        } else if (_this.hasOutdatedFiles()) {
            // If autosave is disabled and some files are outdated,
            // ask user confirmation.
            _electron.remote.dialog.showMessageBox(browserWindow, {
                type: "question",
                message: _("Do you want to save the presentation before closing?"),
                buttons: [_("Yes"), _("No")],
                defaultId: 0,
                cancelId: 1
            }, function (index) {
                return _this.quit(index === 0);
            });
        }
    });

    this.watchers = {};

    // If a file name was provided on the command line,
    // check that the file exists and load it.
    // Open a file chooser if no file name was provided or
    // the file does not exist.
    if (_electron.remote.process.argv.length > 1) {
        var fileName = _path2.default.resolve(cwd, _electron.remote.process.argv[1]);
        try {
            _fs2.default.accessSync(fileName);
            this.load(fileName);
        } catch (err) {
            this.controller.error(_jed2.default.sprintf(_("File not found: %s."), fileName));
            // Force the error notification to appear before the file chooser.
            setTimeout(function () {
                return _this.openFileChooser(_);
            }, 100);
        }
    } else {
        this.openFileChooser(_);
    }

    return this;
};

Electron.quit = function (confirmSave) {
    var _this2 = this;

    // Always save the window settings and the preferences.
    this.saveConfiguration();
    this.savePreferences();

    if (confirmSave && this.hasOutdatedFiles()) {
        // Close the window only when all files have been saved.
        this.addListener("save", function () {
            if (!_this2.hasOutdatedFiles()) {
                browserWindow.close();
            }
        });
        this.saveOutdatedFiles();
    } else {
        browserWindow.close();
    }
};

Electron.openFileChooser = function (_) {
    var files = _electron.remote.dialog.showOpenDialog({
        title: _("Choose an SVG file"),
        filters: [{ name: _("SVG files"), extensions: ["svg"] }],
        properties: ["openFile"]
    });
    if (files) {
        this.load(files[0]);
    }
};

Electron.getName = function (fileDescriptor) {
    return _path2.default.basename(fileDescriptor);
};

Electron.getLocation = function (fileDescriptor) {
    return _path2.default.dirname(fileDescriptor);
};

Electron.find = function (name, location, callback) {
    var fileName = _path2.default.join(location, name);
    _fs2.default.access(fileName, function (err) {
        return callback(err ? null : fileName);
    });
};

Electron.load = function (fileDescriptor) {
    var _this3 = this;

    // Read file asynchronously and fire the "load" event.
    _fs2.default.readFile(fileDescriptor, { encoding: "utf8" }, function (err, data) {
        if (!err) {
            // Watch for changes in the loaded file and fire the "change" event.
            // The "change" event is fired only once if the file is modified
            // after being loaded. It will not be fired again until the file is
            // loaded again.
            // This includes a debouncing mechanism to ensure the file is in a stable
            // state when the "change" event is fired: the event is fired only if the
            // file has not changed for 100 ms.
            if (!(fileDescriptor in _this3.watchers)) {
                var watcher = _this3.watchers[fileDescriptor] = _fs2.default.watch(fileDescriptor);
                var timer = void 0;
                watcher.on("change", function () {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    timer = setTimeout(function () {
                        timer = 0;
                        _this3.emit("change", fileDescriptor);
                    }, 100);
                });
            }
        }
        _this3.emit("load", fileDescriptor, data, err);
    });
};

Electron.create = function (name, location, mimeType, data) {
    var callback = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : function () {};

    var fileName = _path2.default.join(location, name);
    _fs2.default.writeFile(fileName, data, { encoding: "utf-8" }, function (err) {
        return callback(fileName, err);
    });
};

Electron.save = function (fileDescriptor, data) {
    var _this4 = this;

    _fs2.default.writeFile(fileDescriptor, data, { encoding: "utf-8" }, function (err) {
        return _this4.emit("save", fileDescriptor, err);
    });
};

Electron.loadConfiguration = function () {
    function getItem(key, val) {
        var result = localStorage.getItem(key);
        return result !== null ? JSON.parse(result) : val;
    }

    var _browserWindow$getPos = browserWindow.getPosition(),
        _browserWindow$getPos2 = _slicedToArray(_browserWindow$getPos, 2),
        x = _browserWindow$getPos2[0],
        y = _browserWindow$getPos2[1];

    var _browserWindow$getSiz = browserWindow.getSize(),
        _browserWindow$getSiz2 = _slicedToArray(_browserWindow$getSiz, 2),
        w = _browserWindow$getSiz2[0],
        h = _browserWindow$getSiz2[1];

    browserWindow.setPosition(getItem("windowX", x), getItem("windowY", y));
    browserWindow.setSize(getItem("windowWidth", w), getItem("windowHeight", h));
    if (getItem("windowFullscreen", false)) {
        _screenfull2.default.request(document.documentElement);
    }
};

Electron.saveConfiguration = function () {
    var _browserWindow$getPos3 = browserWindow.getPosition();

    var _browserWindow$getPos4 = _slicedToArray(_browserWindow$getPos3, 2);

    localStorage.windowX = _browserWindow$getPos4[0];
    localStorage.windowY = _browserWindow$getPos4[1];

    var _browserWindow$getSiz3 = browserWindow.getSize();

    var _browserWindow$getSiz4 = _slicedToArray(_browserWindow$getSiz3, 2);

    localStorage.windowWidth = _browserWindow$getSiz4[0];
    localStorage.windowHeight = _browserWindow$getSiz4[1];

    localStorage.windowFullscreen = _screenfull2.default.isFullscreen;
};

Electron.toggleDevTools = function () {
    browserWindow.toggleDevTools();
};

(0, _AbstractBackend.addBackend)(Electron);
