"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTransientActivationError = void 0;
exports.retryTriggerActivation = retryTriggerActivation;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../../constants");
const isTransientActivationError = (error) => !(error instanceof n8n_workflow_1.WebhookPathTakenError);
exports.isTransientActivationError = isTransientActivationError;
async function retryTriggerActivation(activate, maxAttempts, signal) {
    for (let attempt = 0;; attempt++) {
        signal.throwIfAborted();
        try {
            await activate();
            return;
        }
        catch (error) {
            const isLastAttempt = attempt >= maxAttempts - 1;
            if (!(0, exports.isTransientActivationError)((0, ensure_error_1.ensureError)(error)) || isLastAttempt || signal.aborted)
                throw error;
            await (0, sleep_1.sleep)(Math.min(constants_1.WORKFLOW_REACTIVATE_INITIAL_TIMEOUT * 2 ** attempt, constants_1.WORKFLOW_REACTIVATE_MAX_TIMEOUT), signal);
        }
    }
}
//# sourceMappingURL=trigger-activation-retry.js.map