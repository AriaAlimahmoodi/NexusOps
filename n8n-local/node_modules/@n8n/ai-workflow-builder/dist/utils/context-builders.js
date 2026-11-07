"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorkflowSummary = buildWorkflowSummary;
exports.buildWorkflowJsonBlock = buildWorkflowJsonBlock;
exports.buildWorkflowOverview = buildWorkflowOverview;
exports.buildDiscoveryContextBlock = buildDiscoveryContextBlock;
exports.buildConversationContext = buildConversationContext;
exports.buildExecutionContextBlock = buildExecutionContextBlock;
exports.buildExecutionSchemaBlock = buildExecutionSchemaBlock;
exports.buildSimplifiedExecutionContext = buildSimplifiedExecutionContext;
exports.buildSelectedNodesContextBlock = buildSelectedNodesContextBlock;
exports.buildSelectedNodesSummary = buildSelectedNodesSummary;
exports.createContextMessage = createContextMessage;
const messages_1 = require("@langchain/core/messages");
const constants_1 = require("../constants");
const mermaid_utils_1 = require("../tools/utils/mermaid.utils");
const node_helpers_1 = require("./node-helpers");
const trim_workflow_context_1 = require("./trim-workflow-context");
const truncate_json_1 = require("./truncate-json");
function buildWorkflowSummary(workflow) {
    if (workflow.nodes.length === 0) {
        return 'No nodes in workflow';
    }
    const nodeList = workflow.nodes.map((n) => `- ${n.name} (${n.type})`).join('\n');
    return `${workflow.nodes.length} existing nodes:\n${nodeList}`;
}
function buildWorkflowJsonBlock(workflow) {
    const trimmed = (0, trim_workflow_context_1.trimWorkflowJSON)(workflow);
    return [
        '<current_workflow_json>',
        JSON.stringify(trimmed, null, 2),
        '</current_workflow_json>',
        '<note>Large property values may be trimmed. Use get_node_parameter tool for full details.</note>',
    ].join('\n');
}
function findTriggerNodes(nodes) {
    return nodes.filter((n) => (0, node_helpers_1.isTriggerNodeType)(n.type));
}
function buildWorkflowOverview(workflow) {
    if (workflow.nodes.length === 0) {
        return 'Empty workflow - ready to build';
    }
    const triggerNodes = findTriggerNodes(workflow.nodes);
    const parts = ['<workflow_overview>'];
    parts.push(`Node count: ${workflow.nodes.length}`);
    if (triggerNodes.length === 0) {
        parts.push('Triggers: None');
    }
    else if (triggerNodes.length === 1) {
        parts.push(`Trigger: ${triggerNodes[0].name} (${triggerNodes[0].type})`);
    }
    else {
        parts.push(`Triggers (${triggerNodes.length}):`);
        for (const trigger of triggerNodes) {
            parts.push(`  - ${trigger.name} (${trigger.type})`);
        }
    }
    parts.push('');
    const mermaid = (0, mermaid_utils_1.mermaidStringify)({ workflow }, {
        includeNodeType: true,
        includeNodeParameters: true,
        includeNodeName: true,
    });
    parts.push(mermaid);
    parts.push('</workflow_overview>');
    return parts.join('\n');
}
function buildDiscoveryContextBlock(discoveryContext, includeBestPractices = true) {
    if (!discoveryContext)
        return '';
    const parts = [];
    if (discoveryContext.nodesFound.length > 0) {
        parts.push('Discovered Nodes:');
        discoveryContext.nodesFound.forEach(({ nodeName, version, reasoning, connectionChangingParameters, availableResources }) => {
            const params = connectionChangingParameters.length > 0
                ? ` [Connection params: ${connectionChangingParameters.map((p) => `${p.name}=${p.possibleValues.join('|')}`).join(', ')}]`
                : '';
            let resourceInfo = '';
            if (availableResources && availableResources.length > 0) {
                const filteredResources = availableResources
                    .filter((r) => r.value !== '__CUSTOM_API_CALL__')
                    .map((r) => {
                    const ops = r.operations
                        .filter((o) => o.value !== '__CUSTOM_API_CALL__')
                        .map((o) => `"${o.value}"`)
                        .join(', ');
                    return `    - resource="${r.value}" supports operations: [${ops}]`;
                });
                if (filteredResources.length > 0) {
                    resourceInfo = `\n  Available resource/operation combinations:\n${filteredResources.join('\n')}`;
                }
            }
            parts.push(`- ${nodeName} v${version}: ${reasoning}${params}${resourceInfo}`);
        });
    }
    if (includeBestPractices && discoveryContext.bestPractices) {
        parts.push('', 'Best Practices:', discoveryContext.bestPractices);
    }
    if (discoveryContext.fetchedUrlContent?.length) {
        parts.push('', 'Fetched URL Content:');
        for (const item of discoveryContext.fetchedUrlContent) {
            if (item.status === 'error') {
                parts.push(`URL: ${item.url} [FAILED]`, item.content, '');
            }
            else {
                parts.push(`URL: ${item.url}`, `Title: ${item.title}`, item.content, '');
            }
        }
    }
    return parts.join('\n');
}
function getMessageContent(message) {
    if (typeof message.content === 'string') {
        return message.content;
    }
    if (Array.isArray(message.content)) {
        return message.content
            .filter((block) => typeof block === 'object' && block !== null && 'type' in block && block.type === 'text')
            .map((block) => block.text)
            .join('\n');
    }
    return '';
}
function getQuestionAnswers(message) {
    if (!message)
        return null;
    const resumeData = message.additional_kwargs?.resumeData;
    if (!Array.isArray(resumeData) || resumeData.length === 0)
        return null;
    const first = resumeData[0];
    if (typeof first !== 'object' || !('question' in first))
        return null;
    return resumeData;
}
function buildConversationContext(messages, coordinationLog, previousSummary) {
    const parts = [];
    if (previousSummary) {
        parts.push('Previous conversation summary:');
        parts.push(previousSummary);
        parts.push('');
    }
    const humanMessages = messages.filter((m) => m instanceof messages_1.HumanMessage);
    const firstUserMessage = humanMessages[0];
    const lastUserMessage = humanMessages[humanMessages.length - 1];
    if (firstUserMessage && lastUserMessage && firstUserMessage !== lastUserMessage) {
        const originalContent = getMessageContent(firstUserMessage);
        if (originalContent) {
            parts.push(`Original request: "${originalContent}"`);
            parts.push('');
        }
    }
    const completedPhases = coordinationLog.filter((e) => e.status === 'completed');
    if (completedPhases.length > 0) {
        parts.push('Previous actions:');
        for (const entry of completedPhases) {
            parts.push(`- ${capitalizeFirst(entry.phase)}: ${entry.summary}`);
        }
        parts.push('');
    }
    const qaAnswers = lastUserMessage ? getQuestionAnswers(lastUserMessage) : null;
    if (qaAnswers && lastUserMessage) {
        appendQAPairs(parts, qaAnswers, humanMessages, lastUserMessage, firstUserMessage);
    }
    else {
        appendLastExchange(parts, messages, lastUserMessage);
    }
    return parts.join('\n');
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function appendQAPairs(parts, qaAnswers, humanMessages, lastUserMessage, firstUserMessage) {
    parts.push('Clarification Q&A:');
    for (const answer of qaAnswers) {
        if (answer.skipped)
            continue;
        const responseParts = [];
        if (answer.selectedOptions.length > 0)
            responseParts.push(answer.selectedOptions.join(', '));
        if (answer.customText?.trim())
            responseParts.push(answer.customText.trim());
        const response = responseParts.length > 0 ? responseParts.join(', ') : '(no answer)';
        parts.push(`- Q: ${answer.question}`);
        parts.push(`  A: ${response}`);
    }
    parts.push('');
    const previousNonResumeMessage = [...humanMessages]
        .reverse()
        .find((msg) => msg !== lastUserMessage && !msg.additional_kwargs?.resumeData);
    if (previousNonResumeMessage && previousNonResumeMessage !== firstUserMessage) {
        const prevContent = getMessageContent(previousNonResumeMessage);
        if (prevContent) {
            parts.push(`Current request: "${prevContent}"`);
        }
    }
}
function appendLastExchange(parts, messages, lastUserMessage) {
    if (!lastUserMessage)
        return;
    const lastUserIndex = messages.lastIndexOf(lastUserMessage);
    if (lastUserIndex > 0) {
        for (let i = lastUserIndex - 1; i >= 0; i--) {
            if (messages[i] instanceof messages_1.AIMessage) {
                const aiContent = getMessageContent(messages[i]);
                if (aiContent) {
                    const truncatedContent = aiContent.length > constants_1.MAX_AI_RESPONSE_CHARS
                        ? '...' + aiContent.slice(-constants_1.MAX_AI_RESPONSE_CHARS)
                        : aiContent;
                    parts.push(`Last AI response: "${truncatedContent}"`);
                    parts.push('');
                }
                break;
            }
        }
    }
    const currentContent = getMessageContent(lastUserMessage);
    if (currentContent) {
        parts.push(`Current request: "${currentContent}"`);
    }
}
function buildExecutionContextBlock(workflowContext) {
    const executionData = workflowContext?.executionData ?? {};
    const executionSchema = workflowContext?.executionSchema ?? [];
    return [
        '<execution_data>',
        (0, truncate_json_1.truncateJson)(executionData),
        '</execution_data>',
        '',
        '<execution_schema>',
        (0, truncate_json_1.truncateJson)(executionSchema),
        '</execution_schema>',
    ].join('\n');
}
function buildExecutionSchemaBlock(workflowContext) {
    const executionSchema = workflowContext?.executionSchema ?? [];
    if (executionSchema.length === 0)
        return '';
    return ['<execution_schema>', (0, truncate_json_1.truncateJson)(executionSchema), '</execution_schema>'].join('\n');
}
function countNodeOutputItems(runData, nodeName) {
    const nodeData = runData?.[nodeName];
    if (!nodeData || nodeData.length === 0)
        return 0;
    const firstExecution = nodeData[0];
    const mainOutput = firstExecution?.data?.main;
    if (!mainOutput || mainOutput.length === 0)
        return 0;
    let totalItems = 0;
    for (const branchOutput of mainOutput) {
        totalItems += branchOutput?.length ?? 0;
    }
    return totalItems;
}
function buildDataFlowString(runData, executedNodeNames) {
    if (!runData || executedNodeNames.length === 0)
        return '';
    const nodeFlows = executedNodeNames.map((nodeName) => {
        const itemCount = countNodeOutputItems(runData, nodeName);
        const itemLabel = itemCount === 1 ? 'item' : 'items';
        return `${nodeName} (${itemCount} ${itemLabel})`;
    });
    return nodeFlows.join(' → ');
}
function buildErrorStatus(error, lastNodeExecuted) {
    const parts = ['<execution_status>', '  <status>error</status>'];
    if (lastNodeExecuted) {
        parts.push(`  <last_node_executed>${lastNodeExecuted}</last_node_executed>`);
    }
    parts.push('  <error>');
    if ('node' in error && error.node) {
        const nodeName = typeof error.node === 'string' ? error.node : error.node.name;
        parts.push(`    <node>${nodeName}</node>`);
    }
    if (error.message) {
        parts.push(`    <message>${error.message}</message>`);
    }
    if (error.description) {
        parts.push(`    <description>${error.description}</description>`);
    }
    parts.push('  </error>');
    parts.push('</execution_status>');
    return parts.join('\n');
}
function buildIssuesStatus(dataFlow, nodesNotExecuted, nodesWithEmptyOutput) {
    const parts = ['<execution_status>', '  <status>issues_detected</status>'];
    if (dataFlow) {
        parts.push(`  <data_flow>${dataFlow}</data_flow>`);
    }
    if (nodesNotExecuted.length > 0) {
        parts.push(`  <nodes_not_executed>${nodesNotExecuted.join(', ')}</nodes_not_executed>`);
    }
    if (nodesWithEmptyOutput.length > 0) {
        parts.push(`  <nodes_with_empty_output>${nodesWithEmptyOutput.join(', ')}</nodes_with_empty_output>`);
    }
    parts.push('</execution_status>');
    return parts.join('\n');
}
const NO_EXECUTION_STATUS = [
    '<execution_status>',
    '  <status>no_execution</status>',
    '</execution_status>',
].join('\n');
const SUCCESS_STATUS = [
    '<execution_status>',
    '  <status>success</status>',
    '</execution_status>',
].join('\n');
function buildSimplifiedExecutionContext(workflowContext, workflowNodes) {
    if (!workflowContext) {
        return NO_EXECUTION_STATUS;
    }
    const executionData = workflowContext.executionData;
    const lastNodeExecuted = executionData?.lastNodeExecuted;
    if (executionData?.error) {
        return buildErrorStatus(executionData.error, lastNodeExecuted);
    }
    const runData = executionData?.runData ?? {};
    const runDataNodeNames = Object.keys(runData);
    if (runDataNodeNames.length === 0) {
        return NO_EXECUTION_STATUS;
    }
    const activeNodeNames = (workflowNodes ?? []).filter((n) => !n.disabled).map((n) => n.name);
    const nodesNotExecuted = activeNodeNames.filter((name) => !runDataNodeNames.includes(name));
    const nodesWithEmptyOutput = runDataNodeNames.filter((nodeName) => {
        const nodeData = runData?.[nodeName];
        if (!nodeData || nodeData.length === 0)
            return false;
        const itemCount = countNodeOutputItems(runData, nodeName);
        return itemCount === 0;
    });
    if (nodesNotExecuted.length > 0 || nodesWithEmptyOutput.length > 0) {
        const dataFlow = buildDataFlowString(runData, runDataNodeNames);
        return buildIssuesStatus(dataFlow, nodesNotExecuted, nodesWithEmptyOutput);
    }
    return SUCCESS_STATUS;
}
function buildSelectedNodesContextBlock(workflowContext) {
    const selectedNodes = workflowContext?.selectedNodes;
    if (!selectedNodes || selectedNodes.length === 0)
        return '';
    const parts = [];
    parts.push('<selected_nodes>');
    parts.push('The user has explicitly selected the following node(s) for you to focus on.');
    parts.push('When the user says "this node", "it", "this", or similar deictic references, they refer to these selected nodes.');
    parts.push('Look up full node details (type, parameters) by matching the name in <current_workflow_json>.');
    parts.push('');
    for (const node of selectedNodes) {
        parts.push(`<node name="${escapeXmlAttr(node.name)}">`);
        if (node.issues && Object.keys(node.issues).length > 0) {
            parts.push('  <issues>');
            for (const [param, issues] of Object.entries(node.issues)) {
                for (const issue of issues) {
                    parts.push(`    <issue parameter="${escapeXmlAttr(param)}">${escapeXmlContent(issue)}</issue>`);
                }
            }
            parts.push('  </issues>');
        }
        if (node.incomingConnections.length > 0) {
            parts.push(`  <incoming_connections>${node.incomingConnections.map(escapeXmlContent).join(', ')}</incoming_connections>`);
        }
        if (node.outgoingConnections.length > 0) {
            parts.push(`  <outgoing_connections>${node.outgoingConnections.map(escapeXmlContent).join(', ')}</outgoing_connections>`);
        }
        parts.push('</node>');
        parts.push('');
    }
    parts.push('</selected_nodes>');
    return parts.join('\n');
}
function buildSelectedNodesSummary(workflowContext) {
    const selectedNodes = workflowContext?.selectedNodes;
    if (!selectedNodes || selectedNodes.length === 0)
        return '';
    const nodeList = selectedNodes.map((n) => `- "${n.name}"`).join('\n');
    const hasIssues = selectedNodes.some((n) => n.issues && Object.keys(n.issues).length > 0);
    let summary = `User has ${selectedNodes.length} node(s) selected:\n${nodeList}`;
    if (hasIssues) {
        summary += '\nNote: Some selected nodes have configuration issues.';
    }
    return summary;
}
function escapeXmlAttr(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escapeXmlContent(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function createContextMessage(contextParts) {
    return new messages_1.HumanMessage({ content: contextParts.filter(Boolean).join('\n\n') });
}
//# sourceMappingURL=context-builders.js.map