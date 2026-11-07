"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processHitlResponses = processHitlResponses;
const n8n_workflow_1 = require("n8n-workflow");
function isHitlActionResponse(actionResponse) {
    const hitl = actionResponse.action?.metadata?.hitl;
    return hitl !== undefined;
}
function isApprovalData(data) {
    return (typeof data === 'object' &&
        data !== null &&
        'approved' in data &&
        typeof data.approved === 'boolean');
}
function getActionJsonResponse(actionResponse) {
    return actionResponse.data?.data?.ai_tool?.[0]?.[0]?.json;
}
function getApprovalStatus(actionResponse) {
    const json = getActionJsonResponse(actionResponse);
    if (isApprovalData(json)) {
        return json.approved;
    }
    const nestedData = json?.data;
    if (isApprovalData(nestedData)) {
        return nestedData.approved;
    }
    return undefined;
}
function getChatInput(actionResponse) {
    const json = getActionJsonResponse(actionResponse);
    const chatInput = json?.chatInput ?? json?.data?.chatInput;
    if (typeof chatInput === 'string') {
        return chatInput;
    }
    return undefined;
}
function getDenialMessage(toolName, toolId, chatInput) {
    const parts = [];
    if (chatInput) {
        parts.push(`The user reviewed your planned tool call to ${toolName} (id: ${toolId}) and provided feedback: "${chatInput}".`);
    }
    else {
        parts.push(`User rejected the tool call to ${toolName} (id: ${toolId}).`);
        parts.push('STOP what you are doing and wait for the user to tell you how to proceed.');
    }
    parts.push('The tool is still available if needed.');
    return parts.join(' ');
}
function processHitlResponses(response, itemIndex) {
    if (!response || !response.actionResponses || response.actionResponses.length === 0) {
        return {
            processedResponse: response ?? { actionResponses: [], metadata: {} },
            hasApprovedHitlTools: false,
        };
    }
    const pendingGatedToolActions = [];
    const processedActionResponses = [];
    let hasApprovedHitlTools = false;
    for (const actionResponse of response.actionResponses) {
        if (!isHitlActionResponse(actionResponse)) {
            processedActionResponses.push(actionResponse);
            continue;
        }
        const { hitl } = actionResponse.action.metadata;
        const approved = getApprovalStatus(actionResponse);
        const chatInput = getChatInput(actionResponse);
        const toolName = hitl.gatedToolNodeName;
        const toolId = actionResponse.action.id;
        if (approved === true) {
            hasApprovedHitlTools = true;
            const input = typeof hitl.originalInput === 'object'
                ? { tool: hitl.toolName, ...hitl.originalInput }
                : { tool: hitl.toolName, input: hitl.originalInput };
            pendingGatedToolActions.push({
                actionType: 'ExecutionNodeAction',
                nodeName: hitl.gatedToolNodeName,
                input,
                type: n8n_workflow_1.NodeConnectionTypes.AiTool,
                id: toolId,
                metadata: {
                    itemIndex,
                    parentNodeName: actionResponse.action.nodeName,
                },
            });
        }
        else {
            const modifiedResponse = {
                ...actionResponse,
                data: {
                    ...actionResponse.data,
                    data: {
                        ai_tool: [
                            [
                                {
                                    json: {
                                        output: getDenialMessage(toolName, toolId, chatInput),
                                    },
                                },
                            ],
                        ],
                    },
                },
            };
            processedActionResponses.push(modifiedResponse);
        }
    }
    const result = {
        processedResponse: {
            ...response,
            actionResponses: processedActionResponses,
        },
        hasApprovedHitlTools,
    };
    if (pendingGatedToolActions.length > 0) {
        result.pendingGatedToolRequest = {
            actions: pendingGatedToolActions,
            metadata: {
                previousRequests: response.metadata?.previousRequests,
            },
        };
    }
    return result;
}
//# sourceMappingURL=processHitlResponses.js.map