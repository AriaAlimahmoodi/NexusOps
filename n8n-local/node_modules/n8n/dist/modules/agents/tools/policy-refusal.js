"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPolicyRefusalResult = toPolicyRefusalResult;
const POLICY_REFUSAL_INSTRUCTION = 'An administrator policy refused this tool call. Do not retry it or work around it. ' +
    'Tell the user which action you could not do and why, then continue with the rest of the request.';
function toPolicyRefusalResult(message, violations) {
    return { isPolicyRefusal: true, message, violations, instruction: POLICY_REFUSAL_INSTRUCTION };
}
//# sourceMappingURL=policy-refusal.js.map