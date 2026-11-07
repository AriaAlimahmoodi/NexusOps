"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEndNodeError = isEndNodeError;
function isEndNodeError(error) {
    if (typeof error !== 'object' || error === null)
        return false;
    const record = error;
    if (typeof record.message !== 'string')
        return false;
    const ctor = record.constructor;
    if (typeof ctor?.name !== 'string')
        return false;
    if ('stack' in record && typeof record.stack !== 'string')
        return false;
    return true;
}
//# sourceMappingURL=execution-level-tracer.types.js.map