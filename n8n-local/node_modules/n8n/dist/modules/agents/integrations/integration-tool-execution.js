"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEGRATION_ACTION_RESUME_SCHEMA = void 0;
exports.isSilentActionOutput = isSilentActionOutput;
exports.integrationActionApprovalKey = integrationActionApprovalKey;
exports.executeContextToolOperation = executeContextToolOperation;
exports.executeActionToolBatch = executeActionToolBatch;
exports.executeActionToolOperation = executeActionToolOperation;
const agents_1 = require("@n8n/agents");
const is_record_1 = require("@n8n/utils/is-record");
const zod_1 = require("zod");
const agent_memory_scope_1 = require("../utils/agent-memory-scope");
const integration_tool_definitions_1 = require("./integration-tool-definitions");
const integration_error_codes_1 = require("./integration-error-codes");
const integration_message_context_1 = require("./integration-message-context");
exports.INTEGRATION_ACTION_RESUME_SCHEMA = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
function isSilentActionOutput(output) {
    if (!(0, is_record_1.isRecord)(output))
        return false;
    if (output.silent === true)
        return true;
    return (Array.isArray(output.results) &&
        output.results.some((entry) => (0, is_record_1.isRecord)(entry) &&
            entry.action === 'do_not_respond' &&
            (0, is_record_1.isRecord)(entry.result) &&
            entry.result.ok === true &&
            entry.result.silent === true));
}
function integrationActionApprovalKey(connectionId, action) {
    return JSON.stringify(['integration_action', connectionId, action]);
}
async function executeContextToolOperation(params) {
    const { operation, descriptor, queryExecutor, persistence } = params;
    if (isCurrentContextQuery(operation.query)) {
        if (!persistence) {
            return {
                ok: false,
                error: {
                    code: integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_THREAD_CONTEXT,
                    message: 'There is no current agent thread context.',
                },
            };
        }
        const context = (0, integration_message_context_1.readIntegrationMessageContext)(persistence);
        if (!context || context.integrationConnectionId !== descriptor.integrationConnectionId) {
            if (operation.query === 'get_current_message_context') {
                return { ok: true, context: null };
            }
            if (operation.query === 'get_current_subject') {
                return { ok: true, subject: null };
            }
            return {
                ok: false,
                error: {
                    code: integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT,
                    message: 'There is no current message context for this integration connection.',
                },
            };
        }
        if (operation.query === 'get_current_message_context') {
            return { ok: true, context };
        }
        if (operation.query === 'get_current_subject') {
            return { ok: true, subject: context.subject ?? null };
        }
        if (operation.query === 'get_current_user') {
            if (!context.interactingUserId) {
                return {
                    ok: false,
                    error: {
                        code: integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_INTERACTING_USER_CONTEXT,
                        message: 'The latest message context does not include an interacting user ID.',
                    },
                };
            }
            return await queryExecutor.execute({
                descriptor,
                query: 'get_user',
                input: { userId: context.interactingUserId },
                persistence,
            });
        }
        const channelId = getTargetChannelId(context.target);
        if (!channelId) {
            return {
                ok: false,
                error: {
                    code: integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_CHANNEL_CONTEXT,
                    message: 'The latest message context does not include a channel ID.',
                },
            };
        }
        return await queryExecutor.execute({
            descriptor,
            query: 'get_channel_info',
            input: { channelId },
            persistence,
        });
    }
    return await queryExecutor.execute({
        descriptor,
        query: operation.query,
        input: operation.input,
        persistence,
    });
}
async function executeActionToolBatch(params) {
    const { operations, descriptor, messageContextStore, actionExecutor, ctx } = params;
    let currentMessageContext = getOptionalCurrentContext({
        descriptor,
        persistence: ctx.persistence,
    });
    const results = [];
    for (const operation of operations) {
        const result = await executeActionToolOperation({
            operation,
            descriptor,
            messageContextStore,
            actionExecutor,
            ctx,
            currentMessageContext,
            allowSuspend: false,
        });
        const nextMessageContext = extractSuccessfulMessageContext(result);
        if (nextMessageContext)
            currentMessageContext = nextMessageContext;
        results.push({ action: operation.action, result });
    }
    return { ok: true, results };
}
async function executeActionToolOperation(params) {
    const { operation, descriptor, messageContextStore, actionExecutor, ctx, interruptCtx, allowSuspend, approvedAction, } = params;
    const persistence = ctx.persistence;
    const message = parseMessage(operation.input.message);
    const actionInput = message === undefined ? operation.input : { ...operation.input, message };
    const awaitsResponse = shouldAwaitResponse(message);
    if (awaitsResponse && !allowSuspend) {
        return {
            ok: false,
            error: {
                code: integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_FAILED,
                message: 'Batch actions cannot include cards that wait for a user response. Send that action separately.',
            },
        };
    }
    const needsApproval = operation.action !== approvedAction &&
        (0, integration_tool_definitions_1.actionNeedsApproval)(descriptor.approval, operation.action) &&
        !ctx.approvalContext?.approvedKeys.has(integrationActionApprovalKey(descriptor.integrationConnectionId, operation.action));
    if (needsApproval) {
        if (!allowSuspend || !interruptCtx) {
            return {
                ok: false,
                error: {
                    code: integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_NEEDS_APPROVAL,
                    message: `The action "${operation.action}" needs approval, which cannot be asked for here. Send that action on its own.`,
                },
            };
        }
        return await interruptCtx.suspend({
            type: 'approval',
            toolName: operation.action,
            ...(ctx.approvalContext ? { supportsSessionApproval: true } : {}),
            displayName: describeActionForApproval(operation),
            args: ctx.approvalContext?.getDisplayArgs
                ? ctx.approvalContext.getDisplayArgs(descriptor.actionToolName, actionInput)
                : actionInput,
        }, { resumeSchema: agents_1.APPROVAL_RESUME_SCHEMA });
    }
    let currentMessageContext = params.currentMessageContext;
    if (operation.action === 'respond') {
        if (!currentMessageContext) {
            const contextResult = getRespondContext({ descriptor, persistence });
            if (!contextResult.ok) {
                return contextResult;
            }
            currentMessageContext = contextResult.context;
        }
    }
    else if (!currentMessageContext && persistence) {
        currentMessageContext = getOptionalCurrentContext({ descriptor, persistence });
    }
    const result = await actionExecutor.execute({
        descriptor,
        action: operation.action,
        input: actionInput,
        awaitResponse: awaitsResponse,
        runId: ctx.runId,
        toolCallId: ctx.toolCallId,
        currentMessageContext,
    });
    if (!result.ok)
        return result;
    let actionResult = result;
    if (result.messageContext && persistence) {
        const messageContext = withPreviousSubject(result.messageContext, currentMessageContext);
        await messageContextStore.setLatest(persistence.threadId, persistence.resourceId, messageContext);
        (0, integration_message_context_1.replaceIntegrationMessageContext)(persistence, messageContext);
        if ((operation.action === 'send_dm' || operation.action === 'send_channel_message') &&
            descriptor.agentId &&
            messageContext.target.threadId &&
            (0, agent_memory_scope_1.isTaskRunMemoryResourceId)(persistence.resourceId)) {
            await messageContextStore.bindSession(`${descriptor.agentId}:${messageContext.target.threadId}`, { threadId: persistence.threadId, resourceId: persistence.resourceId });
        }
        actionResult = { ...result, messageContext };
    }
    if (!awaitsResponse)
        return actionResult;
    return await interruptCtx?.suspend({
        type: 'integration_action',
        action: operation.action,
        integrationConnectionId: descriptor.integrationConnectionId,
        messageContext: actionResult.messageContext,
    }, { resumeSchema: exports.INTEGRATION_ACTION_RESUME_SCHEMA });
}
function describeActionForApproval(operation) {
    const { channelId, userId, messageId, issueId } = operation.input;
    const target = [channelId, userId, messageId, issueId].find((value) => typeof value === 'string' && value.length > 0);
    return target ? `${operation.action} → ${String(target)}` : operation.action;
}
function isCurrentContextQuery(query) {
    return (query === 'get_current_message_context' ||
        query === 'get_current_subject' ||
        query === 'get_current_user' ||
        query === 'get_current_channel_info');
}
function parseMessage(value) {
    const result = integration_tool_definitions_1.messageSchema.safeParse(value);
    return result.success ? result.data : undefined;
}
function shouldAwaitResponse(message) {
    const card = message?.card;
    if (card?.awaitResponse === true)
        return true;
    return card?.components.some(isInteractiveCardComponent) ?? false;
}
function isInteractiveCardComponent(component) {
    switch (component.type) {
        case 'button':
        case 'select':
        case 'radio_select':
            return true;
        case 'section':
            return component.button !== undefined;
        default:
            return false;
    }
}
function withPreviousSubject(context, previousContext) {
    if (!previousContext)
        return context;
    if (context.integrationConnectionId !== previousContext.integrationConnectionId)
        return context;
    const replyExpectation = context.replyExpectation ?? previousContext.replyExpectation;
    const replyTarget = context.replyTarget ??
        previousContext.replyTarget ??
        (replyExpectation ? previousContext.target : undefined);
    const replyMessageId = context.replyMessageId ??
        previousContext.replyMessageId ??
        (replyExpectation ? previousContext.messageId : undefined);
    return {
        ...context,
        ...(!context.subject && previousContext.subject ? { subject: previousContext.subject } : {}),
        ...(!context.agentUserId && previousContext.agentUserId
            ? { agentUserId: previousContext.agentUserId }
            : {}),
        ...(replyExpectation ? { replyExpectation } : {}),
        ...(replyTarget ? { replyTarget } : {}),
        ...(replyMessageId ? { replyMessageId } : {}),
    };
}
function extractSuccessfulMessageContext(result) {
    if (!(0, is_record_1.isRecord)(result) || result.ok !== true)
        return undefined;
    const messageContext = result.messageContext;
    return (0, integration_message_context_1.isIntegrationMessageContext)(messageContext) ? messageContext : undefined;
}
function getOptionalCurrentContext(params) {
    const context = (0, integration_message_context_1.readIntegrationMessageContext)(params.persistence);
    return context?.integrationConnectionId === params.descriptor.integrationConnectionId
        ? context
        : undefined;
}
function getRespondContext(params) {
    const { descriptor, persistence } = params;
    if (!persistence) {
        return {
            ok: false,
            error: {
                code: integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT,
                message: 'There is no current message context. Use an explicit send action.',
            },
        };
    }
    const context = (0, integration_message_context_1.readIntegrationMessageContext)(persistence);
    if (!context) {
        return {
            ok: false,
            error: {
                code: integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT,
                message: 'There is no current message context. Use an explicit send action.',
            },
        };
    }
    if (context.integrationConnectionId !== descriptor.integrationConnectionId) {
        return {
            ok: false,
            error: {
                code: integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT_FOR_INTEGRATION,
                message: 'The latest message context belongs to another integration connection.',
            },
        };
    }
    return { ok: true, context };
}
function getTargetChannelId(target) {
    if (target.type === 'thread' || target.type === 'channel') {
        return target.channelId;
    }
    return undefined;
}
//# sourceMappingURL=integration-tool-execution.js.map