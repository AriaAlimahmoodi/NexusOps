"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSendAndWaitOperation = hasSendAndWaitOperation;
exports.convertNodeToHitlTool = convertNodeToHitlTool;
exports.createHitlTools = createHitlTools;
const n8n_workflow_1 = require("n8n-workflow");
const utils_1 = require("./utils");
function hasSendAndWaitOperation(nodeType) {
    if (nodeType.name.endsWith('Tool')) {
        return false;
    }
    if (!nodeType.webhooks || nodeType.webhooks.length === 0) {
        return false;
    }
    const operationProps = nodeType.properties.filter((p) => p.name === 'operation');
    if (operationProps.length === 0) {
        return false;
    }
    for (const operationProp of operationProps) {
        if (!Array.isArray(operationProp.options))
            continue;
        const hasSendAndWait = operationProp.options.some((opt) => typeof opt === 'object' && 'value' in opt && opt.value === n8n_workflow_1.SEND_AND_WAIT_OPERATION);
        if (hasSendAndWait) {
            return true;
        }
    }
    return false;
}
function findSendAndWaitResource(properties) {
    for (const prop of properties) {
        if (prop.name === 'operation' && Array.isArray(prop.options)) {
            const hasSendAndWait = prop.options.some((opt) => typeof opt === 'object' && 'value' in opt && opt.value === n8n_workflow_1.SEND_AND_WAIT_OPERATION);
            if (hasSendAndWait && prop.displayOptions?.show?.resource) {
                const resources = prop.displayOptions.show.resource;
                if (Array.isArray(resources) && resources.length > 0) {
                    return resources[0];
                }
            }
        }
    }
    return undefined;
}
function filterHitlToolProperties(properties, sendAndWaitResource) {
    const filtered = [];
    filtered.push({
        displayName: 'Message',
        name: 'message',
        type: 'string',
        default: '=The agent wants to run this tool: {{ $tool.name }}\n\nInput:\n{{ $tool.parameters }}',
        required: true,
        typeOptions: { rows: 3 },
        description: 'Message to send for approval. Use expressions to include tool details: {{ $tool.parameters }}, {{ $json.toolCallId }}',
    });
    for (const prop of properties) {
        if (prop.name === 'resource') {
            if (sendAndWaitResource) {
                filtered.push({
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'hidden',
                    default: sendAndWaitResource,
                });
            }
            continue;
        }
        if (prop.name === 'operation') {
            filtered.push({
                displayName: 'Operation',
                name: 'operation',
                type: 'hidden',
                default: n8n_workflow_1.SEND_AND_WAIT_OPERATION,
            });
            continue;
        }
        if (prop.name === 'message') {
            continue;
        }
        if (prop.name === 'responseType') {
            filtered.push({
                displayName: 'Response Type',
                name: 'responseType',
                type: 'hidden',
                default: 'approval',
            });
            continue;
        }
        if (prop.name === 'approvalOptions') {
            filtered.push((0, n8n_workflow_1.deepCopy)(prop));
            continue;
        }
        filtered.push((0, n8n_workflow_1.deepCopy)(prop));
    }
    return filtered;
}
function convertNodeToHitlTool(item) {
    if ((0, utils_1.isFullDescription)(item.description)) {
        const originalDisplayName = item.description.displayName;
        const sendAndWaitResource = findSendAndWaitResource(item.description.properties);
        item.description.name += 'HitlTool';
        item.description.displayName = originalDisplayName;
        item.description.subtitle = 'Send and wait';
        item.description.description = 'Request human approval for tools';
        item.description.defaults = {
            ...item.description.defaults,
            name: originalDisplayName,
        };
        item.description.skipNameGeneration = true;
        item.description.inputs = [
            {
                displayName: 'Tool',
                type: n8n_workflow_1.NodeConnectionTypes.AiTool,
                required: true,
            },
        ];
        item.description.outputs = [
            {
                displayName: 'Human review',
                type: n8n_workflow_1.NodeConnectionTypes.AiTool,
                filter: {
                    nodes: ['@n8n/n8n-nodes-langchain.agent', '@n8n/n8n-nodes-langchain.agentTool'],
                },
            },
        ];
        item.description.builderHint = {
            ...item.description.builderHint,
            inputs: { [n8n_workflow_1.NodeConnectionTypes.AiTool]: { required: true } },
            searchHint: 'Approval tool that gates other tools. Attach it to the AI Agent in subnodes.tools, and put the gated tools in its own subnodes.tools. The type definition is the base node: only the send-and-wait parameters apply. Use {{ $tool.name }} and {{ $tool.parameters }} in the message to show what the agent wants to run.',
        };
        item.description.properties = filterHitlToolProperties(item.description.properties, sendAndWaitResource);
    }
    (0, utils_1.setToolCodex)(item.description, 'Human in the Loop');
    const nodeItem = item;
    if (nodeItem.execute) {
        const originalExecute = nodeItem.execute;
        nodeItem.execute = async function () {
            const node = this.getNode();
            node.rewireOutputLogTo = n8n_workflow_1.NodeConnectionTypes.AiTool;
            return await originalExecute.call(this);
        };
    }
    return item;
}
function createHitlTools(types, known) {
    const sendAndWaitNodes = types.nodes.filter(hasSendAndWaitOperation);
    for (const sendAndWaitNode of sendAndWaitNodes) {
        const description = (0, n8n_workflow_1.deepCopy)(sendAndWaitNode);
        const wrapped = convertNodeToHitlTool({ description }).description;
        types.nodes.push(wrapped);
        known.nodes[wrapped.name] = {
            ...known.nodes[sendAndWaitNode.name],
        };
        (0, utils_1.copyCredentialSupport)(known, sendAndWaitNode.name, wrapped.name);
    }
}
//# sourceMappingURL=hitl-tools.js.map