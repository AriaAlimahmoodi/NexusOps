"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseEulaRequiredError = void 0;
const errors_1 = require("@n8n/errors");
class LicenseEulaRequiredError extends errors_1.ResponseError {
    constructor(message, meta) {
        super(message, 400);
        this.meta = meta;
        this.name = 'LicenseEulaRequiredError';
    }
}
exports.LicenseEulaRequiredError = LicenseEulaRequiredError;
//# sourceMappingURL=license-eula-required.error.js.map