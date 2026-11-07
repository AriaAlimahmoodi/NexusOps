"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlainObject = isPlainObject;
exports.getProperty = getProperty;
exports.hasProperty = hasProperty;
function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function getProperty(value, key) {
    if (!isPlainObject(value)) {
        return undefined;
    }
    return value[key];
}
function hasProperty(value, key) {
    if (!isPlainObject(value)) {
        return false;
    }
    return key in value;
}
//# sourceMappingURL=safe-access.js.map