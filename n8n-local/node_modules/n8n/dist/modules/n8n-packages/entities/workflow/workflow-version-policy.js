"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.needsActiveVersion = needsActiveVersion;
exports.applyWorkflowVersionPolicy = applyWorkflowVersionPolicy;
const db_1 = require("@n8n/db");
const n8n_workflow_1 = require("n8n-workflow");
const n8n_packages_types_1 = require("../../n8n-packages.types");
const package_export_errors_1 = require("../package-export.errors");
function needsActiveVersion(policy) {
    return policy !== n8n_packages_types_1.ExportVersionPolicy.Latest;
}
function atPublishedVersion(workflow) {
    const { activeVersion } = workflow;
    if (!activeVersion) {
        throw new n8n_workflow_1.UnexpectedError('Published version was not loaded for workflow', {
            extra: { workflowId: workflow.id, activeVersionId: workflow.activeVersionId },
        });
    }
    return Object.assign(new db_1.WorkflowEntity(), workflow, {
        versionId: activeVersion.versionId,
        nodes: activeVersion.nodes,
        connections: activeVersion.connections,
    });
}
const isPublished = (workflow) => workflow.activeVersionId !== null;
function assertEveryWorkflowPublished(workflows) {
    const unpublished = workflows.filter((workflow) => !isPublished(workflow));
    if (unpublished.length === 0)
        return;
    const displayed = unpublished.slice(0, 20);
    const omittedCount = unpublished.length - displayed.length;
    throw new package_export_errors_1.PackageExportBlockedError(`${unpublished.length} workflow(s) have no published version. Export aborted.`, {
        description: `Unpublished workflow IDs: ${displayed.map(({ id }) => id).join(', ')}${omittedCount > 0 ? `, and ${omittedCount} more` : ''}`,
    });
}
const WORKFLOW_VERSION_POLICIES = {
    [n8n_packages_types_1.ExportVersionPolicy.Latest]: (workflows) => workflows,
    [n8n_packages_types_1.ExportVersionPolicy.PublishedStrict]: (workflows) => {
        assertEveryWorkflowPublished(workflows);
        return workflows.map(atPublishedVersion);
    },
    [n8n_packages_types_1.ExportVersionPolicy.PreferPublished]: (workflows) => workflows.map((workflow) => (isPublished(workflow) ? atPublishedVersion(workflow) : workflow)),
    [n8n_packages_types_1.ExportVersionPolicy.IgnoreUnpublished]: (workflows) => workflows.filter(isPublished).map(atPublishedVersion),
};
function applyWorkflowVersionPolicy(workflows, policy) {
    const archived = workflows.filter((workflow) => workflow.isArchived);
    const active = workflows.filter((workflow) => !workflow.isArchived);
    return [...WORKFLOW_VERSION_POLICIES[policy](active), ...archived];
}
//# sourceMappingURL=workflow-version-policy.js.map