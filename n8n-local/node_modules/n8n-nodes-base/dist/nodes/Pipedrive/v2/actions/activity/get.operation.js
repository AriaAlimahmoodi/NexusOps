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
        displayName: 'Activity ID',
        name: 'activityId',
        type: 'number',
        default: 0,
        required: true,
        description: 'ID of the activity to get',
    },
    common_description_1.rawCustomFieldOutputOption,
];
const displayOptions = {
    show: {
        resource: ['activity'],
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
        customProperties = await transport_1.pipedriveGetCustomProperties.call(this, 'activity');
    }
    for (let i = 0; i < items.length; i++) {
        try {
            const activityId = this.getNodeParameter('activityId', i);
            const responseData = await transport_1.pipedriveApiRequest.call(this, 'GET', `/activities/${activityId}`, {});
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