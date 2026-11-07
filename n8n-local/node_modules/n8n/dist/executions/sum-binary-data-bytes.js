"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumBinaryDataBytes = sumBinaryDataBytes;
const n8n_workflow_1 = require("n8n-workflow");
function* iterateConnectionsBinary(connections) {
    for (const outputs of Object.values(connections ?? {})) {
        for (const items of outputs ?? []) {
            for (const item of items ?? []) {
                yield* Object.values(item?.binary ?? {});
                const jsonBinary = item?.json?.[n8n_workflow_1.BINARY_IN_JSON_PROPERTY];
                if (jsonBinary && typeof jsonBinary === 'object') {
                    yield* Object.values(jsonBinary);
                }
            }
        }
    }
}
function* iterateBinary(data) {
    for (const nodeRuns of Object.values(data?.resultData.runData ?? {})) {
        for (const nodeRun of nodeRuns ?? []) {
            yield* iterateConnectionsBinary(nodeRun?.data);
            yield* iterateConnectionsBinary(nodeRun?.inputOverride);
        }
    }
    const executionData = data?.executionData;
    for (const executeData of executionData?.nodeExecutionStack ?? []) {
        yield* iterateConnectionsBinary(executeData?.data);
    }
    for (const runs of Object.values(executionData?.waitingExecution ?? {})) {
        for (const connections of Object.values(runs ?? {})) {
            yield* iterateConnectionsBinary(connections);
        }
    }
}
function sumBinaryDataBytes(data) {
    const bytesByBlobId = new Map();
    for (const binary of iterateBinary(data)) {
        if (binary?.id)
            bytesByBlobId.set(binary.id, binary.bytes ?? 0);
    }
    let total = 0;
    for (const bytes of bytesByBlobId.values())
        total += bytes;
    return total;
}
//# sourceMappingURL=sum-binary-data-bytes.js.map