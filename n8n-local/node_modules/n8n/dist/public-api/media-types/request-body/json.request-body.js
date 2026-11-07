"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonRequestBody = void 0;
const public_api_validation_error_1 = require("../../../public-api/public-api-validation-error");
exports.jsonRequestBody = {
    mediaType: 'application/json',
    errorStatuses: [415],
    discoverable: true,
    readInput(req) {
        return req.body;
    },
    formatValidationError(error) {
        return (0, public_api_validation_error_1.formatValidationError)('body', error);
    },
};
//# sourceMappingURL=json.request-body.js.map