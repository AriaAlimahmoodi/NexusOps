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
        displayName: 'Deal ID',
        name: 'dealId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the deal to get',
    },
    common_description_1.rawCustomFieldOutputOption,
];
const displayOptions = {
    show: {
        resource: ['deal'],
        operation: ['get'],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute() {
    const items = this.getInputData();
    const returnData = [];
    const rawOutput = this.getNodeParameter('rawCustomFieldOutput', 0, false);
    let customProperties;
    if (!rawOutput) {
        customProperties = await transport_1.pipedriveGetCustomProperties.call(this, 'deal');
    }
    for (let i = 0; i < items.length; i++) {
        try {
            const dealId = this.getNodeParameter('dealId', i);
            const responseData = await transport_1.pipedriveApiRequest.call(this, 'GET', `/deals/${dealId}`, {});
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
//# sourceMappingURL=get.operation.js.map