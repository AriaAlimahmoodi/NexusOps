"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChatStreamConsumer = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const agent_chat_suspension_cards_1 = require("./agent-chat-suspension-cards");
const channel_rate_limit_1 = require("./channel-rate-limit");
const integration_tool_execution_1 = require("./integration-tool-execution");
const createResponseState = (options) => ({
    hasVisibleResponse: false,
    suppressText: false,
    fallbackSource: null,
    fallbackError: null,
    quietErrors: options.quietErrors === true,
});
const BUDGET_STOP_TEXT = {
    'budget.session': '⚠️ This session reached its cost cap and stopped. Open the agent in n8n and increase the cap.',
    'budget.monthly': '⚠️ This agent reached its monthly budget and stopped. Open the agent in n8n and increase the cap.',
};
function budgetStopText(code) {
    if (code === 'budget.session' || code === 'budget.monthly')
        return BUDGET_STOP_TEXT[code];
    return undefined;
}
class AgentChatStreamConsumer {
    constructor(options) {
        this.options = options;
    }
    async consume(stream, thread, options = {}) {
        stream = this.separateTextSteps(stream);
        if (this.options.disableStreaming || options.forceBuffered || options.throwOnDeliveryError) {
            await this.consumeBuffered(stream, thread, options);
            return;
        }
        const textStream = {
            yield: null,
            end: null,
        };
        let streamingPost = null;
        let pendingText = '';
        let streamingStopped = false;
        const retainText = this.options.singleStreamedRunPerTurn === true;
        let streamingPostRejected = false;
        let streamingPostError;
        const createTextIterable = () => {
            const queue = [];
            let done = false;
            let waiting = null;
            textStream.yield = (text) => {
                if (waiting) {
                    const resolve = waiting;
                    waiting = null;
                    resolve({ value: text, done: false });
                }
                else {
                    queue.push(text);
                }
            };
            textStream.end = () => {
                done = true;
                if (waiting) {
                    const resolve = waiting;
                    waiting = null;
                    resolve({ value: '', done: true });
                }
            };
            return {
                [Symbol.asyncIterator]() {
                    return {
                        async next() {
                            if (queue.length > 0) {
                                return { value: queue.shift(), done: false };
                            }
                            if (done) {
                                return { value: '', done: true };
                            }
                            return await new Promise((resolve) => {
                                waiting = resolve;
                            });
                        },
                    };
                },
            };
        };
        const startStreamingPost = () => {
            const iterable = createTextIterable();
            streamingPostRejected = false;
            streamingPostError = undefined;
            streamingPost = thread.post(iterable).catch((postError) => {
                streamingPostRejected = true;
                streamingPostError = postError;
                this.options.logger.error('[AgentChatBridge] Streaming post failed', {
                    error: postError instanceof Error ? postError.message : String(postError),
                });
            });
        };
        const endStreamingPost = async () => {
            if (textStream.end) {
                textStream.end();
                textStream.end = null;
                textStream.yield = null;
            }
            if (streamingPost) {
                const post = streamingPost;
                streamingPost = null;
                if (this.options.singleStreamedRunPerTurn)
                    streamingStopped = true;
                await post;
                if (!streamingPostRejected) {
                    pendingText = '';
                }
                else if (!pendingText.trim()) {
                    await this.postError(thread, streamingPostError, responseState);
                }
            }
            const text = pendingText;
            pendingText = '';
            if (text.trim())
                await this.postBufferedText(thread, text, responseState);
        };
        const ensureStreamingPost = () => {
            if (streamingStopped)
                return;
            if (!streamingPost)
                startStreamingPost();
        };
        const responseLifecycle = this.createResponseLifecycle({
            statusHandle: options.statusHandle,
            ensureStreamingPost,
            endStreamingPost,
        });
        const responseState = createResponseState(options);
        let budgetStop;
        try {
            for await (const chunk of stream) {
                switch (chunk.type) {
                    case 'text-delta': {
                        if (responseState.suppressText)
                            break;
                        const { delta } = chunk;
                        if (!delta.trim() && !responseState.hasVisibleResponse)
                            break;
                        await responseLifecycle.startStreamingResponse();
                        if (retainText)
                            pendingText += delta;
                        textStream.yield?.(delta);
                        if (delta.trim())
                            responseState.hasVisibleResponse = true;
                        break;
                    }
                    case 'tool-call-suspended': {
                        await responseLifecycle.startDiscreteResponse();
                        const result = await this.options.handleSuspension(chunk, thread, options.actingUserId);
                        responseState.hasVisibleResponse ||= result === 'posted';
                        if (result === 'failed') {
                            responseState.fallbackSource = 'suspension';
                            responseState.fallbackError = new Error('Failed to post tool approval request');
                        }
                        break;
                    }
                    case 'message':
                        await responseLifecycle.startDiscreteResponse();
                        responseState.hasVisibleResponse ||= await this.options.handleMessage(chunk, thread);
                        break;
                    case 'error':
                        await responseLifecycle.startDiscreteResponse();
                        await this.postError(thread, chunk.error, responseState);
                        responseState.hasVisibleResponse = true;
                        break;
                    case 'tool-result':
                        this.noteToolResult(chunk, responseState);
                        if (this.isSilentOutcome(chunk)) {
                            responseState.suppressText = true;
                            pendingText = '';
                        }
                        break;
                    case 'finish':
                        budgetStop ??= budgetStopText(chunk.guardrail?.code);
                        break;
                    default:
                        break;
                }
            }
            if (budgetStop !== undefined) {
                await this.postBudgetStop(thread, budgetStop, responseState, responseLifecycle);
            }
            else {
                await this.postFallbackIfNeeded(responseState, responseLifecycle, thread);
            }
        }
        finally {
            await responseLifecycle.finish();
        }
    }
    async *separateTextSteps(stream) {
        let hasText = false;
        let needsSeparator = false;
        for await (const chunk of stream) {
            if (chunk.type === 'text-delta' && chunk.delta) {
                yield hasText && needsSeparator ? { ...chunk, delta: `\n\n${chunk.delta}` } : chunk;
                hasText ||= chunk.delta.trim().length > 0;
                needsSeparator = false;
                continue;
            }
            if (chunk.type === 'finish-step') {
                needsSeparator = true;
            }
            else if (chunk.type === 'message' ||
                chunk.type === 'tool-call-suspended' ||
                chunk.type === 'error') {
                hasText = false;
                needsSeparator = false;
            }
            yield chunk;
        }
    }
    async postBufferedText(thread, text, state, throwOnDeliveryError = false) {
        try {
            await thread.post({ markdown: text });
        }
        catch (postError) {
            this.options.logger.error('[AgentChatBridge] Buffered post failed', {
                error: postError instanceof Error ? postError.message : String(postError),
            });
            if (throwOnDeliveryError)
                throw postError;
            await this.postError(thread, postError, state);
        }
    }
    async postBudgetStop(thread, text, state, lifecycle, throwOnDeliveryError = false) {
        await lifecycle.startDiscreteResponse();
        await this.postBufferedText(thread, text, state, throwOnDeliveryError);
        state.hasVisibleResponse = true;
    }
    async postError(thread, error, state, throwOnDeliveryError) {
        if (state.quietErrors) {
            this.options.logger.warn('[AgentChatBridge] Error in a turn whose reply was optional', {
                threadId: thread.id,
                error: error instanceof Error ? error.message : String(error),
            });
            return;
        }
        await this.options.postErrorToThread(thread, error, throwOnDeliveryError);
    }
    noteToolResult(chunk, state) {
        if ((0, channel_rate_limit_1.isRateLimitedToolOutput)(chunk.output)) {
            state.fallbackSource = 'rate-limit';
            state.fallbackError = chunk.output;
            return;
        }
        if (chunk.isError) {
            state.fallbackSource = 'tool-error';
            state.fallbackError = chunk.output;
            return;
        }
        if (state.fallbackSource === 'tool-error') {
            state.fallbackSource = null;
        }
    }
    isSilentOutcome(chunk) {
        if (chunk.isError || !(this.options.isIntegrationActionTool?.(chunk.toolName) ?? false)) {
            return false;
        }
        return (0, integration_tool_execution_1.isSilentActionOutput)(chunk.output);
    }
    createResponseLifecycle(options) {
        let responseStarted = false;
        const clearStatusBeforeFirstResponse = async () => {
            if (responseStarted)
                return;
            responseStarted = true;
            await options.statusHandle?.clearBeforeResponse();
        };
        return {
            startStreamingResponse: async () => {
                await clearStatusBeforeFirstResponse();
                options.ensureStreamingPost?.();
            },
            startDiscreteResponse: async () => {
                await options.endStreamingPost?.();
                await clearStatusBeforeFirstResponse();
            },
            finish: async () => {
                await options.endStreamingPost?.();
                await clearStatusBeforeFirstResponse();
            },
        };
    }
    async postFallbackIfNeeded(state, lifecycle, thread, throwOnDeliveryError = false) {
        if (!state.fallbackSource)
            return;
        if (state.fallbackSource === 'tool-error' && state.hasVisibleResponse)
            return;
        await lifecycle.startDiscreteResponse();
        await this.postError(thread, state.fallbackError, state, throwOnDeliveryError);
        state.hasVisibleResponse = true;
    }
    async consumeBuffered(stream, thread, options = {}) {
        let buffer = '';
        const responseState = createResponseState(options);
        const responseLifecycle = this.createResponseLifecycle({
            statusHandle: options.statusHandle,
        });
        const flushBuffer = async () => {
            const text = buffer;
            buffer = '';
            if (!text.trim())
                return;
            await responseLifecycle.startDiscreteResponse();
            await this.postBufferedText(thread, text, responseState, options.throwOnDeliveryError);
            responseState.hasVisibleResponse = true;
        };
        let budgetStop;
        try {
            for await (const chunk of stream) {
                switch (chunk.type) {
                    case 'text-delta':
                        if (!responseState.suppressText)
                            buffer += chunk.delta;
                        break;
                    case 'tool-call-suspended': {
                        if ((0, agent_chat_suspension_cards_1.isIntegrationActionSuspendPayload)(chunk.suspendPayload)) {
                            buffer = '';
                        }
                        else {
                            await flushBuffer();
                        }
                        await responseLifecycle.startDiscreteResponse();
                        const result = await this.options.handleSuspension(chunk, thread, options.actingUserId);
                        responseState.hasVisibleResponse ||= result === 'posted';
                        if (result === 'failed') {
                            if (options.throwOnDeliveryError) {
                                throw new n8n_workflow_1.OperationalError('Failed to post tool approval request');
                            }
                            responseState.fallbackSource = 'suspension';
                            responseState.fallbackError = new Error('Failed to post tool approval request');
                        }
                        break;
                    }
                    case 'message': {
                        await flushBuffer();
                        await responseLifecycle.startDiscreteResponse();
                        const posted = await this.options.handleMessage(chunk, thread, options.throwOnDeliveryError);
                        responseState.hasVisibleResponse ||= posted;
                        break;
                    }
                    case 'error':
                        await flushBuffer();
                        await responseLifecycle.startDiscreteResponse();
                        await this.postError(thread, chunk.error, responseState, options.throwOnDeliveryError);
                        responseState.hasVisibleResponse = true;
                        break;
                    case 'tool-result':
                        this.noteToolResult(chunk, responseState);
                        if (this.isSilentOutcome(chunk)) {
                            responseState.suppressText = true;
                            buffer = '';
                        }
                        break;
                    case 'finish':
                        budgetStop ??= budgetStopText(chunk.guardrail?.code);
                        break;
                    default:
                        break;
                }
            }
            await flushBuffer();
            if (budgetStop !== undefined) {
                await this.postBudgetStop(thread, budgetStop, responseState, responseLifecycle, options.throwOnDeliveryError);
            }
            else {
                await this.postFallbackIfNeeded(responseState, responseLifecycle, thread, options.throwOnDeliveryError);
            }
        }
        finally {
            await flushBuffer();
            await responseLifecycle.finish();
        }
    }
}
exports.AgentChatStreamConsumer = AgentChatStreamConsumer;
//# sourceMappingURL=agent-chat-stream-consumer.js.map