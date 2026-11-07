"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResponse = formatResponse;
function formatResponse(response, returnUnwrappedObject) {
    if (typeof response === 'string') {
        return {
            text: response.trim(),
        };
    }
    if (Array.isArray(response)) {
        return {
            data: response,
        };
    }
    if (response instanceof Object) {
        if (returnUnwrappedObject) {
            return response;
        }
        return {
            text: JSON.stringify(response),
        };
    }
    return {
        response: {
            text: response,
        },
    };
}
//# sourceMappingURL=responseFormatter.js.map