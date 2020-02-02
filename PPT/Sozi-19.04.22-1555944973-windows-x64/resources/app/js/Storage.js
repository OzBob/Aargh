/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Storage = undefined;

var _AbstractBackend = require("./backend/AbstractBackend");

var _events = require("events");

var _nunjucks = require("nunjucks");

var _nunjucks2 = _interopRequireDefault(_nunjucks);

var _jed = require("jed");

var _jed2 = _interopRequireDefault(_jed);

var _upgrade = require("./upgrade");

var _utils = require("./utils");

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Storage = exports.Storage = Object.create(_events.EventEmitter.prototype);

Storage.init = function (controller, svgDocument, presentation, selection, timeline, locale) {
    var _this = this;

    _events.EventEmitter.call(this);

    this.controller = controller;
    this.document = svgDocument;
    this.presentation = presentation;
    this.selection = selection;
    this.timeline = timeline;
    this.backend = _AbstractBackend.backendList[0];
    this.svgFileDescriptor = null;
    this.jsonNeedsSaving = false;
    this.htmlNeedsSaving = false;
    this.reloading = false;
    this.gettext = function (s) {
        return locale.gettext(s);
    };

    // Adjust the template path depending on the target platform.
    // In the web browser, __dirname is set to "/js". The leading "/" will result
    // in an incorrect URL if the app is not hosted at the root of its domain.
    var templatePath = __dirname === "/js" ? "templates" : _path2.default.join(__dirname, "..", "templates");

    _nunjucks2.default.configure(templatePath, {
        watch: false,
        autoescape: false
    });

    controller.addListener("presentationChange", function () {
        _this.jsonNeedsSaving = _this.htmlNeedsSaving = true;
    });

    controller.addListener("editorStateChange", function () {
        _this.jsonNeedsSaving = true;
    });

    _AbstractBackend.backendList.forEach(function (backend) {
        var listItem = document.createElement("li");
        document.querySelector("#sozi-editor-view-preview ul").appendChild(listItem);
        backend.init(controller, listItem, _this.gettext).addListener("load", function () {
            for (var _len = arguments.length, a = Array(_len), _key = 0; _key < _len; _key++) {
                a[_key] = arguments[_key];
            }

            return _this.onBackendLoad.apply(_this, [backend].concat(a));
        }).addListener("change", function () {
            return _this.onBackendChange.apply(_this, arguments);
        });
    });

    return this;
};

Storage.save = function () {
    this.backend.doAutosave();
};

Storage.reload = function () {
    this.save();
    this.backend.load(this.svgFileDescriptor);
};

Storage.onBackendLoad = function (backend, fileDescriptor, data, err) {
    var _this2 = this;

    var _ = this.gettext;
    this.backend = backend;

    var name = backend.getName(fileDescriptor);
    var location = backend.getLocation(fileDescriptor);

    if (err) {
        this.controller.error(_jed2.default.sprintf(_("File %s could not be loaded."), name));
    } else if (/\.svg$/.test(name)) {
        this.reloading = fileDescriptor === this.svgFileDescriptor;
        this.document.initFromString(data);
        if (this.document.isValidSVG) {
            this.resolveRelativeURLs(location);
            this.controller.setSVGDocument(this.document);
            this.svgFileDescriptor = fileDescriptor;
            this.controller.once("ready", function () {
                var htmlFileName = name.replace(/\.svg$/, ".sozi.html");
                _this2.createHTMLFile(htmlFileName, location);
                _this2.createPresenterHTMLFile(name.replace(/\.svg$/, "-presenter.sozi.html"), location, htmlFileName);
            });
            this.openJSONFile(name.replace(/\.svg$/, ".sozi.json"), location);
        } else {
            this.controller.error(_("Document is not valid SVG."));
        }
    } else if (/\.sozi\.json$/.test(name)) {
        // Load presentation data and editor state from JSON file.
        this.loadJSONData(data);
        this.autosaveJSON(fileDescriptor);
    } else {
        this.controller.error(_("Document is not valid SVG."));
    }
};

/*
 * Fix the href attribute of linked images when the given URL is relative.
 *
 * In linked images, the href attribute can be either an absolute URL
 * or a path relative to the location of the SVG file.
 * But in the presentation editor, URLs are relative to the location of
 * the index.html file of the application.
 * For this reason, we modify image URLs by prefixing all relative URLs
 * with the actual location of the SVG file.
 */
Storage.resolveRelativeURLs = function (location) {
    var XLINK_NS = "http://www.w3.org/1999/xlink";
    var xlinkNsAttrs = (0, _utils.toArray)(this.document.root.attributes).filter(function (a) {
        return a.value === XLINK_NS;
    });
    if (!xlinkNsAttrs.length) {
        return;
    }
    var xlinkPrefix = xlinkNsAttrs[0].name.replace(/^xmlns:/, "") + ":";

    var images = (0, _utils.toArray)(this.document.root.getElementsByTagName("image"));
    images.forEach(function (img) {
        var href = img.getAttribute(xlinkPrefix + "href");
        if (!/^[a-z]+:|^[/#]/.test(href)) {
            img.setAttribute(xlinkPrefix + "href", location + "/" + href);
        }
    });
};

Storage.onBackendChange = function (fileDescriptor) {
    var _this3 = this;

    var _ = this.gettext;

    if (fileDescriptor === this.svgFileDescriptor) {
        switch (this.controller.getPreference("reloadMode")) {
            case "auto":
                this.controller.info(_("Document was changed. Reloading."));
                this.reload();
                break;

            case "onfocus":
                if (this.backend.hasFocus) {
                    this.controller.info(_("Document was changed. Reloading."));
                    this.reload();
                } else {
                    this.backend.once("focus", function () {
                        return _this3.reload();
                    });
                }
                break;

            default:
                this.controller.info(_("Document was changed."));
        }
    }
};

/*
 * Open the JSON file with the given name at the given location.
 * If the file exists, load it.
 * It it does not exist, create it.
 */
Storage.openJSONFile = function (name, location) {
    var _this4 = this;

    var _ = this.gettext;

    this.backend.find(name, location, function (fileDescriptor) {
        if (fileDescriptor) {
            _this4.backend.load(fileDescriptor);
        } else {
            // If no JSON file is available, attempt to extract
            // presentation data from the SVG document, assuming
            // it has been generated from Sozi 13 or earlier.
            // Then save the extracted data to a JSON file.
            (0, _upgrade.upgradeFromSVG)(_this4.presentation, _this4.timeline);

            // Select the first frame
            if (_this4.presentation.frames.length) {
                _this4.controller.info(_("Document was imported from Sozi 13 or earlier."));
            }

            _this4.backend.create(name, location, "application/json", _this4.getJSONData(), function (fileDescriptor) {
                _this4.autosaveJSON(fileDescriptor);
            });

            _this4.controller.onLoad();
        }
    });
};

/*
 * Create the exported HTML file if it does not exist.
 */
Storage.createHTMLFile = function (name, location) {
    var _this5 = this;

    this.backend.find(name, location, function (fileDescriptor) {
        if (fileDescriptor) {
            _this5.autosaveHTML(fileDescriptor);
            _this5.backend.save(fileDescriptor, _this5.exportHTML());
        } else {
            _this5.backend.create(name, location, "text/html", _this5.exportHTML(), function (fileDescriptor) {
                _this5.autosaveHTML(fileDescriptor);
            });
        }
    });
};

/*
 * Create the presenter HTML file if it does not exist.
 */
Storage.createPresenterHTMLFile = function (name, location, htmlFileName) {
    var _this6 = this;

    this.backend.find(name, location, function (fileDescriptor) {
        if (fileDescriptor) {
            _this6.backend.save(fileDescriptor, _this6.exportPresenterHTML(htmlFileName));
        } else {
            _this6.backend.create(name, location, "text/html", _this6.exportPresenterHTML(htmlFileName));
        }
    });
};

/*
 * Load the presentation and set the initial state
 * of the editor using the given JSON data.
 */
Storage.loadJSONData = function (data) {
    var storable = JSON.parse(data);
    (0, _upgrade.upgradeFromStorable)(storable);
    this.presentation.fromStorable(storable);
    this.timeline.fromStorable(storable);
    this.selection.fromStorable(storable);
    this.controller.onLoad();
};

/*
 * Configure autosaving for presentation data
 * and editor state.
 */
Storage.autosaveJSON = function (fileDescriptor) {
    var _this7 = this;

    if (this.reloading) {
        return;
    }

    this.backend.autosave(fileDescriptor, function () {
        return _this7.jsonNeedsSaving;
    }, function () {
        return _this7.getJSONData();
    });

    var _ = this.gettext;

    this.backend.addListener("save", function (savedFileDescriptor) {
        if (fileDescriptor === savedFileDescriptor) {
            _this7.jsonNeedsSaving = false;
            _this7.controller.info(_jed2.default.sprintf(_("Saved %s."), _this7.backend.getName(fileDescriptor)));
        }
    });
};

/*
 * Configure autosaving for HTML export.
 */
Storage.autosaveHTML = function (fileDescriptor) {
    var _this8 = this;

    if (this.reloading) {
        return;
    }

    this.backend.autosave(fileDescriptor, function () {
        return _this8.htmlNeedsSaving;
    }, function () {
        return _this8.exportHTML();
    });

    var _ = this.gettext;

    this.backend.addListener("save", function (savedFileDescriptor) {
        if (fileDescriptor === savedFileDescriptor) {
            _this8.htmlNeedsSaving = false;
            _this8.controller.emit("repaint"); // TODO move this to controller
            _this8.controller.info(_jed2.default.sprintf(_("Saved %s."), _this8.backend.getName(fileDescriptor)));
        }
    });
};

/*
 * Extract the data to save from the current presentation
 * and the current editor state.
 * Return it as a JSON string.
 */
Storage.getJSONData = function () {
    var storable = {};
    [this.presentation, this.selection, this.timeline].forEach(function (object) {
        var partial = object.toStorable();
        for (var key in partial) {
            storable[key] = partial[key];
        }
    });
    return JSON.stringify(storable, null, "  ");
};

/*
 * Generate the content of the exported HTML file.
 */
Storage.exportHTML = function () {
    return _nunjucks2.default.render("player.html", {
        svg: this.document.asText,
        pres: this.presentation,
        json: JSON.stringify(this.presentation.toMinimalStorable())
    });
};

/*
 * Generate the content of the presenter HTML file.
 */
Storage.exportPresenterHTML = function (htmlFileName) {
    return _nunjucks2.default.render("presenter.html", {
        pres: this.presentation,
        soziHtml: htmlFileName
    });
};
