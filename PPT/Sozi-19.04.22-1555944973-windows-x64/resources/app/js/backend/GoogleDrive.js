/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GoogleDrive = undefined;

var _AbstractBackend = require("./AbstractBackend");

var GoogleDrive = exports.GoogleDrive = Object.create(_AbstractBackend.AbstractBackend);

// Configure these settings in GoogleDrive.config.js
GoogleDrive.clientId = "Your OAuth client Id";
GoogleDrive.apiKey = "Your developer API key";

GoogleDrive.init = function (controller, container, _) {
    var _this = this;

    _AbstractBackend.AbstractBackend.init.call(this, controller, container, "sozi-editor-backend-GoogleDrive-input", _("Open an SVG file from Google Drive"));

    // Save automatically when the window loses focus
    this.addListener("blur", function () {
        return _this.doAutosave();
    });

    this.clickToAuth = function () {
        return _this.authorize(false);
    };

    gapi.client.setApiKey(this.apiKey);
    this.authorize(true);
    return this;
};

GoogleDrive.openFileChooser = function () {
    this.picker.setVisible(true);
};

GoogleDrive.authorize = function (onInit) {
    var _this2 = this;

    gapi.auth.authorize({
        client_id: this.clientId,
        scope: "https://www.googleapis.com/auth/drive",
        immediate: onInit
    }, function (authResult) {
        return _this2.onAuthResult(onInit, authResult);
    });
};

GoogleDrive.onAuthResult = function (onInit, authResult) {
    var _this3 = this;

    var inputButton = document.getElementById("sozi-editor-backend-GoogleDrive-input");

    if (authResult && !authResult.error) {
        this.accessToken = authResult.access_token;
        // Access granted: create a file picker and show the "Load" button.
        gapi.client.load("drive", "v2");
        gapi.load("picker", {
            callback: function callback() {
                _this3.createPicker();
                inputButton.removeEventListener("click", _this3.clickToAuth);
                inputButton.addEventListener("click", function () {
                    return _this3.openFileChooser();
                });
                if (!onInit) {
                    _this3.openFileChooser();
                }
            }
        });
    } else {
        // No access token could be retrieved, show the button to start the authorization flow.
        inputButton.addEventListener("click", this.clickToAuth);
    }
};

GoogleDrive.createPicker = function () {
    var _this4 = this;

    var view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes("image/svg+xml");

    this.picker = new google.picker.PickerBuilder().addView(view).setOAuthToken(this.accessToken).setCallback(function (data) {
        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            gapi.client.drive.files.get({ fileId: data.docs[0].id }).execute(function (response) {
                if (!response.error) {
                    _this4.load(response);
                } else {
                    console.log(response.error.message);
                }
            });
        }
    }).build();
};

GoogleDrive.getName = function (fileDescriptor) {
    return fileDescriptor.title;
};

GoogleDrive.getLocation = function (fileDescriptor) {
    return fileDescriptor.parents;
};

GoogleDrive.find = function (name, location, callback) {
    function findInParent(index) {
        gapi.client.drive.files.list({
            q: "title = '" + name + "' and " + "'" + location[index].id + "' in parents"
        }).execute(function (response) {
            if (response.items && response.items.length) {
                callback(response.items[0]);
            } else if (index < location.length - 1) {
                findInParent(index + 1);
            } else {
                callback(null);
            }
        });
    }
    findInParent(0);
};

// TODO implement the "change" event
GoogleDrive.load = function (fileDescriptor) {
    var _this5 = this;

    // The file is loaded using an AJAX GET operation.
    // The data type is forced to "text" to prevent parsing it.
    // Emit the "load" event with the file content in case of success,
    // or with the error status in case of failure.
    var xhr = new XMLHttpRequest();
    xhr.open("GET", fileDescriptor.downloadUrl);
    xhr.setRequestHeader("Content-Type", fileDescriptor.mimeType);
    xhr.setRequestHeader("Authorization", "Bearer " + this.accessToken);
    xhr.addEventListener("readystatechange", function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                _this5.emit("load", fileDescriptor, xhr.responseText);
            } else {
                _this5.emit("load", fileDescriptor, null, xhr.status);
            }
        }
    });
    xhr.send();
};

GoogleDrive.create = function (name, location, mimeType, data, callback) {
    var boundary = "-------314159265358979323846";
    var delimiter = "\r\n--" + boundary + "\r\n";
    var closeDelimiter = "\r\n--" + boundary + "--";

    var metadata = {
        title: name,
        parents: location,
        mimeType: mimeType
    };

    var multipartRequestBody = delimiter + "Content-Type: application/json\r\n\r\n" + JSON.stringify(metadata) + delimiter + "Content-Type: " + mimeType + "\r\n" + "Content-Transfer-Encoding: base64\r\n\r\n" + toBase64(data) + // Force UTF-8 encoding
    closeDelimiter;

    gapi.client.request({
        path: "/upload/drive/v2/files",
        method: "POST",
        params: {
            uploadType: "multipart"
        },
        headers: {
            "Content-Type": 'multipart/mixed; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
    }).execute(function (response) {
        if (!response.error) {
            callback(response);
        } else {
            callback(response, response.error.message);
        }
    });
};

GoogleDrive.save = function (fileDescriptor, data) {
    var _this6 = this;

    var base64Data = toBase64(data); // Force UTF-8 encoding
    gapi.client.request({
        path: "/upload/drive/v2/files/" + fileDescriptor.id,
        method: "PUT",
        params: {
            uploadType: "media"
        },
        headers: {
            "Content-Type": fileDescriptor.mimeType,
            "Content-Length": base64Data.length,
            "Content-Encoding": "base64"
        },
        body: base64Data
    }).execute(function (response) {
        _this6.emit("save", fileDescriptor, response.error);
    });
};

function toBase64(data) {
    return btoa(unescape(encodeURIComponent(data)));
}

(0, _AbstractBackend.addBackend)(GoogleDrive);
