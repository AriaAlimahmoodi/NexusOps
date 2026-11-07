"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineFinalExecutionStatus = determineFinalExecutionStatus;
exports.prepareExecutionDataForDbUpdate = prepareExecutionDataForDbUpdate;
exports.updateExistingExecutionMetadata = updateExistingExecutionMetadata;
exports.updateExistingExecution = updateExistingExecution;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const pick_1 = __importDefault(require("lodash/pick"));
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const execution_persistence_1 = require("../../executions/execution-persistence");
const execution_metadata_service_1 = require("../../services/execution-metadata.service");
const utils_1 = require("../../utils");
function determineFinalExecutionStatus(runData) {
    const workflowHasCrashed = runData.status === 'crashed';
    const workflowWasCanceled = runData.status === 'canceled';
    const workflowHasFailed = runData.status === 'error';
    const workflowDidSucceed = !runData.data.resultData?.error &&
        !workflowHasCrashed &&
        !workflowWasCanceled &&
        !workflowHasFailed;
    let workflowStatusFinal = workflowDidSucceed ? 'success' : 'error';
    if (workflowHasCrashed)
        workflowStatusFinal = 'crashed';
    if (workflowWasCanceled)
        workflowStatusFinal = 'canceled';
    if (runData.waitTill)
        workflowStatusFinal = 'waiting';
    return workflowStatusFinal;
}
function prepareExecutionDataForDbUpdate(parameters) {
    const { runData, workflowData, workflowStatusFinal, retryOf } = parameters;
    const pristineWorkflowData = (0, pick_1.default)(workflowData, [
        'id',
        'name',
        'active',
        'activeVersionId',
        'isArchived',
        'createdAt',
        'updatedAt',
        'nodes',
        'connections',
        'settings',
        'staticData',
        'pinData',
        'nodeGroups',
    ]);
    const fullExecutionData = {
        data: runData.data,
        mode: runData.mode,
        finished: runData.finished ? runData.finished : false,
        startedAt: runData.startedAt,
        stoppedAt: runData.stoppedAt,
        workflowData: pristineWorkflowData,
        waitTill: runData.waitTill,
        status: workflowStatusFinal,
        workflowId: pristineWorkflowData.id,
    };
    if (retryOf !== undefined) {
        fullExecutionData.retryOf = retryOf.toString();
    }
    const workflowId = workflowData.id;
    if ((0, utils_1.isWorkflowIdValid)(workflowId)) {
        fullExecutionData.workflowId = workflowId;
    }
    return fullExecutionData;
}
async function updateExistingExecutionMetadata(executionId, metadata) {
    const logger = di_1.Container.get(backend_common_1.Logger);
    try {
        if (metadata && Object.keys(metadata).length > 0) {
            await di_1.Container.get(execution_metadata_service_1.ExecutionMetadataService).save(executionId, metadata);
        }
    }
    catch (e) {
        const error = (0, ensure_error_1.ensureError)(e);
        logger.error(`Failed to save metadata for execution ID ${executionId}`, { error });
    }
}
async function updateExistingExecution(parameters) {
    const logger = di_1.Container.get(backend_common_1.Logger);
    const { executionId, workflowId, executionData, conditions } = parameters;
    logger.debug(`Save execution data to database for execution ID ${executionId}`, {
        executionId,
        workflowId,
        finished: executionData.finished,
        stoppedAt: executionData.stoppedAt,
    });
    const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
    const updated = await executionPersistence.updateExistingExecution(executionId, executionData, conditions);
    if (!updated) {
        logger.debug(`Skipped saving execution data for execution ID ${executionId} - update conditions not met`, { executionId, workflowId });
        return updated;
    }
    if (executionData.finished === true && executionData.retryOf !== undefined) {
        await executionPersistence.updateExistingExecution(executionData.retryOf, {
            retrySuccessId: executionId,
        });
    }
    return updated;
}
//# sourceMappingURL=shared-hook-functions.js.map