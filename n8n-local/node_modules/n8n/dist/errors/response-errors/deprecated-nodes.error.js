"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeprecatedNodesError = void 0;
const errors_1 = require("@n8n/errors");
class DeprecatedNodesError extends errors_1.ResponseError {
    constructor(message, meta) {
        super(message, 400);
        this.meta = meta;
        this.name = 'DeprecatedNodesError';
    }
}
exports.DeprecatedNodesError = DeprecatedNodesError;
//# sourceMappingURL=deprecated-nodes.error.js.map