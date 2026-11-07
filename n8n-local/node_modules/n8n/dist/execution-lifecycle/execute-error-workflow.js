"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeErrorWorkflow = executeErrorWorkflow;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const policy_violation_error_1 = require("../policy/policy-violation.error");
const ownership_service_1 = require("../services/ownership.service");
const backend_services_1 = require("@n8n/backend-services");
const getWorkflowExecutionService = async () => {
    const { WorkflowExecutionService } = await import('../workflows/workflow-execution.service.js');
    return di_1.Container.get(WorkflowExecutionService);
};
function executeErrorWorkflow(workflowData, fullRunData, mode, executionId, retryOf) {
    const logger = di_1.Container.get(backend_common_1.Logger);
    let pastExecutionUrl;
    if (executionId !== undefined) {
        pastExecutionUrl = `${di_1.Container.get(backend_services_1.UrlService).getInstanceBaseUrl()}/workflow/${workflowData.id}/executions/${executionId}`;
    }
    if (fullRunData.data.resultData.error !== undefined) {
        if ((0, policy_violation_error_1.isPolicyRefusal)(fullRunData.data.resultData.error))
            return;
        let workflowErrorData;
        const workflowId = workflowData.id;
        if (executionId) {
            workflowErrorData = {
                execution: {
                    id: executionId,
                    url: pastExecutionUrl,
                    error: fullRunData.data.resultData.error,
                    lastNodeExecuted: fullRunData.data.resultData.lastNodeExecuted,
                    mode,
                    retryOf,
                    executionContext: (0, n8n_workflow_1.toErrorWorkflowContext)(fullRunData.data.executionData?.runtimeData),
                },
                workflow: {
                    id: workflowId,
                    name: workflowData.name,
                },
            };
        }
        else {
            workflowErrorData = {
                trigger: {
                    error: fullRunData.data.resultData.error,
                    mode,
                },
                workflow: {
                    id: workflowId,
                    name: workflowData.name,
                },
            };
        }
        const { errorTriggerType } = di_1.Container.get(config_1.GlobalConfig).nodes;
        const { errorWorkflow } = workflowData.settings ?? {};
        if (errorWorkflow && !(mode === 'error' && workflowId && errorWorkflow === workflowId)) {
            logger.debug('Start external error workflow', {
                executionId,
                errorWorkflowId: errorWorkflow,
                workflowId,
            });
            if (!workflowId) {
                return;
            }
            di_1.Container.get(ownership_service_1.OwnershipService)
                .getWorkflowProjectCached(workflowId)
                .then(async (project) => {
                const workflowExecutionService = await getWorkflowExecutionService();
                await workflowExecutionService.executeErrorWorkflow(errorWorkflow, workflowErrorData, project);
            })
                .catch((error) => {
                di_1.Container.get(n8n_core_1.ErrorReporter).error(error);
                logger.error(`Could not execute ErrorWorkflow for execution ID ${executionId} because of error querying the workflow owner`, {
                    executionId,
                    errorWorkflowId: errorWorkflow,
                    workflowId,
                    error,
                    workflowErrorData,
                });
            });
        }
        else if (mode !== 'error' &&
            workflowId !== undefined &&
            workflowData.nodes.some((node) => node.type === errorTriggerType)) {
            logger.debug('Start internal error workflow', { executionId, workflowId });
            void di_1.Container.get(ownership_service_1.OwnershipService)
                .getWorkflowProjectCached(workflowId)
                .then(async (project) => {
                const workflowExecutionService = await getWorkflowExecutionService();
                await workflowExecutionService.executeErrorWorkflow(workflowId, workflowErrorData, project);
            })
                .catch((error) => {
                di_1.Container.get(n8n_core_1.ErrorReporter).error(error);
                logger.error(`Could not execute internal ErrorWorkflow for execution ID ${executionId}`, {
                    executionId,
                    workflowId,
                    error,
                    workflowErrorData,
                });
            });
        }
    }
}
//# sourceMappingURL=execute-error-workflow.js.map