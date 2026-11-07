"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorCode = getErrorCode;
function getErrorCode(error) {
    if (typeof error === 'object' && error !== null) {
        if ('httpStatusCode' in error) {
            const value = error.httpStatusCode;
            if (typeof value === 'number' || typeof value === 'string') {
                return `HTTP_${value}`;
            }
        }
        if ('errorCode' in error) {
            const value = error.errorCode;
            if (typeof value === 'number')
                return String(value);
            if (typeof value === 'string')
                return value;
        }
    }
    return 'UNKNOWN_ERROR';
}
//# sourceMappingURL=error-code.utils.js.map