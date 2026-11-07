"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTriggerDiff = computeTriggerDiff;
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const pick_1 = __importDefault(require("lodash/pick"));
const n8n_workflow_1 = require("n8n-workflow");
const registrationProps = ['name', 'type', 'typeVersion', 'webhookId', 'credentials', 'parameters'];
function registrationEqual(base, target) {
    return (0, isEqual_1.default)((0, pick_1.default)(base, registrationProps), (0, pick_1.default)(target, registrationProps));
}
const ALWAYS_REREGISTER_TRIGGER_TYPES = new Set([
    'n8n-nodes-base.n8nTrigger',
    'n8n-nodes-base.workflowTrigger',
    'n8n-nodes-base.emailReadImap',
    'n8n-nodes-base.postgresTrigger',
]);
function computeTriggerDiff(oldTriggerNodes, newTriggerNodes, { versionChanged = false } = {}) {
    const diff = (0, n8n_workflow_1.compareWorkflowsNodes)(oldTriggerNodes, newTriggerNodes, registrationEqual);
    const toAdd = new Set();
    const toRemove = new Set();
    for (const [nodeId, { status, node }] of diff) {
        switch (status) {
            case "added":
                toAdd.add(nodeId);
                break;
            case "deleted":
                toRemove.add(nodeId);
                break;
            case "modified":
                toRemove.add(nodeId);
                toAdd.add(nodeId);
                break;
            case "equal":
                if (versionChanged && ALWAYS_REREGISTER_TRIGGER_TYPES.has(node.type)) {
                    toRemove.add(nodeId);
                    toAdd.add(nodeId);
                }
                break;
        }
    }
    return { toAdd, toRemove };
}
//# sourceMappingURL=trigger-diff.js.map