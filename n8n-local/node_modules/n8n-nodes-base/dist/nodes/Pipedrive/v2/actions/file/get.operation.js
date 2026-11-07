"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const utilities_1 = require("../../../../../utils/utilities");
const transport_1 = require("../../transport");
const properties = [
    {
        displayName: 'File ID',
        name: 'fileId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the file to get',
    },
];
const displayOptions = {
    show: {
        resource: ['file'],
        operation: ['get'],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute() {
    const items = this.getInputData();
    const returnData = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const fileId = this.getNodeParameter('fileId', i);
            const responseData = await transport_1.pipedriveApiRequest.call(this, 'GET', `/files/${fileId}`, {}, {}, { apiVersion: 'v1' });
            const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(responseData.data), { itemData: { item: i } });
            returnData.push(...executionData);
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray({ error: error.message }), { itemData: { item: i } }));
                continue;
            }
            throw error;
        }
    }
    return returnData;
}
//# sourceMappingURL=get.operation.js.map