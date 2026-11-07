"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertStaticSubWorkflowsIncluded = assertStaticSubWorkflowsIncluded;
const package_export_errors_1 = require("../package-export.errors");
const MAX_DISPLAYED_MISSING_WORKFLOWS = 20;
function assertStaticSubWorkflowsIncluded(workflowRequirements, exportedWorkflowIds) {
    const missingSubWorkflowIds = new Set();
    for (const requirement of workflowRequirements) {
        if (!exportedWorkflowIds.has(requirement.referencedWorkflowId)) {
            missingSubWorkflowIds.add(requirement.referencedWorkflowId);
        }
    }
    if (missingSubWorkflowIds.size === 0)
        return;
    const displayedWorkflowIds = [...missingSubWorkflowIds].slice(0, MAX_DISPLAYED_MISSING_WORKFLOWS);
    const omittedCount = missingSubWorkflowIds.size - displayedWorkflowIds.length;
    const dependencyLabel = missingSubWorkflowIds.size === 1 ? 'dependency' : 'dependencies';
    throw new package_export_errors_1.PackageExportBlockedError(`${missingSubWorkflowIds.size} workflow ${dependencyLabel} not included in the package. Export aborted.`, {
        description: `Workflow IDs not included in the package: ${displayedWorkflowIds.join(', ')}${omittedCount > 0 ? `, and ${omittedCount} more` : ''}`,
    });
}
//# sourceMappingURL=static-sub-workflow-requirements.js.map