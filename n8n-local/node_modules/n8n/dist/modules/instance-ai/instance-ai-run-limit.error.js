"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceAiRunLimitError = void 0;
const errors_1 = require("@n8n/errors");
class InstanceAiRunLimitError extends errors_1.TooManyRequestsError {
    constructor(message, meta) {
        super(message);
        this.meta = meta;
        this.name = 'InstanceAiRunLimitError';
    }
}
exports.InstanceAiRunLimitError = InstanceAiRunLimitError;
//# sourceMappingURL=instance-ai-run-limit.error.js.map