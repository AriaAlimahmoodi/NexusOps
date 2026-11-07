"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.description = void 0;
exports.execute = execute;
const utilities_1 = require("../../../../../utils/utilities");
const transport_1 = require("../../transport");
const helpers_1 = require("../../helpers");
const common_description_1 = require("../common.description");
const properties = [
    {
        displayName: 'Product ID',
        name: 'productId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the product to update',
    },
    {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        options: [
            {
                displayName: 'Code',
                name: 'code',
                type: 'string',
                default: '',
                description: 'The product code',
            },
            {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'The name of the product',
            },
            {
                displayName: 'Owner ID',
                name: 'owner_id',
                type: 'number',
                default: 0,
                description: 'ID of the user who will be marked as the owner of this product',
            },
            {
                displayName: 'Prices',
                name: 'prices',
                type: 'fixedCollection',
                default: {},
                typeOptions: {
                    multipleValues: true,
                },
                placeholder: 'Add Price',
                options: [
                    {
                        displayName: 'Price',
                        name: 'pricesValues',
                        values: [
                            {
                                displayName: 'Price',
                                name: 'price',
                                type: 'number',
                                default: 0,
                                typeOptions: {
                                    numberPrecision: 2,
                                },
                                description: 'The price of the product',
                            },
                            {
                                displayName: 'Currency',
                                name: 'currency',
                                type: 'string',
                                default: 'USD',
                                description: 'The currency of the price (3-letter code, e.g. USD, EUR)',
                            },
                            {
                                displayName: 'Cost',
                                name: 'cost',
                                type: 'number',
                                default: 0,
                                typeOptions: {
                                    numberPrecision: 2,
                                },
                                description: 'The cost of the product',
                            },
                        ],
                    },
                ],
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
            {
                displayName: 'Unit',
                name: 'unit',
                type: 'string',
                default: '',
                description: 'The unit in which this product is sold',
            },
            common_description_1.visibleToOption,
            common_description_1.customFieldsCollection,
        ],
    },
    common_description_1.rawCustomFieldKeysOption,
];
const displayOptions = {
    show: {
        resource: ['product'],
        operation: ['update'],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute() {
    const items = this.getInputData();
    const returnData = [];
    const rawKeys = this.getNodeParameter('rawCustomFieldKeys', 0, false);
    let customProperties;
    if (!rawKeys) {
        customProperties = await transport_1.pipedriveGetCustomProperties.call(this, 'product');
    }
    for (let i = 0; i < items.length; i++) {
        try {
            const productId = this.getNodeParameter('productId', i);
            const updateFields = this.getNodeParameter('updateFields', i);
            const body = {};
            (0, helpers_1.addFieldsToBody)(body, updateFields);
            // Unpack the prices fixed-collection into the format the API expects
            if (body.prices && body.prices.pricesValues) {
                body.prices = body.prices.pricesValues;
            }
            if (customProperties) {
                (0, helpers_1.encodeCustomFieldsV2)(customProperties, body);
            }
            const responseData = await transport_1.pipedriveApiRequest.call(this, 'PATCH', `/products/${productId}`, body);
            const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(responseData.data), { itemData: { item: i } });
            if (customProperties) {
                for (const item of executionData) {
                    (0, helpers_1.resolveCustomFieldsV2)(customProperties, item);
                }
            }
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