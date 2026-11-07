"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveExecutionProgress = saveExecutionProgress;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const execution_persistence_1 = require("../executions/execution-persistence");
async function saveExecutionProgress(workflowId, executionId, nodeName, _data, executionData) {
    const logger = di_1.Container.get(backend_common_1.Logger);
    const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
    const errorReporter = di_1.Container.get(n8n_core_1.ErrorReporter);
    try {
        logger.debug(`Save execution progress to database for execution ID ${executionId} `, {
            executionId,
            nodeName,
        });
        executionData.resultData.lastNodeExecuted = nodeName;
        const updated = await executionPersistence.updateExistingExecution(executionId, { data: executionData, status: 'running' }, { requireNotFinished: true, requireNotCanceled: true });
        if (!updated) {
            logger.debug(`Skipped saving execution progress to database for execution ID ${executionId} - execution already finished or canceled`, { executionId, nodeName });
        }
    }
    catch (e) {
        const error = e instanceof Error ? e : new Error(`${e}`);
        errorReporter.error(error);
        logger.error(`Failed saving execution progress to database for execution ID ${executionId} (hookFunctionsSaveProgress, nodeExecuteAfter)`, { error, executionId, workflowId });
    }
}
//# sourceMappingURL=save-execution-progress.js.map