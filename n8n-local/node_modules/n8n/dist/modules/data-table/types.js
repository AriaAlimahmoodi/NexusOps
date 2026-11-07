"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasStringProperty = hasStringProperty;
function hasStringProperty(obj, key) {
    return typeof obj === 'object' && obj !== null && key in obj;
}
//# sourceMappingURL=types.js.map