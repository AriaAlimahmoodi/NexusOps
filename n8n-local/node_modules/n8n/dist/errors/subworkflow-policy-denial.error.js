"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubworkflowPolicyDenialError = exports.SUBWORKFLOW_AGENT_DENIAL_BASE_DESCRIPTION = exports.SUBWORKFLOW_DENIAL_BASE_DESCRIPTION = void 0;
const n8n_workflow_1 = require("n8n-workflow");
exports.SUBWORKFLOW_DENIAL_BASE_DESCRIPTION = 'The sub-workflow you’re trying to execute limits which workflows it can be called by.';
exports.SUBWORKFLOW_AGENT_DENIAL_BASE_DESCRIPTION = 'The sub-workflow you’re trying to execute doesn’t allow this agent to call it.';
function getCallerDescription(callerType) {
    return {
        agent: {
            caller: 'agent',
            accessibleCaller: 'this agent',
            baseDescription: exports.SUBWORKFLOW_AGENT_DENIAL_BASE_DESCRIPTION,
        },
        workflow: {
            caller: 'workflow',
            accessibleCaller: 'other workflows',
            baseDescription: exports.SUBWORKFLOW_DENIAL_BASE_DESCRIPTION,
        },
    }[callerType];
}
class SubworkflowPolicyDenialError extends n8n_workflow_1.WorkflowOperationError {
    constructor({ subworkflowId, subworkflowProject, instanceUrl, hasReadAccess, ownerName, node, callerType = 'workflow', }) {
        const { caller, accessibleCaller, baseDescription } = getCallerDescription(callerType);
        const descriptions = {
            default: baseDescription,
            accessible: [
                baseDescription,
                `<a href="${instanceUrl}/workflow/${subworkflowId}" target="_blank">Update sub-workflow settings</a> to allow ${accessibleCaller} to call it.`,
            ].join(' '),
            inaccessiblePersonalProject: [
                baseDescription,
                `You will need ${ownerName} to update the sub-workflow (${subworkflowId}) settings to allow this ${caller} to call it.`,
            ].join(' '),
            inaccesibleTeamProject: [
                baseDescription,
                `You will need an admin from the ${subworkflowProject.name} project to update the sub-workflow (${subworkflowId}) settings to allow this ${caller} to call it.`,
            ].join(' '),
        };
        const description = () => {
            if (hasReadAccess)
                return descriptions.accessible;
            if (subworkflowProject.type === 'personal')
                return descriptions.inaccessiblePersonalProject;
            if (subworkflowProject.type === 'team')
                return descriptions.inaccesibleTeamProject;
            return descriptions.default;
        };
        super(`The sub-workflow (${subworkflowId}) cannot be called by this ${caller}`, node, description());
    }
}
exports.SubworkflowPolicyDenialError = SubworkflowPolicyDenialError;
//# sourceMappingURL=subworkflow-policy-denial.error.js.map