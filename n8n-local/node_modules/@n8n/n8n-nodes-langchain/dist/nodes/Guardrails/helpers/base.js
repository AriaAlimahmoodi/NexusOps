"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStageGuardrails = runStageGuardrails;
const types_1 = require("../actions/types");
const wrapInGuardrailError = (guardrailName, promise) => {
    return promise.catch((error) => {
        throw new types_1.GuardrailError(guardrailName, error?.description || error?.message || 'Unknown error', error?.description);
    });
};
async function runStageGuardrails({ stageGuardrails, stage, inputText, failOnlyOnErrors, }) {
    const guardrailPromises = [];
    for (const guardrail of stageGuardrails[stage]) {
        guardrailPromises.push(wrapInGuardrailError(guardrail.name, Promise.resolve().then(async () => await guardrail.check(inputText))));
    }
    const results = await Promise.allSettled(guardrailPromises);
    const passed = [];
    const failed = [];
    for (const result of results) {
        const checkFailed = failOnlyOnErrors
            ? result.status === 'rejected' || !!result.value.executionFailed
            : result.status === 'rejected' || !!result.value.tripwireTriggered;
        if (result.status === 'fulfilled' && !checkFailed) {
            passed.push(result);
        }
        else {
            failed.push(result);
        }
    }
    return { passed, failed };
}
//# sourceMappingURL=base.js.map