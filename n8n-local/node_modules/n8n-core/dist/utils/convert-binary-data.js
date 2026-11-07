"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertBinaryData = convertBinaryData;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const binary_data_config_1 = require("../binary-data/binary-data.config");
const binary_helper_functions_1 = require("../execution-engine/node-execution-context/utils/binary-helper-functions");
async function convertBinaryData(workflowId, executionId, responseData, binaryMode) {
    const { mode } = di_1.Container.get(binary_data_config_1.BinaryDataConfig);
    if (binaryMode !== n8n_workflow_1.BINARY_MODE_COMBINED || mode === 'default')
        return responseData;
    if (!responseData.data?.length)
        return responseData;
    for (const outputData of responseData.data) {
        for (const item of outputData) {
            if (!item.binary)
                continue;
            item.json = { ...item.json };
            item.binary = { ...item.binary };
            const embeddedBinaries = {};
            const jsonBinaries = {};
            for (const [key, value] of Object.entries(item.binary)) {
                if (value?.id) {
                    jsonBinaries[key] = value;
                    continue;
                }
                if (!executionId) {
                    embeddedBinaries[key] = value;
                    continue;
                }
                const buffer = Buffer.from(value.data, n8n_workflow_1.BINARY_ENCODING);
                const binaryData = await (0, binary_helper_functions_1.prepareBinaryData)(buffer, executionId, workflowId, undefined, value?.mimeType);
                if (value.fileName) {
                    binaryData.fileName = value.fileName;
                }
                jsonBinaries[key] = binaryData;
            }
            const existingValue = item.json[n8n_workflow_1.BINARY_IN_JSON_PROPERTY] ?? {};
            if (Array.isArray(existingValue) || typeof existingValue !== 'object') {
                throw new n8n_workflow_1.UnexpectedError(`Binary data could not be converted. Item already has '${n8n_workflow_1.BINARY_IN_JSON_PROPERTY}' field, but value type is not an object`);
            }
            if (Object.keys(jsonBinaries).length) {
                const existingJsonBinaries = existingValue;
                item.json[n8n_workflow_1.BINARY_IN_JSON_PROPERTY] = { ...existingJsonBinaries, ...jsonBinaries };
            }
            item.binary = Object.keys(embeddedBinaries).length ? embeddedBinaries : undefined;
        }
    }
    return responseData;
}
//# sourceMappingURL=convert-binary-data.js.map