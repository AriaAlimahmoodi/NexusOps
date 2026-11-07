"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executionToMessagesDto = executionToMessagesDto;
exports.executionsToMessagesDto = executionsToMessagesDto;
const is_record_1 = require("@n8n/utils/is-record");
const fatal_session_outcome_1 = require("./fatal-session-outcome");
function textPart(text) {
    if (!text.trim())
        return null;
    return { type: 'text', text };
}
function toolCallState(event) {
    if (typeof event.endTime !== 'number' || event.endTime <= 0)
        return undefined;
    return event.success ? 'resolved' : 'rejected';
}
function isToolCallWithId(part) {
    return part.type === 'tool-call' && typeof part.toolCallId === 'string' && part.toolCallId !== '';
}
function isTerminalToolCallPart(part) {
    return (part.state === 'resolved' ||
        part.state === 'rejected' ||
        part.canceled === true ||
        part.output !== undefined ||
        part.error !== undefined);
}
function mergeTerminalToolCallPart(previous, terminal) {
    return {
        ...previous,
        ...terminal,
        input: previous.input ?? terminal.input,
        suspendPayload: previous.suspendPayload ?? terminal.suspendPayload,
        startTime: previous.startTime ?? terminal.startTime,
        endTime: terminal.endTime ?? previous.endTime,
        canceled: terminal.canceled ?? previous.canceled,
    };
}
function toolErrorMessage(output) {
    if (typeof output === 'string' && output.trim())
        return output;
    if ((0, is_record_1.isRecord)(output)) {
        const message = output.message;
        if (typeof message === 'string' && message.trim())
            return message;
        const error = output.error;
        if (typeof error === 'string' && error.trim())
            return error;
    }
    if (output === undefined || output === null)
        return undefined;
    try {
        return JSON.stringify(output);
    }
    catch {
        return String(output);
    }
}
function timelineToolCallToPart(event) {
    const state = toolCallState(event);
    const base = {
        type: 'tool-call',
        toolName: event.name,
        toolCallId: event.toolCallId,
        input: event.input,
        ...(event.startTime > 0 ? { startTime: event.startTime } : {}),
        ...(event.endTime > 0 ? { endTime: event.endTime } : {}),
        ...(event.childTrace ? { childTrace: event.childTrace } : {}),
    };
    if (state === undefined)
        return base;
    if (state === 'resolved') {
        return {
            ...base,
            state,
            output: event.output,
        };
    }
    return {
        ...base,
        state,
        error: toolErrorMessage(event.output) ?? `Tool "${event.name}" failed`,
    };
}
function assistantContentFromExecution(execution) {
    const content = [];
    for (const event of execution.timeline ?? []) {
        if (event.type === 'text') {
            const part = textPart(event.content);
            if (!part)
                continue;
            content.push(part);
        }
        else if (event.type === 'reasoning') {
            if (!event.content.trim())
                continue;
            content.push({
                type: 'reasoning',
                text: event.content,
                startTime: event.timestamp,
                ...(event.endTime !== undefined && { endTime: event.endTime }),
            });
        }
        else if (event.type === 'tool-call') {
            content.push(timelineToolCallToPart(event));
        }
        else if (event.type === 'suspension') {
            const suspendedToolCall = [...content]
                .reverse()
                .find((part) => isToolCallWithId(part) && part.toolCallId === event.toolCallId);
            if (suspendedToolCall) {
                suspendedToolCall.suspendPayload = event.suspendPayload ?? event.input;
            }
        }
    }
    return content;
}
function executionToMessagesDto(execution) {
    if (!execution.timeline?.some((event) => event.type === 'input')) {
        return executionSegmentToMessagesDto(execution);
    }
    const messages = [];
    const steeredIds = new Set(execution.timeline.filter((event) => event.type === 'input').map((event) => event.messageId));
    let segment = {
        ...execution,
        inputMessages: execution.inputMessages?.filter(({ id }) => !steeredIds.has(id)),
        timeline: [],
    };
    let suffix = '';
    const appendSegment = (value) => {
        for (const message of executionSegmentToMessagesDto(value)) {
            if (message.role === 'assistant')
                message.id += suffix;
            messages.push(message);
        }
    };
    for (const event of execution.timeline) {
        if (event.type !== 'input') {
            segment.timeline?.push(event);
            continue;
        }
        appendSegment({ ...segment, status: 'success', error: null });
        const input = execution.inputMessages?.find(({ id }) => id === event.messageId);
        if (input)
            messages.push({ ...input, executionId: execution.id });
        suffix = `:${event.messageId}`;
        segment = {
            ...execution,
            userMessage: null,
            attachments: null,
            author: null,
            inputMessages: [],
            timeline: [],
            createdAt: new Date(event.timestamp),
        };
    }
    appendSegment(segment);
    return messages;
}
function executionSegmentToMessagesDto(execution) {
    const messages = [];
    const userContent = [];
    const userText = execution.userMessage === null ? null : textPart(execution.userMessage);
    const createdAt = execution.createdAt.toISOString();
    if (userText)
        userContent.push(userText);
    for (const attachment of execution.attachments ?? []) {
        userContent.push({
            type: 'file',
            fileId: attachment.id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
        });
    }
    if (execution.inputMessages !== undefined) {
        messages.push(...execution.inputMessages);
    }
    else if (userContent.length > 0) {
        messages.push({
            id: `${execution.id}:user`,
            role: 'user',
            content: userContent,
            ...(execution.author ? { author: execution.author } : {}),
            executionId: execution.id,
            createdAt,
        });
    }
    const backgroundJobSignal = execution.timeline?.find((event) => event.type === 'background-task-signal')?.signal;
    const assistantContent = assistantContentFromExecution(execution);
    const executionError = (execution.status === 'error' || execution.status === 'interrupted') &&
        execution.error &&
        !(0, fatal_session_outcome_1.isFatalSessionOutcomeError)(execution.error, execution.timeline)
        ? execution.error
        : undefined;
    if (backgroundJobSignal || assistantContent.length > 0 || executionError !== undefined) {
        messages.push({
            id: `${execution.id}:assistant`,
            role: 'assistant',
            content: assistantContent,
            ...(backgroundJobSignal ? { backgroundTaskSignal: backgroundJobSignal } : {}),
            executionId: execution.id,
            ...(execution.status ? { executionStatus: execution.status } : {}),
            ...(executionError !== undefined ? { executionError } : {}),
            createdAt,
        });
    }
    return messages;
}
function executionsToMessagesDto(executions) {
    const messages = executions.flatMap(executionToMessagesDto);
    const firstToolCallById = new Map();
    const duplicatePartIndexesByMessage = new Map();
    for (const message of messages) {
        for (const [partIndex, part] of message.content.entries()) {
            if (!isToolCallWithId(part))
                continue;
            const first = firstToolCallById.get(part.toolCallId);
            if (!first) {
                firstToolCallById.set(part.toolCallId, { message, partIndex });
                continue;
            }
            const firstPart = first.message.content[first.partIndex];
            if (!isToolCallWithId(firstPart))
                continue;
            if (isTerminalToolCallPart(part)) {
                first.message.content[first.partIndex] = mergeTerminalToolCallPart(firstPart, part);
                const indexes = duplicatePartIndexesByMessage.get(message) ?? new Set();
                indexes.add(partIndex);
                duplicatePartIndexesByMessage.set(message, indexes);
            }
            else if (isTerminalToolCallPart(firstPart)) {
                const indexes = duplicatePartIndexesByMessage.get(message) ?? new Set();
                indexes.add(partIndex);
                duplicatePartIndexesByMessage.set(message, indexes);
            }
        }
    }
    for (const [message, duplicateIndexes] of duplicatePartIndexesByMessage) {
        message.content = message.content.filter((_, index) => !duplicateIndexes.has(index));
    }
    return messages.filter((message) => message.backgroundTaskSignal ||
        message.content.length > 0 ||
        message.executionError !== undefined);
}
//# sourceMappingURL=execution-to-message-mapper.js.map