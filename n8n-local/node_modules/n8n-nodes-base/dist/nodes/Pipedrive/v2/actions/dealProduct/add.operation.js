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
        description: 'ID of the deal to add a product to',
    },
    {
        displayName: 'Product ID',
        name: 'productId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the product to add to the deal',
    },
    {
        displayName: 'Item Price',
        name: 'item_price',
        type: 'number',
        typeOptions: {
            numberPrecision: 2,
        },
        default: 0,
        required: true,
        description: 'Price at which to add this product to the deal',
    },
    {
        displayName: 'Quantity',
        name: 'quantity',
        type: 'number',
        default: 1,
        typeOptions: {
            minValue: 1,
        },
        required: true,
        description: 'How many items of this product to add to the deal',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
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
        operation: ['add'],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute() {
    const items = this.getInputData();
    const returnData = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const dealId = this.getNodeParameter('dealId', i);
            const body = {
                product_id: this.getNodeParameter('productId', i),
                item_price: (0, helpers_1.coerceToNumber)(this.getNodeParameter('item_price', i)),
                quantity: (0, helpers_1.coerceToNumber)(this.getNodeParameter('quantity', i)),
            };
            const additionalFields = this.getNodeParameter('additionalFields', i);
            Object.assign(body, additionalFields);
            if (body.discount !== undefined) {
                body.discount = (0, helpers_1.coerceToNumber)(body.discount);
            }
            if (body.tax !== undefined) {
                body.tax = (0, helpers_1.coerceToNumber)(body.tax);
            }
            const responseData = await transport_1.pipedriveApiRequest.call(this, 'POST', `/deals/${dealId}/products`, body);
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
//# sourceMappingURL=add.operation.js.map