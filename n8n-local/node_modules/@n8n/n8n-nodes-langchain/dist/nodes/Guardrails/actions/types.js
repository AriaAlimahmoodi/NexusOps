"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailError = void 0;
class GuardrailError extends Error {
    constructor(guardrailName, message, description) {
        super(message);
        this.guardrailName = guardrailName;
        this.description = description;
    }
}
exports.GuardrailError = GuardrailError;
//# sourceMappingURL=types.js.map