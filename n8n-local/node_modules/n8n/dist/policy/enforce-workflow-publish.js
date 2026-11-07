"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceWorkflowPublishPolicy = enforceWorkflowPublishPolicy;
async function enforceWorkflowPublishPolicy(policyEnforcementService, ownershipService, workflow, actor) {
    if (!policyEnforcementService.hasChecksFor('workflowPublish'))
        return;
    const project = await ownershipService.getWorkflowProjectCached(workflow.id);
    await policyEnforcementService.enforceWorkflowPublish({ workflow, projectId: project.id }, actor);
}
//# sourceMappingURL=enforce-workflow-publish.js.map