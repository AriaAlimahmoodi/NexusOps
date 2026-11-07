"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWebhookLastNodeResponse = extractWebhookLastNodeResponse;
const di_1 = require("@n8n/di");
const get_1 = __importDefault(require("lodash/get"));
const n8n_core_1 = require("n8n-core");
const result_1 = require("@n8n/utils/result");
const n8n_workflow_1 = require("n8n-workflow");
async function extractWebhookLastNodeResponse(responseDataType, lastNodeTaskData, checkAllMainOutputs = false, options) {
    if (responseDataType === 'firstEntryJson') {
        return extractFirstEntryJsonFromTaskData(lastNodeTaskData, checkAllMainOutputs, options.responsePropertyName, options.responseContentType);
    }
    if (responseDataType === 'firstEntryBinary') {
        return await extractFirstEntryBinaryFromTaskData(lastNodeTaskData, checkAllMainOutputs, options.responseBinaryPropertyName);
    }
    if (responseDataType === 'noData') {
        return (0, result_1.createResultOk)({
            type: 'static',
            body: undefined,
            contentType: undefined,
        });
    }
    return extractAllEntriesJsonFromTaskData(lastNodeTaskData, checkAllMainOutputs);
}
function extractFirstEntryJsonFromTaskData(lastNodeTaskData, checkAllMainOutputs = false, responsePropertyName, responseContentType) {
    const mainOutputs = lastNodeTaskData.data?.main;
    let firstItem;
    if (mainOutputs && Array.isArray(mainOutputs)) {
        for (const branch of mainOutputs) {
            if (branch && Array.isArray(branch) && branch.length > 0) {
                firstItem = branch[0];
                break;
            }
            if (!checkAllMainOutputs) {
                break;
            }
        }
    }
    if (firstItem === undefined) {
        return (0, result_1.createResultError)(new n8n_workflow_1.OperationalError('No item to return was found'));
    }
    let lastNodeFirstJsonItem = firstItem.json;
    if (responsePropertyName !== undefined) {
        lastNodeFirstJsonItem = (0, get_1.default)(lastNodeFirstJsonItem, responsePropertyName);
    }
    return (0, result_1.createResultOk)({
        type: 'static',
        body: lastNodeFirstJsonItem,
        contentType: responseContentType,
    });
}
async function extractFirstEntryBinaryFromTaskData(lastNodeTaskData, checkAllMainOutputs = false, responseBinaryPropertyName) {
    const mainOutputs = lastNodeTaskData.data?.main;
    let lastNodeFirstJsonItem;
    if (mainOutputs && Array.isArray(mainOutputs)) {
        for (const branch of mainOutputs) {
            if (branch && Array.isArray(branch) && branch.length > 0) {
                lastNodeFirstJsonItem = branch[0];
                break;
            }
            if (!checkAllMainOutputs) {
                break;
            }
        }
    }
    if (lastNodeFirstJsonItem === undefined) {
        return (0, result_1.createResultError)(new n8n_workflow_1.OperationalError('No item was found to return'));
    }
    if (lastNodeFirstJsonItem.binary === undefined) {
        return (0, result_1.createResultError)(new n8n_workflow_1.OperationalError('No binary data was found to return'));
    }
    if (responseBinaryPropertyName === undefined) {
        return (0, result_1.createResultError)(new n8n_workflow_1.OperationalError("No 'responseBinaryPropertyName' is set"));
    }
    else if (typeof responseBinaryPropertyName !== 'string') {
        return (0, result_1.createResultError)(new n8n_workflow_1.OperationalError("'responseBinaryPropertyName' is not a string"));
    }
    const binaryData = lastNodeFirstJsonItem.binary[responseBinaryPropertyName];
    if (binaryData === undefined) {
        return (0, result_1.createResultError)(new n8n_workflow_1.OperationalError(`The binary property '${responseBinaryPropertyName}' which should be returned does not exist`));
    }
    if (binaryData.id) {
        const stream = await di_1.Container.get(n8n_core_1.BinaryDataService).getAsStream(binaryData.id);
        return (0, result_1.createResultOk)({
            type: 'stream',
            stream,
            contentType: binaryData.mimeType,
        });
    }
    else {
        return (0, result_1.createResultOk)({
            type: 'static',
            body: Buffer.from(binaryData.data, n8n_workflow_1.BINARY_ENCODING),
            contentType: binaryData.mimeType,
        });
    }
}
function extractAllEntriesJsonFromTaskData(lastNodeTaskData, checkAllMainOutputs = false) {
    const data = [];
    const mainOutputs = lastNodeTaskData.data?.main;
    if (mainOutputs && Array.isArray(mainOutputs)) {
        for (const branch of mainOutputs) {
            if (branch && Array.isArray(branch) && branch.length > 0) {
                for (const entry of branch) {
                    data.push(entry.json);
                }
                break;
            }
            if (!checkAllMainOutputs) {
                break;
            }
        }
    }
    return (0, result_1.createResultOk)({
        type: 'static',
        body: data,
        contentType: undefined,
    });
}
//# sourceMappingURL=webhook-last-node-response-extractor.js.map