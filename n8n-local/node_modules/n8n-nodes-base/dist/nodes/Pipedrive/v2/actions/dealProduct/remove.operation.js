"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const utilities_1 = require("../../../../../utils/utilities");
const transport_1 = require("../../transport");
const properties = [
    {
        displayName: 'Deal ID',
        name: 'dealId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the deal whose product to remove',
    },
    {
        displayName: 'Product Attachment ID',
        name: 'productAttachmentId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the deal-product (the ID of the product attached to the deal, not the product ID itself)',
    },
];
const displayOptions = {
    show: {
        resource: ['dealProduct'],
        operation: ['remove'],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute() {
    const items = this.getInputData();
    const returnData = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const dealId = this.getNodeParameter('dealId', i);
            const productAttachmentId = this.getNodeParameter('productAttachmentId', i);
            await transport_1.pipedriveApiRequest.call(this, 'DELETE', `/deals/${dealId}/products/${productAttachmentId}`, {});
            const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray({ success: true }), { itemData: { item: i } });
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
//# sourceMappingURL=remove.operation.js.map