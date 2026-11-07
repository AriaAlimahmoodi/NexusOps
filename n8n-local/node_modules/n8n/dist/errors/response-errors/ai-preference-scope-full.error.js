"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPreferenceScopeFullError = void 0;
const errors_1 = require("@n8n/errors");
class AiPreferenceScopeFullError extends errors_1.BadRequestError {
    constructor(scope, meta) {
        super(`A ${scope} cannot hold more than ${meta.limit} preferences`);
        this.meta = meta;
        this.name = 'AiPreferenceScopeFullError';
    }
}
exports.AiPreferenceScopeFullError = AiPreferenceScopeFullError;
//# sourceMappingURL=ai-preference-scope-full.error.js.map