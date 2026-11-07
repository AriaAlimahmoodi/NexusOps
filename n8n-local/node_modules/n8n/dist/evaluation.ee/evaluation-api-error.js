"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationApiError = void 0;
class EvaluationApiError extends Error {
    constructor(code, message, details) {
        super(message ?? code);
        this.name = 'EvaluationApiError';
        this.code = code;
        this.details = details;
    }
    toResponse() {
        return { code: this.code, message: this.message, details: this.details };
    }
}
exports.EvaluationApiError = EvaluationApiError;
//# sourceMappingURL=evaluation-api-error.js.map