"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreBinaryDataId = restoreBinaryDataId;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
function collectRenameEntries(run, executionId) {
    const entriesByFileId = new Map();
    for (const nodeRuns of Object.values(run.data.resultData.runData)) {
        for (const nodeRun of nodeRuns ?? []) {
            for (const outputs of nodeRun.data?.main ?? []) {
                for (const item of outputs ?? []) {
                    for (const binaryData of Object.values(item?.binary ?? {})) {
                        const binaryDataId = binaryData?.id;
                        if (!binaryDataId)
                            continue;
                        const [mode, fileId] = binaryDataId.split(':');
                        if (!fileId.includes(`/${n8n_core_1.TEMP_EXECUTION_ID}/`))
                            continue;
                        const existing = entriesByFileId.get(fileId);
                        if (existing) {
                            existing.binaryDataRefs.push(binaryData);
                        }
                        else {
                            entriesByFileId.set(fileId, {
                                binaryDataRefs: [binaryData],
                                mode,
                                fileId,
                                correctFileId: fileId.replace(`/${n8n_core_1.TEMP_EXECUTION_ID}/`, `/${executionId}/`),
                            });
                        }
                    }
                }
            }
        }
    }
    return [...entriesByFileId.values()];
}
async function restoreBinaryDataId(run, executionId, workflowExecutionMode) {
    if (workflowExecutionMode !== 'webhook' || di_1.Container.get(n8n_core_1.BinaryDataConfig).mode === 'default') {
        return;
    }
    try {
        const entries = collectRenameEntries(run, executionId);
        await Promise.all(entries.map(async ({ fileId, correctFileId }) => await di_1.Container.get(n8n_core_1.BinaryDataService).rename(fileId, correctFileId)));
        for (const { binaryDataRefs, mode, correctFileId } of entries) {
            for (const binaryData of binaryDataRefs) {
                binaryData.id = `${mode}:${correctFileId}`;
            }
        }
    }
    catch (e) {
        const error = e instanceof Error ? e : new Error(`${e}`);
        const logger = di_1.Container.get(backend_common_1.Logger);
        if (typeof error.message === 'string' && error.message.includes('ENOENT')) {
            logger.warn('Failed to restore binary data ID - No such file or dir', {
                executionId,
                error,
            });
            return;
        }
        logger.error('Failed to restore binary data ID - Unknown error', { executionId, error });
    }
}
//# sourceMappingURL=restore-binary-data-id.js.map