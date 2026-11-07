"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findResumeNode = findResumeNode;
exports.redirectIfToolExecutor = redirectIfToolExecutor;
exports.getMessage = getMessage;
exports.getLastNodeExecuted = getLastNodeExecuted;
exports.shouldResumeImmediately = shouldResumeImmediately;
exports.getLastNodeMessage = getLastNodeMessage;
const constants_1 = require("@n8n/constants");
const n8n_workflow_1 = require("n8n-workflow");
const AI_TOOL = 'ai_tool';
function getToolExecutorTargetNode(executionData, workflow) {
    if (executionData.node.name !== constants_1.TOOL_EXECUTOR_NODE_NAME)
        return null;
    const toolNodeName = executionData.node.parameters?.node;
    return toolNodeName ? workflow.getNode(toolNodeName) : null;
}
function findResumeNode(executionData, workflow) {
    const parkedNode = executionData.node;
    if (parkedNode.name === constants_1.TOOL_EXECUTOR_NODE_NAME) {
        return getToolExecutorTargetNode(executionData, workflow);
    }
    return workflow.getNode(parkedNode.name);
}
function redirectIfToolExecutor(execution, executionData, workflow) {
    const toolNode = getToolExecutorTargetNode(executionData, workflow);
    if (!toolNode)
        return null;
    executionData.node = toolNode;
    execution.data.resultData.lastNodeExecuted = toolNode.name;
    executionData.runIndex = 0;
    if (execution.data.startData) {
        execution.data.startData.runNodeFilter = undefined;
        execution.data.startData.destinationNode = undefined;
    }
    return toolNode;
}
function getOriginalDestinationNodeName(startData) {
    const dest = startData?.originalDestinationNode;
    if (!dest)
        return undefined;
    return typeof dest === 'string' ? dest : dest.nodeName;
}
function getSendMessageFromToolNode(nodeRuns) {
    const lastRun = nodeRuns[nodeRuns.length - 1];
    const aiToolBranches = lastRun?.data?.[AI_TOOL];
    if (!Array.isArray(aiToolBranches))
        return undefined;
    for (const branch of aiToolBranches) {
        if (Array.isArray(branch) && branch[0]?.sendMessage) {
            return branch[0].sendMessage;
        }
    }
    return undefined;
}
function getToolExecutorSendMessage(executionData) {
    const { startData, resultData } = executionData;
    const { runData } = resultData;
    const toolNodeName = getOriginalDestinationNodeName(startData);
    if (toolNodeName && runData[toolNodeName]) {
        return getSendMessageFromToolNode(runData[toolNodeName]);
    }
    for (const [nodeName, nodeRuns] of Object.entries(runData)) {
        if (nodeName === constants_1.TOOL_EXECUTOR_NODE_NAME)
            continue;
        const message = getSendMessageFromToolNode(nodeRuns);
        if (message)
            return message;
    }
    return undefined;
}
function getMessage(execution) {
    const lastNodeExecuted = execution.data.resultData.lastNodeExecuted;
    if (typeof lastNodeExecuted !== 'string')
        return undefined;
    if (lastNodeExecuted === constants_1.TOOL_EXECUTOR_NODE_NAME) {
        return getToolExecutorSendMessage(execution.data);
    }
    const runIndex = execution.data.resultData.runData[lastNodeExecuted].length - 1;
    const data = execution.data.resultData.runData[lastNodeExecuted][runIndex]?.data;
    const outputs = data?.main ?? data?.[AI_TOOL];
    if (outputs && Array.isArray(outputs)) {
        for (const branch of outputs) {
            if (branch && Array.isArray(branch) && branch.length > 0 && branch[0].sendMessage) {
                return branch[0].sendMessage;
            }
        }
    }
    return undefined;
}
function getLastNodeExecuted(execution) {
    const lastNodeExecuted = execution.data.resultData.lastNodeExecuted;
    if (typeof lastNodeExecuted !== 'string')
        return undefined;
    const node = execution.workflowData?.nodes?.find((node) => node.name === lastNodeExecuted);
    if (node)
        return node;
    if (lastNodeExecuted === constants_1.TOOL_EXECUTOR_NODE_NAME) {
        return {
            name: constants_1.TOOL_EXECUTOR_NODE_NAME,
            type: '@n8n/n8n-nodes-langchain.toolExecutor',
            parameters: {},
            id: '',
            typeVersion: 1,
            position: [0, 0],
            disabled: false,
        };
    }
    return undefined;
}
function shouldResumeImmediately(lastNode) {
    if (lastNode?.type === n8n_workflow_1.RESPOND_TO_WEBHOOK_NODE_TYPE) {
        return true;
    }
    if (lastNode?.parameters?.[n8n_workflow_1.CHAT_WAIT_USER_REPLY] === false) {
        return true;
    }
    const options = lastNode?.parameters?.options;
    if (options && options[n8n_workflow_1.CHAT_WAIT_USER_REPLY] === false) {
        return true;
    }
    const operation = lastNode?.parameters?.operation;
    const isChatNode = lastNode?.type === n8n_workflow_1.CHAT_NODE_TYPE || lastNode?.type === n8n_workflow_1.CHAT_TOOL_NODE_TYPE;
    if (isChatNode && operation && operation !== n8n_workflow_1.SEND_AND_WAIT_OPERATION) {
        return true;
    }
    return false;
}
function getLastNodeMessage(execution, lastNode) {
    if (lastNode.type !== n8n_workflow_1.CHAT_NODE_TYPE)
        return '';
    const message = execution.data?.resultData?.runData?.[lastNode.name]?.[0]?.data?.main?.[0]?.[0]?.sendMessage;
    return message ?? '';
}
//# sourceMappingURL=utils.js.map