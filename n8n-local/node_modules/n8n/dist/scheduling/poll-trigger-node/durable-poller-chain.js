"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDurablePollerChainEnabled = isDurablePollerChainEnabled;
function isDurablePollerChainEnabled(schedulerConfig, workflowsConfig) {
    return (schedulerConfig.enabled &&
        schedulerConfig.enabledForPollTriggers &&
        workflowsConfig.useWorkflowPublicationService);
}
//# sourceMappingURL=durable-poller-chain.js.map