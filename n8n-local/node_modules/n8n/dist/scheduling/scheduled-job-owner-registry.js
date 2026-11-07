"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScheduledJobOwnerRegistry = createScheduledJobOwnerRegistry;
const constants_1 = require("@n8n/constants");
const scheduler_1 = require("@n8n/scheduler");
function createScheduledJobOwnerRegistry(workflowOwner, agentOwner, systemTaskOwner) {
    const owners = new scheduler_1.ScheduledJobOwnerRegistry();
    owners.register(constants_1.ScheduledJobOwnerType.Workflow, workflowOwner);
    owners.register(constants_1.ScheduledJobOwnerType.Agent, agentOwner);
    owners.register(constants_1.ScheduledJobOwnerType.SystemTask, systemTaskOwner);
    return owners;
}
//# sourceMappingURL=scheduled-job-owner-registry.js.map