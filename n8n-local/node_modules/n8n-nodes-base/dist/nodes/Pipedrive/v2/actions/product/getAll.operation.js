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
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
            show: {
                returnAll: [false],
            },
        },
        typeOptions: {
            minValue: 1,
            maxValue: 500,
        },
        default: 100,
        description: 'Max number of results to return',
    },
    common_description_1.rawCustomFieldOutputOption,
];
const displayOptions = {
    show: {
        resource: ['product'],
        operation: ['getAll'],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute() {
    const items = this.getInputData();
    const returnData = [];
    const rawOutput = this.getNodeParameter('rawCustomFieldOutput', 0, false);
    let customProperties;
    if (!rawOutput) {
        customProperties = await transport_1.pipedriveGetCustomProperties.call(this, 'product');
    }
    for (let i = 0; i < items.length; i++) {
        try {
            const returnAll = this.getNodeParameter('returnAll', i);
            const qs = {};
            if (!returnAll) {
                qs.limit = this.getNodeParameter('limit', i);
            }
            let responseData;
            if (returnAll) {
                responseData = await transport_1.pipedriveApiRequestAllItemsCursor.call(this, 'GET', '/products', {}, qs);
            }
            else {
                responseData = await transport_1.pipedriveApiRequest.call(this, 'GET', '/products', {}, qs);
            }
            const data = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
            const executionData = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(data), { itemData: { item: i } });
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
//# sourceMappingURL=getAll.operation.js.map