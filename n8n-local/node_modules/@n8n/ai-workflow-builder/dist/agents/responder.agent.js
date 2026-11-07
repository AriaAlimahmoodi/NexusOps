"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponderAgent = createResponderAgent;
exports.invokeResponderAgent = invokeResponderAgent;
const messages_1 = require("@langchain/core/messages");
const langchain_1 = require("langchain");
const zod_1 = require("zod");
const prompts_1 = require("../prompts");
const context_builders_1 = require("../utils/context-builders");
const coordination_log_1 = require("../utils/coordination-log");
const data_table_helpers_1 = require("../utils/data-table-helpers");
const introspect_tool_1 = require("../tools/introspect.tool");
const responderContextSchema = zod_1.z.object({
    coordinationLog: zod_1.z.array(zod_1.z.any()),
    discoveryContext: zod_1.z.any().optional().nullable(),
    workflowJSON: zod_1.z.any(),
    previousSummary: zod_1.z.string().optional(),
    workflowContext: zod_1.z.any().optional(),
});
function buildErrorContext(coordinationLog, nodeCount) {
    const errorEntry = (0, coordination_log_1.getErrorEntry)(coordinationLog);
    if (!errorEntry || (0, coordination_log_1.hasRecursionErrorsCleared)(coordinationLog))
        return [];
    const errorMessage = errorEntry.summary.toLowerCase();
    const isRecursionError = errorMessage.includes('recursion') ||
        errorMessage.includes('maximum number of steps') ||
        errorMessage.includes('iteration limit');
    if (!isRecursionError)
        return [];
    const parts = [
        `**Error:** An error occurred in the ${errorEntry.phase} phase: ${errorEntry.summary}`,
    ];
    const guidance = nodeCount > 0
        ? (0, prompts_1.buildRecursionErrorWithWorkflowGuidance)(nodeCount)
        : (0, prompts_1.buildRecursionErrorNoWorkflowGuidance)();
    parts.push(...guidance);
    return parts;
}
function buildFetchedUrlContentBlock(discoveryContext) {
    const items = discoveryContext?.fetchedUrlContent;
    if (!items?.length)
        return null;
    const lines = items.map((u) => `- ${u.url} (status: ${u.status}) ${u.title}`);
    return `**Fetched URL Content:**\n${lines.join('\n')}`;
}
function buildContextContent(context) {
    const contextParts = [];
    if (context.previousSummary) {
        contextParts.push(`**Previous Conversation Summary:**\n${context.previousSummary}`);
    }
    const stateManagementEntry = context.coordinationLog.find((e) => e.phase === 'state_management');
    if (stateManagementEntry) {
        contextParts.push(`**State Management:** ${stateManagementEntry.summary}`);
    }
    const selectedNodesBlock = (0, context_builders_1.buildSelectedNodesContextBlock)(context.workflowContext);
    if (selectedNodesBlock) {
        contextParts.push(`=== SELECTED NODES ===\n${selectedNodesBlock}`);
    }
    contextParts.push(...buildErrorContext(context.coordinationLog, context.workflowJSON.nodes.length));
    if (context.discoveryContext?.nodesFound.length) {
        contextParts.push(`**Discovery:** Found ${context.discoveryContext.nodesFound.length} relevant nodes`);
    }
    const fetchedContent = buildFetchedUrlContentBlock(context.discoveryContext);
    if (fetchedContent) {
        contextParts.push(fetchedContent);
    }
    const builderOutput = (0, coordination_log_1.getBuilderOutput)(context.coordinationLog);
    if (builderOutput) {
        contextParts.push(`**Builder:** ${builderOutput}`);
    }
    else if (context.workflowJSON.nodes.length) {
        contextParts.push(`**Workflow:**\n${(0, context_builders_1.buildWorkflowOverview)(context.workflowJSON)}`);
    }
    const dataTableInfo = (0, data_table_helpers_1.extractDataTableInfo)(context.workflowJSON);
    if (dataTableInfo.length > 0) {
        contextParts.push((0, prompts_1.buildDataTableCreationGuidance)(dataTableInfo));
    }
    if (context.workflowContext) {
        const executionStatus = (0, context_builders_1.buildSimplifiedExecutionContext)(context.workflowContext, context.workflowJSON.nodes);
        contextParts.push(`**Execution Status:**\n${executionStatus}`);
    }
    if (contextParts.length === 0)
        return null;
    return `[Internal Context - Use this to craft your response]\n${contextParts.join('\n\n')}`;
}
const contextInjectionMiddleware = (0, langchain_1.createMiddleware)({
    name: 'ResponderContextInjection',
    contextSchema: responderContextSchema,
    wrapModelCall: async (request, handler) => {
        const context = request.runtime.context;
        if (!context) {
            return await handler(request);
        }
        const responderContext = {
            messages: request.messages,
            coordinationLog: (context.coordinationLog ?? []),
            discoveryContext: context.discoveryContext,
            workflowJSON: (context.workflowJSON ?? { nodes: [], connections: {} }),
            previousSummary: context.previousSummary,
            workflowContext: context.workflowContext,
        };
        const contextContent = buildContextContent(responderContext);
        if (!contextContent) {
            return await handler(request);
        }
        const contextMessage = new messages_1.HumanMessage({ content: contextContent });
        return await handler({
            ...request,
            messages: [...request.messages, contextMessage],
        });
    },
});
function createResponderAgent(config) {
    const tools = config.enableIntrospection ? [(0, introspect_tool_1.createIntrospectTool)(config.logger).tool] : [];
    const systemPromptText = (0, prompts_1.buildResponderPrompt)({
        enableIntrospection: config.enableIntrospection,
    });
    const systemPrompt = new messages_1.SystemMessage({
        content: [
            {
                type: 'text',
                text: systemPromptText,
                cache_control: { type: 'ephemeral' },
            },
        ],
    });
    return (0, langchain_1.createAgent)({
        model: config.llm,
        tools,
        systemPrompt,
        middleware: [contextInjectionMiddleware],
        contextSchema: responderContextSchema,
    });
}
async function invokeResponderAgent(agent, context, config, options) {
    const result = await agent.invoke({ messages: context.messages }, {
        ...config,
        context: {
            coordinationLog: context.coordinationLog,
            discoveryContext: context.discoveryContext,
            workflowJSON: context.workflowJSON,
            previousSummary: context.previousSummary,
            workflowContext: context.workflowContext,
        },
    });
    const messages = result.messages;
    const introspectionEvents = options?.enableIntrospection
        ? (0, introspect_tool_1.extractIntrospectionEventsFromMessages)(messages)
        : [];
    const response = messages.length === 0
        ? new messages_1.AIMessage({
            content: 'I encountered an issue generating a response. Please try again.',
        })
        : messages[messages.length - 1];
    return { response, introspectionEvents };
}
//# sourceMappingURL=responder.agent.js.map