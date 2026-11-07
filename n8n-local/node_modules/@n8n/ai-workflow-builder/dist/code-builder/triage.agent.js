"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageAgent = void 0;
const messages_1 = require("@langchain/core/messages");
const content_extractors_1 = require("../code-builder/utils/content-extractors");
const constants_1 = require("../constants");
const builder_1 = require("../prompts/builder");
const context_builders_1 = require("../utils/context-builders");
const ask_assistant_tool_1 = require("./tools/ask-assistant.tool");
const build_workflow_tool_1 = require("./tools/build-workflow.tool");
function conversationEntryToString(entry) {
    switch (entry.type) {
        case 'build-request':
            return entry.message;
        case 'assistant-exchange':
            return `[Help] Q: ${entry.userQuery} → A: ${entry.assistantSummary}`;
        case 'plan':
            return `[Plan] Q: ${entry.userQuery} → ${entry.plan}`;
    }
}
function buildTriagePrompt(conversationHistory, workflowContext) {
    const selectedNodesSummary = (0, context_builders_1.buildSelectedNodesSummary)(workflowContext);
    const currentWorkflow = workflowContext?.currentWorkflow;
    const workflowNodes = currentWorkflow?.nodes ?? [];
    const hasWorkflow = workflowNodes.length > 0;
    const workflowSummary = hasWorkflow
        ? (0, context_builders_1.buildWorkflowSummary)({
            name: currentWorkflow?.name ?? '',
            nodes: workflowNodes,
            connections: currentWorkflow?.connections ?? {},
        })
        : '';
    return (0, builder_1.prompt)()
        .section('role', 'You are a triage agent for the n8n workflow builder. ' +
        'Your job is to classify each user message and route it to the right handler.')
        .sectionIf(!!selectedNodesSummary, 'selected_nodes', () => selectedNodesSummary)
        .sectionIf(hasWorkflow, 'workflow_summary', () => workflowSummary)
        .section('routing', `Route each message using one or more of these:

1. **build_workflow** — The user wants to create, modify, configure, or change a workflow.
   This includes any action request: adding nodes, setting up nodes, configuring parameters,
   connecting nodes, or any instruction that implies "do this to my workflow".
   ALWAYS use build_workflow when the message contains a URL (http:// or https://) — the build
   process includes web_fetch to retrieve page contents, the assistant cannot. This applies whether
   the user asks to fetch the URL, references it as documentation, or provides it for context.
   You may include a brief transition before calling (e.g., "Let me build that for you.").

2. **ask_assistant** — The user has a pure knowledge question about n8n concepts, needs help
   understanding how something works, or needs to diagnose a workflow error.
   Only use this when the user is asking for information, NOT when they want you to take action.
   Never use for messages containing URLs — route those to build_workflow instead.
   You may include a brief transition before calling (e.g., "Let me look into that.").

3. **Direct reply** — Simple conversational messages that don't need either tool.
   Respond with helpful text directly.`)
        .section('rules', `Error handling:
- User reports error AND asks for a fix ("fix this error", "it's broken, fix it") → ask_assistant to diagnose, then build_workflow to apply the fix
- User asks WHY something failed (no fix request) → ask_assistant only
- User tells you exactly what to change ("increase timeout to 30s") → build_workflow directly, skip diagnosis
- User describes a vague symptom without requesting a fix ("something's wrong") → ask_assistant only, let user decide next step

General rules:
- For pure questions (no fix needed): call ask_assistant — its response will be shown directly to the user
- When in doubt between ask_assistant and build_workflow, prefer build_workflow for any message that implies changing the workflow
- Action-oriented language ("set it up", "configure this", "do it", "add that", "connect them", "now set them up") ALWAYS means build_workflow, even if "set up" could sound like a question. If the user is telling you to DO something, use build_workflow.
- Polite wrappers like "help me", "can you", "could you" followed by an action verb are action requests → build_workflow.
- When <selected_nodes> is present, resolve "this", "it", "that" to the selected node(s). With action verbs ("fix this", "change it") → build_workflow. With question words ("what is this?", "why is this failing?") → ask_assistant.
- When no nodes are selected, resolve references using conversation history and <workflow_summary>.
- Tool responses are shown directly to the user. After a tool completes, either call another tool or respond with an empty message. Never repeat, summarize, or rephrase tool output.
- Keep transition text before tool calls to one sentence maximum.`)
        .section('examples', `build_workflow: "Add a Slack node", "Configure the email settings", "Help me set up Gmail", "Can you fix the error?", "Fix the broken connection", "Set the timeout to 30 seconds", "Make it send to a different channel", "The timeout should be higher", "Check this: https://api.example.com/docs", "Here's the API reference: https://...", "https://docs.stripe.com/api", "Use this documentation https://..."
ask_assistant: "Why did my workflow fail?", "How do webhooks work?", "What's the difference between Set and Code?", "Explain this error", "How do I use expressions?", "This doesn't work" (diagnosis needed), "Something went wrong"`)
        .sectionIf(conversationHistory && conversationHistory.length > 0, 'conversation history', () => conversationHistory
        .map((entry, i) => `${i + 1}. ${conversationEntryToString(entry)}`)
        .join('\n'))
        .build();
}
class TriageAgent {
    llm;
    assistantHandler;
    buildWorkflow;
    logger;
    constructor(config) {
        this.llm = config.llm;
        this.assistantHandler = config.assistantHandler;
        this.buildWorkflow = config.buildWorkflow;
        this.logger = config.logger;
    }
    async *run(params) {
        const { payload, userId, abortSignal, sdkSessionId, conversationHistory } = params;
        if (!this.llm.bindTools) {
            throw new Error('LLM does not support bindTools');
        }
        const llmWithTools = this.llm.bindTools([ask_assistant_tool_1.ASK_ASSISTANT_TOOL, build_workflow_tool_1.BUILD_WORKFLOW_TOOL]);
        const systemContent = buildTriagePrompt(conversationHistory, payload.workflowContext);
        const messages = [
            new messages_1.SystemMessage(systemContent),
            new messages_1.HumanMessage(payload.message),
        ];
        const ctx = { userId, payload, abortSignal };
        const state = { sdkSessionId };
        let reachedMaxIterations = true;
        let responseHandled = false;
        for (let iteration = 0; iteration < constants_1.MAX_TRIAGE_ITERATIONS; iteration++) {
            const response = await llmWithTools.invoke(messages, {
                signal: abortSignal,
            });
            messages.push(response);
            const toolCalls = response.tool_calls ?? [];
            const text = (0, content_extractors_1.extractTextContent)(new messages_1.AIMessage({ content: response.content })) ?? '';
            if (text && (toolCalls.length > 0 || !responseHandled)) {
                yield this.wrapChunk({ role: 'assistant', type: 'message', text });
            }
            if (toolCalls.length === 0) {
                this.logger?.debug('[TriageAgent] No tool call, exiting loop', {
                    iteration: iteration + 1,
                });
                reachedMaxIterations = false;
                break;
            }
            for (const toolCall of toolCalls) {
                this.logger?.debug('[TriageAgent] Tool called', {
                    toolName: toolCall.name,
                    iteration: iteration + 1,
                });
                const toolCallId = toolCall.id ?? `tc-${iteration}`;
                const result = yield* this.executeToolWithStreaming(toolCall, ctx, state);
                if (result.handledResponse)
                    responseHandled = true;
                this.logger?.debug('[TriageAgent] Tool completed', {
                    toolName: toolCall.name,
                    iteration: iteration + 1,
                    endLoop: result.endLoop,
                });
                messages.push(new messages_1.ToolMessage({
                    tool_call_id: toolCallId,
                    content: result.content,
                }));
                if (result.endLoop) {
                    return this.getOutcome(state);
                }
            }
        }
        if (reachedMaxIterations) {
            this.logger?.warn('[TriageAgent] Max iterations reached');
        }
        return this.getOutcome(state);
    }
    async *executeToolWithStreaming(toolCall, ctx, state) {
        const queue = [];
        let resolveNext;
        let done = false;
        const enqueue = (output) => {
            queue.push(output);
            resolveNext?.();
        };
        const toolPromise = this.executeTool(toolCall, ctx, state, enqueue).finally(() => {
            done = true;
            resolveNext?.();
        });
        while (!done || queue.length > 0) {
            if (queue.length > 0) {
                yield queue.shift();
            }
            else if (!done) {
                await new Promise((resolve) => {
                    resolveNext = resolve;
                    if (queue.length > 0 || done) {
                        resolve();
                    }
                });
            }
        }
        return await toolPromise;
    }
    async executeTool(toolCall, ctx, state, enqueue) {
        switch (toolCall.name) {
            case 'ask_assistant': {
                const assistantToolCallId = `triage-ask-assistant-${Date.now()}`;
                enqueue(this.wrapChunk({
                    type: 'tool',
                    toolName: 'assistant',
                    toolCallId: assistantToolCallId,
                    displayTitle: 'Asking assistant',
                    status: 'running',
                }));
                const progressWriter = (chunk) => {
                    if (chunk.type === 'tool') {
                        enqueue(this.wrapChunk(chunk));
                    }
                };
                const currentWorkflow = ctx.payload.workflowContext?.currentWorkflow;
                const workflowJSON = currentWorkflow
                    ? {
                        name: currentWorkflow.name ?? '',
                        nodes: currentWorkflow.nodes ?? [],
                        connections: currentWorkflow.connections ?? {},
                    }
                    : undefined;
                const result = await this.assistantHandler.execute({
                    query: toolCall.args.query,
                    sdkSessionId: state.sdkSessionId,
                    workflowJSON,
                }, ctx.userId, progressWriter, ctx.abortSignal);
                const chunks = [
                    {
                        type: 'tool',
                        toolName: 'assistant',
                        toolCallId: assistantToolCallId,
                        status: 'completed',
                    },
                ];
                if (result.responseText) {
                    chunks.push({
                        role: 'assistant',
                        type: 'message',
                        text: result.responseText,
                    });
                }
                enqueue({ messages: chunks });
                state.sdkSessionId = result.sdkSessionId;
                state.assistantSummary = result.summary;
                return { content: result.summary, handledResponse: true };
            }
            case 'build_workflow': {
                const enrichedPayload = state.assistantSummary
                    ? {
                        ...ctx.payload,
                        message: `[Diagnosis]: ${state.assistantSummary}\n\n${ctx.payload.message}`,
                    }
                    : ctx.payload;
                for await (const chunk of this.buildWorkflow(enrichedPayload, ctx.userId, ctx.abortSignal)) {
                    enqueue(chunk);
                }
                state.buildExecuted = true;
                return { content: 'Workflow built.', endLoop: true, handledResponse: true };
            }
            default:
                this.logger?.warn('[TriageAgent] Unknown tool call', {
                    toolName: toolCall.name,
                });
                return { content: `Unknown tool: ${toolCall.name}` };
        }
    }
    getOutcome(state) {
        return {
            sdkSessionId: state.sdkSessionId,
            assistantSummary: state.assistantSummary,
            buildExecuted: state.buildExecuted,
        };
    }
    wrapChunk(chunk) {
        return { messages: [chunk] };
    }
}
exports.TriageAgent = TriageAgent;
//# sourceMappingURL=triage.agent.js.map