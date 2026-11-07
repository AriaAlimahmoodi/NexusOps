"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWebhookOutcome = toWebhookOutcome;
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
function toWebhookOutcome(received, expectation) {
    switch (received.type) {
        case 'undeliverable':
            return {
                status: 'undeliverable',
                error: { name: received.error.code, message: received.error.message },
            };
        case 'response':
            if (expectation.kind !== 'stepResponse')
                return undefined;
            return { status: 'response', response: (0, n8n_core_1.decodeBufferBody)(received.payload) };
        case 'chunk':
            return undefined;
        case 'ended':
            switch (received.status) {
                case 'cancelled':
                    return { status: 'cancelled' };
                case 'failed': {
                    const { nodeId, nodeName, error } = settledLastStep(received);
                    return { status: 'failed', nodeId, nodeName, error };
                }
                case 'completed': {
                    const { nodeName, outputs } = settledLastStep(received);
                    return {
                        status: 'completed',
                        lastNode: outputs ? { nodeName, outputs } : undefined,
                    };
                }
                default: {
                    const exhaustive = received.status;
                    throw new n8n_workflow_1.UnexpectedError(`Unexpected run status: ${JSON.stringify(exhaustive)}`);
                }
            }
        default: {
            const exhaustive = received;
            throw new n8n_workflow_1.UnexpectedError(`Unexpected response type: ${JSON.stringify(exhaustive)}`);
        }
    }
}
function settledLastStep(received) {
    if (received.lastStep === null) {
        throw new n8n_workflow_1.UnexpectedError(`Run ${received.executionId} ended ${received.status} with no last step`);
    }
    return received.lastStep;
}
//# sourceMappingURL=webhook-outcome.js.map