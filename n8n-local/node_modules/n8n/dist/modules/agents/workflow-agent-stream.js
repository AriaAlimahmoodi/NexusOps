"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowAgentStreamAdapter = void 0;
exports.createWorkflowAgentStreamObserver = createWorkflowAgentStreamObserver;
const agents_1 = require("@n8n/agents");
const is_record_1 = require("@n8n/utils/is-record");
function capabilityFor(toolName, input) {
    if (toolName !== agents_1.SKILL_LOAD_TOOL_NAME)
        return { kind: 'tool', name: toolName };
    if (!(0, is_record_1.isRecord)(input))
        return undefined;
    const id = typeof input.skillId === 'string' && input.skillId.length > 0 ? input.skillId : undefined;
    const name = typeof input.name === 'string' && input.name.length > 0 ? input.name : undefined;
    if (id)
        return { kind: 'skill', id, ...(name ? { name } : {}) };
    if (name)
        return { kind: 'skill', name };
    return undefined;
}
function createWorkflowAgentStreamObserver({ additionalData, executionId, invocation, }) {
    let sequenceNumber = 0;
    return async (event) => {
        switch (event.type) {
            case 'response-begin':
                await invocation.sendResponseChunk?.('begin');
                return;
            case 'response-delta':
                await invocation.sendResponseChunk?.('item', event.delta);
                return;
            case 'response-end':
                await invocation.sendResponseChunk?.('end');
                return;
        }
        if (!additionalData.sendDataToUI)
            return;
        const data = {
            executionId,
            nodeId: invocation.nodeId,
            nodeName: invocation.nodeName,
            runIndex: invocation.runIndex,
            itemIndex: invocation.itemIndex,
            sequenceNumber: sequenceNumber++,
            toolCallId: event.toolCallId,
            capability: event.capability,
            status: event.type === 'capability-start' ? 'running' : event.status,
        };
        additionalData.sendDataToUI('agentNodeProgress', data);
    };
}
class WorkflowAgentStreamAdapter {
    constructor(observer) {
        this.observer = observer;
        this.pendingTools = new Map();
        this.runningCapabilities = new Map();
    }
    async observe(chunk) {
        switch (chunk.type) {
            case 'text-start':
                await this.beginText(chunk.id);
                return;
            case 'text-delta':
                if (chunk.delta.length === 0)
                    return;
                if (this.openTextId !== chunk.id)
                    await this.beginText(chunk.id);
                await this.emit({ type: 'response-delta', delta: chunk.delta });
                return;
            case 'text-end':
                await this.endText();
                return;
            case 'finish':
                await this.endText();
                return;
            case 'error':
                this.fail();
                return;
            case 'tool-call':
                this.pendingTools.set(chunk.toolCallId, {
                    toolName: chunk.toolName,
                    input: chunk.input,
                });
                return;
            case 'tool-execution-start':
                await this.startCapability(chunk.toolCallId, chunk.toolName);
                return;
            case 'tool-execution-end':
                await this.endCapability(chunk.toolCallId, chunk.isError ? 'failed' : 'succeeded');
                return;
            case 'tool-result':
                await this.endCapability(chunk.toolCallId, chunk.isError === true ? 'failed' : 'succeeded');
                return;
        }
    }
    fail() {
        this.openTextId = undefined;
    }
    async beginText(id) {
        if (this.openTextId !== undefined)
            await this.endText();
        this.openTextId = id;
        await this.emit({ type: 'response-begin' });
    }
    async endText() {
        if (this.openTextId === undefined)
            return;
        this.openTextId = undefined;
        await this.emit({ type: 'response-end' });
    }
    async startCapability(toolCallId, toolName) {
        const pending = this.pendingTools.get(toolCallId);
        const capability = capabilityFor(toolName, pending?.input);
        if (!capability)
            return;
        this.runningCapabilities.set(toolCallId, capability);
        await this.emit({ type: 'capability-start', toolCallId, capability });
    }
    async endCapability(toolCallId, status) {
        const capability = this.runningCapabilities.get(toolCallId);
        if (!capability)
            return;
        this.runningCapabilities.delete(toolCallId);
        this.pendingTools.delete(toolCallId);
        await this.emit({ type: 'capability-end', toolCallId, capability, status });
    }
    async emit(event) {
        await this.observer?.(event);
    }
}
exports.WorkflowAgentStreamAdapter = WorkflowAgentStreamAdapter;
//# sourceMappingURL=workflow-agent-stream.js.map