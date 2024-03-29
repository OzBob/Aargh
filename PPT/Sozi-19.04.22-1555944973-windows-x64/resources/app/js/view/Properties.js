/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Properties = undefined;

var _infernoHyperscript = require("inferno-hyperscript");

var _VirtualDOMView = require("./VirtualDOMView");

var Properties = exports.Properties = Object.create(_VirtualDOMView.VirtualDOMView);

function asArray(v) {
    return v instanceof Array ? v : [v];
}

Properties.init = function (container, selection, controller, timeline, locale) {
    _VirtualDOMView.VirtualDOMView.init.call(this, container, controller);

    this.selection = selection;
    this.gettext = function (s) {
        return locale.gettext(s);
    };
    this.timeline = timeline;
    this.preferencesMode = false;

    return this;
};

Properties.togglePreferencesMode = function () {
    this.preferencesMode = !this.preferencesMode;
    this.repaint();
};

Properties.render = function () {
    return this.preferencesMode ? this.renderPreferences() : this.renderPresentationProperties();
};

Properties.renderPreferences = function () {
    var _ = this.gettext;
    var c = this.controller;

    var ACTION_LABELS = {
        fitElement: _("Fit to element"),
        resetLayer: _("Reset layer geometry"),
        addFrame: _("Create a new frame"),
        save: _("Save the presentation"),
        redo: _("Redo"),
        undo: _("Undo"),
        focusTitleField: _("Focus the frame title"),
        reload: _("Reload the SVG document"),
        toggleFullscreen: _("Toggle full-screen mode"),
        toggleDevTools: _("Toggle the developer tools")
    };

    var shortcuts = [];
    for (var action in ACTION_LABELS) {
        shortcuts.push((0, _infernoHyperscript.h)("label", { for: "field-" + action }, ACTION_LABELS[action]));
        shortcuts.push(this.renderTextField(action, false, c.getShortcut, c.setShortcut, true));
    }

    return (0, _infernoHyperscript.h)("div.properties", [(0, _infernoHyperscript.h)("h1", _("User interface")), (0, _infernoHyperscript.h)("label", { for: "field-fontSize" }, _("Font size")), this.renderNumberField("fontSize", false, c.getPreference, c.setPreference, false, 1, 1), (0, _infernoHyperscript.h)("label", { for: "field-enableNotifications" }, [_("Enable notifications on save and reload"), this.renderToggleField((0, _infernoHyperscript.h)("i.far.fa-check-square"), _("Enable notifications"), "enableNotifications", c.getPreference, c.setPreference)]), (0, _infernoHyperscript.h)("label", { for: "field-saveMode" }, _("Save the presentation")), this.renderSelectField("saveMode", c.getPreference, c.setPreference, {
        onblur: _("When Sozi loses the focus"),
        manual: _("Manually")
    }), (0, _infernoHyperscript.h)("label", { for: "field-reloadMode" }, _("Reload the SVG document")), this.renderSelectField("reloadMode", c.getPreference, c.setPreference, {
        auto: _("Automatically"),
        onfocus: _("When Sozi gets the focus"),
        manual: _("Manually")
    }), (0, _infernoHyperscript.h)("h1", _("Behavior")), (0, _infernoHyperscript.h)("label", { for: "field-animateTransitions" }, [_("Preview transition animations"), this.renderToggleField((0, _infernoHyperscript.h)("i.far.fa-check-square"), _("Enable animated transitions"), "animateTransitions", c.getPreference, c.setPreference)]), (0, _infernoHyperscript.h)("h1", _("Keyboard shortcuts"))].concat(shortcuts));
};

Properties.renderHelp = function (text, onclick) {
    return (0, _infernoHyperscript.h)("span.help", { title: text, onclick: onclick }, (0, _infernoHyperscript.h)("i.fas.fa-question-circle"));
};

Properties.renderPresentationProperties = function () {
    var _ = this.gettext;
    var c = this.controller;

    var NOTES_HELP = [_("Basic formatting supported:"), "", _("Ctrl+B: Bold"), _("Ctrl+I: Italic"), _("Ctrl+U: Underline"), _("Ctrl+0: Paragraph"), _("Ctrl+1: Big header"), _("Ctrl+2: Medium header"), _("Ctrl+3: Small header"), _("Ctrl+L: List"), _("Ctrl+N: Numbered list")];

    var timeoutMsDisabled = c.getFrameProperty("timeoutEnable").every(function (value) {
        return !value;
    });
    var showInFrameListDisabled = c.getFrameProperty("showInFrameList").every(function (value) {
        return !value;
    });
    var outlineElementIdDisabled = c.getLayerProperty("outlineElementAuto").every(function (value) {
        return value;
    });

    var layersToCopy = {
        __select_a_layer__: _("Select a layer to copy")
    };
    if (this.timeline.hasDefaultLayer) {
        layersToCopy.__default__ = _("Default");
    }
    this.timeline.editableLayers.forEach(function (l) {
        layersToCopy[l.groupId] = l.label;
    });

    return (0, _infernoHyperscript.h)("div.properties", [(0, _infernoHyperscript.h)("h1", _("Frame")), (0, _infernoHyperscript.h)("div.btn-group", [this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-list"), _("Show in frame list"), "showInFrameList", c.getFrameProperty, c.setFrameProperty), this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-hashtag"), _("Show frame number"), "showFrameNumber", c.getFrameProperty, c.setFrameProperty)]), (0, _infernoHyperscript.h)("label", { for: "field-title" }, _("Title")), this.renderTextField("title", false, c.getFrameProperty, c.setFrameProperty, true), (0, _infernoHyperscript.h)("label", { for: "field-titleLevel" }, _("Title level in frame list")), this.renderRangeField("titleLevel", showInFrameListDisabled, c.getFrameProperty, c.setFrameProperty, 0, 4, 1), (0, _infernoHyperscript.h)("label", { for: "field-frameId" }, _("Id")), this.renderTextField("frameId", false, c.getFrameProperty, c.setFrameProperty, false), (0, _infernoHyperscript.h)("label", { for: "field-timeoutMs" }, [_("Timeout (seconds)"), this.renderToggleField((0, _infernoHyperscript.h)("i.far.fa-check-square"), _("Timeout enable"), "timeoutEnable", c.getFrameProperty, c.setFrameProperty)]), this.renderNumberField("timeoutMs", timeoutMsDisabled, c.getFrameProperty, c.setFrameProperty, false, 0.1, 1000), (0, _infernoHyperscript.h)("h1", _("Layer")), (0, _infernoHyperscript.h)("div.btn-group", [this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-link"), _("Link to previous frame"), "link", c.getLayerProperty, c.setLayerProperty), this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-crop"), _("Clip"), "clipped", c.getCameraProperty, c.setCameraProperty), (0, _infernoHyperscript.h)("button", {
        title: _("Reset layer geometry"),
        onclick: function onclick() {
            c.resetLayer();
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-eraser"))]), (0, _infernoHyperscript.h)("label", { for: "field-layerToCopy" }, _("Copy layer")), this.renderSelectField("layerToCopy", function () {
        return "__select_a_layer__";
    }, function (prop, groupId) {
        c.copyLayer(groupId);
        document.getElementById("field-layerToCopy").firstChild.selected = true;
    }, layersToCopy), (0, _infernoHyperscript.h)("label", { for: "field-outlineElementId" }, [_("Outline element Id"), (0, _infernoHyperscript.h)("span.btn-group", [
    // TODO: onclick, update reference element immediately
    this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-magic"), _("Autoselect element"), "outlineElementAuto", c.getLayerProperty, c.setLayerProperty), this.renderToggleField((0, _infernoHyperscript.h)("i.far.fa-eye-slash"), _("Hide element"), "outlineElementHide", c.getLayerProperty, c.setLayerProperty), (0, _infernoHyperscript.h)("button", {
        title: _("Fit to element"),
        disabled: !c.canFitElement(),
        onclick: function onclick() {
            c.fitElement();
        }
    }, (0, _infernoHyperscript.h)("i.fas.fa-arrows-alt"))])]), this.renderTextField("outlineElementId", outlineElementIdDisabled, c.getLayerProperty, c.setLayerProperty, true), (0, _infernoHyperscript.h)("label", { for: "field-opacity" }, _("Layer opacity")), this.renderRangeField("opacity", false, c.getCameraProperty, c.setCameraProperty, 0, 1, 0.1), (0, _infernoHyperscript.h)("h1", [_("Transition"), this.renderHelp(_("Configure the animation when moving to the selected frames."))]), (0, _infernoHyperscript.h)("label", { for: "field-transitionDurationMs" }, _("Duration (seconds)")), this.renderNumberField("transitionDurationMs", false, c.getFrameProperty, c.setFrameProperty, false, 0.1, 1000), (0, _infernoHyperscript.h)("label", { for: "field-transitionTimingFunction" }, _("Timing function")), this.renderSelectField("transitionTimingFunction", c.getLayerProperty, c.setLayerProperty, {
        "linear": _("Linear"),
        "ease": _("Ease"),
        "easeIn": _("Ease in"),
        "easeOut": _("Ease out"),
        "easeInOut": _("Ease in-out"),
        "stepStart": _("Step start"),
        "stepEnd": _("Step end"),
        "stepMiddle": _("Step middle")
    }), (0, _infernoHyperscript.h)("label", { for: "field-transitionRelativeZoom" }, _("Relative zoom (%)")), this.renderNumberField("transitionRelativeZoom", false, c.getLayerProperty, c.setLayerProperty, true, 1, 0.01), (0, _infernoHyperscript.h)("label", { for: "field-transitionPathId" }, [_("Path Id"), this.renderToggleField((0, _infernoHyperscript.h)("i.far.fa-eye-slash"), _("Hide path"), "transitionPathHide", c.getLayerProperty, c.setLayerProperty)]), this.renderTextField("transitionPathId", false, c.getLayerProperty, c.setLayerProperty, true), (0, _infernoHyperscript.h)("h1", [_("Notes"), this.renderHelp(_("Edit presenter notes. Click here to show the list of formatting shortcuts."), function () {
        return c.info(NOTES_HELP.join("\n"), true);
    })]), this.renderRichTextField("notes", false, c.getFrameProperty, c.setFrameProperty, true), (0, _infernoHyperscript.h)("h1", _("Player")), (0, _infernoHyperscript.h)("div", [_("Allow to control the presentation"), (0, _infernoHyperscript.h)("span.btn-group", [this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-mouse-pointer"), _("using the mouse"), "enableMouseNavigation", c.getPresentationProperty, c.setPresentationProperty), this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-keyboard"), _("using the keyboard"), "enableKeyboardNavigation", c.getPresentationProperty, c.setPresentationProperty)])]), (0, _infernoHyperscript.h)("div", [_("Allow to move the camera"), this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-mouse-pointer"), _("using the mouse"), "enableMouseTranslation", c.getPresentationProperty, c.setPresentationProperty)]), (0, _infernoHyperscript.h)("div", [_("Allow to rotate the camera"), (0, _infernoHyperscript.h)("span.btn-group", [this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-mouse-pointer"), _("using the mouse"), "enableMouseRotation", c.getPresentationProperty, c.setPresentationProperty), this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-keyboard"), _("using the keyboard"), "enableKeyboardRotation", c.getPresentationProperty, c.setPresentationProperty)])]), (0, _infernoHyperscript.h)("div", [_("Allow to zoom"), (0, _infernoHyperscript.h)("span.btn-group", [this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-mouse-pointer"), _("using the mouse"), "enableMouseZoom", c.getPresentationProperty, c.setPresentationProperty), this.renderToggleField((0, _infernoHyperscript.h)("i.fas.fa-keyboard"), _("using the keyboard"), "enableKeyboardZoom", c.getPresentationProperty, c.setPresentationProperty)])])]);
};

Properties.renderTextField = function (property, disabled, getter, setter, acceptsEmpty) {
    var c = this.controller;

    var values = asArray(getter.call(c, property));
    var className = values.length > 1 ? "multiple" : undefined;
    this.state[property] = { value: values.length >= 1 ? values[values.length - 1] : "" };

    return (0, _infernoHyperscript.h)("input", {
        id: "field-" + property,
        type: "text",
        className: className,
        disabled: disabled,
        onchange: function onchange() {
            var value = this.value;
            if (acceptsEmpty || value.length) {
                setter.call(c, property, value);
            }
        }
    });
};

Properties.renderRichTextField = function (property, disabled, getter, setter, acceptsEmpty) {
    var c = this.controller;

    var values = asArray(getter.call(c, property));
    var className = values.length > 1 ? "multiple" : undefined;
    this.state[property] = { innerHTML: values.length >= 1 ? values[values.length - 1] : "" };

    return (0, _infernoHyperscript.h)("section", {
        id: "field-" + property,
        contentEditable: true,
        className: className,
        disabled: disabled,
        onblur: function onblur() {
            var value = this.innerHTML;
            if (acceptsEmpty || value.length) {
                setter.call(c, property, value);
            }
        },
        onkeydown: function onkeydown(evt) {
            if (evt.ctrlKey) {
                switch (evt.keyCode) {
                    case 48:
                        // Ctrl+0
                        document.execCommand("formatBlock", false, "<P>");
                        break;
                    case 49:
                        // Ctrl+1
                        document.execCommand("formatBlock", false, "<H1>");
                        break;
                    case 50:
                        // Ctrl+2
                        document.execCommand("formatBlock", false, "<H2>");
                        break;
                    case 51:
                        // Ctrl+3
                        document.execCommand("formatBlock", false, "<H3>");
                        break;
                    case 76:
                        // Ctrl+L
                        document.execCommand("insertUnorderedList", false, null);
                        break;
                    case 78:
                        // Ctrl+N
                        document.execCommand("insertOrderedList", false, null);
                        break;
                    default:
                        return;
                    // Natively supported shortcuts:
                    // Ctrl+B|I|U : Bold, Italic, Underline
                    // Ctrl+A     : Select all
                    // Ctrl+C|X|V : Copy, Cut, Paste
                }
                evt.stopPropagation();
            }
        }
    });
};

Properties.renderNumberField = function (property, disabled, getter, setter, signed, step, factor) {
    var c = this.controller;

    var values = asArray(getter.call(c, property));
    var className = values.length > 1 ? "multiple" : undefined;
    this.state[property] = { value: values.length >= 1 ? values[values.length - 1] / factor : 0 }; // TODO use default value

    return (0, _infernoHyperscript.h)("input", {
        id: "field-" + property,
        type: "number",
        className: className,
        disabled: disabled,
        min: signed ? undefined : 0,
        step: step,
        pattern: "[+-]?\\d+(\\.\\d+)?",
        onchange: function onchange() {
            var value = parseFloat(this.value);
            if (!isNaN(value) && (signed || value >= 0)) {
                setter.call(c, property, value * factor);
            }
        }
    });
};

Properties.renderRangeField = function (property, disabled, getter, setter, min, max, step) {
    var c = this.controller;

    var values = asArray(getter.call(c, property));
    var className = values.length > 1 ? "multiple" : undefined;
    this.state[property] = { value: values.length >= 1 ? values[values.length - 1] : (min + max) / 2 }; // TODO use default value

    return (0, _infernoHyperscript.h)("input", {
        id: "field-" + property,
        type: "range",
        title: this.state[property].value,
        min: min,
        max: max,
        step: step,
        className: className,
        disabled: disabled,
        onchange: function onchange() {
            var value = parseFloat(this.value);
            if (!isNaN(value) && value >= min && value <= max) {
                setter.call(c, property, value);
            }
        }
    });
};

Properties.renderToggleField = function (label, title, property, getter, setter) {
    var c = this.controller;

    var values = asArray(getter.call(c, property));
    var className = values.length > 1 ? "multiple" : "";
    var value = values.length >= 1 ? values[values.length - 1] : false; // TODO use default value
    if (value) {
        className += " active";
    }

    return (0, _infernoHyperscript.h)("button", {
        className: className,
        title: title,
        onclick: function onclick() {
            setter.call(c, property, !value);
        }
    }, label);
};

Properties.renderSelectField = function (property, getter, setter, options) {
    var c = this.controller;

    var values = asArray(getter.call(c, property));
    var className = values.length > 1 ? "multiple" : undefined;
    var value = values.length >= 1 ? values[values.length - 1] : options[0];

    return (0, _infernoHyperscript.h)("select", {
        id: "field-" + property,
        className: className,
        onchange: function onchange() {
            setter.call(c, property, this.value);
        }
    }, Object.keys(options).map(function (optionValue) {
        return (0, _infernoHyperscript.h)("option", {
            value: optionValue,
            selected: value === optionValue
        }, options[optionValue]);
    }));
};
