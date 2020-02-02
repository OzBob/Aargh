"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.toArray = toArray;
function toArray(collection) {
    return Array.prototype.slice.call(collection);
}
