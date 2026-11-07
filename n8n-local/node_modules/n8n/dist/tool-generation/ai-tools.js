"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLastCalloutIndex = findLastCalloutIndex;
exports.convertNodeToAiTool = convertNodeToAiTool;
exports.createAiTools = createAiTools;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("./utils");
function findLastCalloutIndex(properties) {
    for (let i = properties.length - 1; i >= 0; i--) {
        if (properties[i].type === 'callout')
            return i;
    }
    return -1;
}
function convertNodeToAiTool(item) {
    if ((0, utils_1.isFullDescription)(item.description)) {
        item.description.name += 'Tool';
        item.description.inputs = [];
        item.description.outputs = [n8n_workflow_1.NodeConnectionTypes.AiTool];
        item.description.displayName += ' Tool';
        delete item.description.usableAsTool;
        const hasResource = item.description.properties.some((prop) => prop.name === 'resource');
        const hasOperation = item.description.properties.some((prop) => prop.name === 'operation');
        if (!item.description.properties.map((prop) => prop.name).includes('toolDescription')) {
            const descriptionType = {
                displayName: 'Tool Description',
                name: 'descriptionType',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Set Automatically',
                        value: 'auto',
                        description: 'Automatically set based on resource and operation',
                    },
                    {
                        name: 'Set Manually',
                        value: 'manual',
                        description: 'Manually set the description',
                    },
                ],
                default: 'auto',
            };
            const descProp = {
                displayName: 'Description',
                name: 'toolDescription',
                type: 'string',
                default: item.description.description,
                required: true,
                typeOptions: { rows: 2 },
                description: 'Explain to the LLM what this tool does, a good, specific description would allow LLMs to produce expected results much more often',
            };
            const lastCallout = findLastCalloutIndex(item.description.properties);
            item.description.properties.splice(lastCallout + 1, 0, descProp);
            if (hasResource || hasOperation) {
                item.description.properties.splice(lastCallout + 1, 0, descriptionType);
                descProp.displayOptions = {
                    show: {
                        descriptionType: ['manual'],
                    },
                };
            }
        }
    }
    (0, utils_1.setToolCodex)(item.description, 'Other Tools', true);
    return item;
}
function createAiTools(types, known) {
    const usableNodes = types.nodes.filter((nodeType) => Boolean(nodeType.usableAsTool));
    for (const usableNode of usableNodes) {
        const description = typeof usableNode.usableAsTool === 'object'
            ? {
                ...(0, n8n_workflow_1.deepCopy)(usableNode),
                ...usableNode.usableAsTool?.replacements,
            }
            : (0, n8n_workflow_1.deepCopy)(usableNode);
        const wrapped = convertNodeToAiTool({ description }).description;
        types.nodes.push(wrapped);
        known.nodes[wrapped.name] = { ...known.nodes[usableNode.name] };
        (0, utils_1.copyCredentialSupport)(known, usableNode.name, wrapped.name);
    }
}
//# sourceMappingURL=ai-tools.js.map