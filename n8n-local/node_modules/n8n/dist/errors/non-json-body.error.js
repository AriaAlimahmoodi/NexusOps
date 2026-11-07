"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonJsonBodyError = void 0;
const errors_1 = require("@n8n/errors");
class NonJsonBodyError extends errors_1.UserError {
    constructor() {
        super('Body must be valid JSON. Please make sure `content-type` is `application/json`.');
    }
}
exports.NonJsonBodyError = NonJsonBodyError;
//# sourceMappingURL=non-json-body.error.js.map