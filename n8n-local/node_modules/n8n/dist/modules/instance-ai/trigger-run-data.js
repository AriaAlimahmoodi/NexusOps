"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTriggerExecutionData = createTriggerExecutionData;
const n8n_workflow_1 = require("n8n-workflow");
function createEmptyTriggerItems() {
    return [{ json: {} }];
}
function createTriggerExecutionData(input) {
    const triggerItems = input.triggerItems ?? createEmptyTriggerItems();
    return (0, n8n_workflow_1.createRunExecutionData)({
        startData: {},
        resultData: { pinData: input.pinData, runData: {} },
        executionData: {
            contextData: {},
            metadata: {},
            nodeExecutionStack: [
                {
                    node: input.triggerNode,
                    data: { main: [triggerItems] },
                    source: null,
                },
            ],
            waitingExecution: {},
            waitingExecutionSource: {},
        },
    });
}
//# sourceMappingURL=trigger-run-data.js.map