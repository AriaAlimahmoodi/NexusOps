"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkflowEntityFromPayload = createWorkflowEntityFromPayload;
const db_1 = require("@n8n/db");
const workflowEntityWriteFields = [
    'id',
    'name',
    'description',
    'nodes',
    'connections',
    'settings',
    'staticData',
    'meta',
    'pinData',
    'nodeGroups',
];
function createWorkflowEntityFromPayload(payload) {
    return Object.assign(new db_1.WorkflowEntity(), Object.fromEntries(workflowEntityWriteFields
        .filter((field) => payload[field] !== undefined)
        .map((field) => [field, payload[field]])));
}
//# sourceMappingURL=workflow-entity-mapper.js.map