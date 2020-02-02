/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = init;

var _jed = require("jed");

var _jed2 = _interopRequireDefault(_jed);

var _locales = require("./locales");

var _locales2 = _interopRequireDefault(_locales);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Convert a language tag to a dash-separated lowercase string
function normalize(tag) {
    return tag.replace(/_/g, "-").toLowerCase();
}

function init(lang) {
    if (!lang) {
        lang = window.navigator.languages && window.navigator.languages.length ? window.navigator.languages[0] : window.navigator.language || window.navigator.userLanguage || "en";
    }

    // Normalize the given language tag and extract the language code alone
    lang = normalize(lang);
    var langShort = lang.split("-")[0];

    // Find the user language in the available locales
    var allLanguages = Object.keys(_locales2.default).map(normalize);
    var langIndex = allLanguages.indexOf(lang);
    if (langIndex < 0) {
        langIndex = allLanguages.indexOf(langShort);
    }

    var localeData = langIndex >= 0 ? _locales2.default[Object.keys(_locales2.default)[langIndex]] : {};

    return new _jed2.default(localeData);
}
