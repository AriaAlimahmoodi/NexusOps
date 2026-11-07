"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const utilities_1 = require("../../../../../utils/utilities");
const transport_1 = require("../../transport");
const helpers_1 = require("../../helpers");
const properties = [
    {
        displayName: 'Deal ID',
        name: 'dealId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the deal whose product to update',
    },
    {
        displayName: 'Product Attachment ID',
        name: 'productAttachmentId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the deal-product (the ID of the product attached to the deal, not the product ID itself)',
    },
    {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        options: [
            {
                displayName: 'Comments',
                name: 'comments',
                type: 'string',
                typeOptions: {
                    rows: 4,
                },
                default: '',
                description: 'Text to describe this product-deal attachment',
            },
            {
                displayName: 'Discount',
                name: 'discount',
                type: 'number',
                default: 0,
                description: 'The value of the discount. The discount type can be specified in discount_type.',
            },
            {
                displayName: 'Discount Type',
                name: 'discount_type',
                type: 'options',
                default: 'percentage',
                options: [
                    {
                        name: 'Percentage',
                        value: 'percentage',
                    },
                    {
                        name: 'Amount',
                        value: 'amount',
                    },
                ],
                description: 'The type of the discount',
            },
            {
                displayName: 'Item Price',
                name: 'item_price',
                type: 'number',
                typeOptions: {
                    numberPrecision: 2,
                },
                default: 0,
                description: 'Price at which to update this product in the deal',
            },
            {
                displayName: 'Quantity',
                name: 'quantity',
                type: 'number',
                default: 1,
                typeOptions: {
                    minValue: 1,
                },
                description: 'How many items of this product in the deal',
            },
            {
                displayName: 'Tax',
                name: 'tax',
                type: 'number',
                default: 0,
                description: 'The tax percentage',
                typeOptions: {
                    minValue: 0,
                    maxValue: 100,
                },
            },
        ],
    },
];
const displayOptions = {
    show: {
        resource: ['dealProduct'],
        operation: ['update'],
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
            const updateFields = this.getNodeParameter('updateFields', i);
            const body = {};
            Object.assign(body, updateFields);
            if (body.item_price !== undefined) {
                body.item_price = (0, helpers_1.coerceToNumber)(body.item_price);
            }
            if (body.quantity !== undefined) {
                body.quantity = (0, helpers_1.coerceToNumber)(body.quantity);
            }
            if (body.discount !== undefined) {
                body.discount = (0, helpers_1.coerceToNumber)(body.discount);
            }
            if (body.tax !== undefined) {
                body.tax = (0, helpers_1.coerceToNumber)(body.tax);
            }
            const responseData = await transport_1.pipedriveApiRequest.call(this, 'PATCH', `/deals/${dealId}/products/${productAttachmentId}`, body);
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
//# sourceMappingURL=update.operation.js.map