"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDatasetRecord = toDatasetRecord;
exports.toRunRecord = toRunRecord;
exports.toResultRecord = toResultRecord;
exports.toRatingRecord = toRatingRecord;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const toIso = (date) => date?.toISOString() ?? null;
const isDataTableRef = (ref) => 'dataTableId' in ref;
const isGoogleSheetsRef = (ref) => 'spreadsheetId' in ref;
function toDatasetRefPair(dataset) {
    const { datasetSource, datasetRef } = dataset;
    if (datasetSource === 'data_table' && isDataTableRef(datasetRef)) {
        return { datasetSource, datasetRef };
    }
    if (datasetSource === 'google_sheets' && isGoogleSheetsRef(datasetRef)) {
        return { datasetSource, datasetRef };
    }
    throw new n8n_workflow_1.UnexpectedError(`Agent eval dataset ${dataset.id} has a '${datasetSource}' source whose ref does not match that shape.`);
}
function toDatasetRecord(dataset) {
    return {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
        agentId: dataset.agentId,
        columnMapping: dataset.columnMapping,
        createdById: dataset.createdById,
        createdAt: dataset.createdAt.toISOString(),
        updatedAt: dataset.updatedAt.toISOString(),
        ...toDatasetRefPair(dataset),
    };
}
function toRunRecord(run) {
    return {
        id: run.id,
        datasetId: run.datasetId,
        agentVersionId: run.agentVersionId,
        status: run.status,
        runAt: toIso(run.runAt),
        completedAt: toIso(run.completedAt),
        metrics: run.metrics,
        errorCode: run.errorCode,
        errorDetails: run.errorDetails,
        createdById: run.createdById,
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString(),
    };
}
function toVerdictRecord(verdict) {
    if (!verdict)
        return null;
    const parsed = api_types_1.agentEvalVerdictSchema.safeParse(verdict);
    return parsed.success ? parsed.data : null;
}
function toResultRecord(result) {
    return {
        id: result.id,
        runId: result.runId,
        sourceRowId: result.sourceRowId,
        runIndex: result.runIndex,
        status: result.status,
        input: result.input,
        output: result.output,
        toolCalls: result.toolCalls,
        metrics: result.metrics,
        verdict: toVerdictRecord(result.verdict),
        runAt: toIso(result.runAt),
        completedAt: toIso(result.completedAt),
        errorCode: result.errorCode,
        errorDetails: result.errorDetails,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
    };
}
function toRatingRecord(rating) {
    return {
        id: rating.id,
        resultId: rating.resultId,
        vote: rating.vote,
        comment: rating.comment,
        correction: rating.correction,
        ratedById: rating.ratedById,
        createdAt: rating.createdAt.toISOString(),
        updatedAt: rating.updatedAt.toISOString(),
    };
}
//# sourceMappingURL=agent-eval-record-mappers.js.map