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
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        description: 'The name of the organization to create',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        options: [
            {
                displayName: 'Label Names or IDs',
                name: 'label_ids',
                type: 'multiOptions',
                description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                typeOptions: {
                    loadOptionsMethod: 'getOrganizationLabels',
                },
                default: [],
            },
            {
                displayName: 'Owner Name or ID',
                name: 'owner_id',
                type: 'options',
                typeOptions: {
                    loadOptionsMethod: 'getUserIds',
                },
                default: '',
                description: 'ID of the user who will be marked as the owner of this organization. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
            },
            common_description_1.visibleToOption,
            common_description_1.customFieldsCollection,
        ],
    },
    common_description_1.rawCustomFieldKeysOption,
];
const displayOptions = {
    show: {
        resource: ['organization'],
        operation: ['create'],
    },
};
exports.description = (0, utilities_1.updateDisplayOptions)(displayOptions, properties);
async function execute() {
    const items = this.getInputData();
    const returnData = [];
    const rawKeys = this.getNodeParameter('rawCustomFieldKeys', 0, false);
    let customProperties;
    if (!rawKeys) {
        customProperties = await transport_1.pipedriveGetCustomProperties.call(this, 'organization');
    }
    for (let i = 0; i < items.length; i++) {
        try {
            const body = {};
            body.name = this.getNodeParameter('name', i);
            const additionalFields = this.getNodeParameter('additionalFields', i);
            (0, helpers_1.addFieldsToBody)(body, additionalFields);
            if (customProperties) {
                (0, helpers_1.encodeCustomFieldsV2)(customProperties, body);
            }
            const responseData = await transport_1.pipedriveApiRequest.call(this, 'POST', '/organizations', body);
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
//# sourceMappingURL=create.operation.js.map