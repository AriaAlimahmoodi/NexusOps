"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncompatibleNodesApiVersionError = void 0;
const errors_1 = require("@n8n/errors");
class IncompatibleNodesApiVersionError extends errors_1.ResponseError {
    constructor(message, meta, cause) {
        super(message, 400, undefined, undefined, cause);
        this.meta = meta;
        this.name = 'IncompatibleNodesApiVersionError';
    }
}
exports.IncompatibleNodesApiVersionError = IncompatibleNodesApiVersionError;
//# sourceMappingURL=incompatible-nodes-api-version.error.js.map