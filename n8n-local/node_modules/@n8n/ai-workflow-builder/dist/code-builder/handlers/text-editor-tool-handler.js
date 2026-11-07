"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorToolHandler = void 0;
const messages_1 = require("@langchain/core/messages");
const constants_1 = require("../constants");
const format_warnings_1 = require("../utils/format-warnings");
class TextEditorToolHandler {
    textEditorExecute;
    textEditorGetCode;
    parseAndValidate;
    getErrorContext;
    constructor(config) {
        this.textEditorExecute = config.textEditorExecute;
        this.textEditorGetCode = config.textEditorGetCode;
        this.parseAndValidate = config.parseAndValidate;
        this.getErrorContext = config.getErrorContext;
    }
    async *execute(params) {
        const { toolCallId, args, currentWorkflow, iteration, messages, warningTracker } = params;
        const command = args.command;
        yield this.createToolProgressChunk('running', command, toolCallId);
        try {
            const result = this.textEditorExecute(args);
            if (command === 'create') {
                const autoValidateResult = await this.autoValidateAfterCreate(toolCallId, result, currentWorkflow, iteration, messages, warningTracker);
                if (autoValidateResult.workflow) {
                    yield this.createWorkflowUpdateChunk(autoValidateResult.workflow);
                }
                yield this.createToolProgressChunk('completed', command, toolCallId);
                return autoValidateResult;
            }
            messages.push(new messages_1.ToolMessage({
                tool_call_id: toolCallId,
                content: result,
            }));
            if (command !== 'view') {
                const preview = await this.tryParseForPreview(currentWorkflow);
                if (preview.chunk) {
                    yield preview.chunk;
                }
                if (preview.parseError) {
                    const lastMsg = messages[messages.length - 1];
                    lastMsg.content = `${lastMsg.content}\n\nParse error: ${preview.parseError}`;
                }
            }
            yield this.createToolProgressChunk('completed', command, toolCallId);
            return undefined;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            messages.push(new messages_1.ToolMessage({
                tool_call_id: toolCallId,
                content: `Error: ${errorMessage}`,
            }));
            yield this.createToolProgressChunk('completed', command, toolCallId);
            return undefined;
        }
    }
    async autoValidateAfterCreate(toolCallId, createResult, currentWorkflow, _iteration, messages, warningTracker) {
        const code = this.textEditorGetCode();
        if (!code) {
            messages.push(new messages_1.ToolMessage({ tool_call_id: toolCallId, content: createResult }));
            return { workflowReady: false };
        }
        try {
            const result = await this.parseAndValidate(code, currentWorkflow);
            if (result.warnings.length > 0) {
                const newWarnings = warningTracker
                    ? warningTracker.filterNewWarnings(result.warnings)
                    : result.warnings;
                if (newWarnings.length > 0) {
                    if (warningTracker) {
                        warningTracker.markAsSeen(newWarnings);
                    }
                    const warningText = (0, format_warnings_1.formatWarnings)(newWarnings, warningTracker);
                    const errorContext = this.getErrorContext(code, newWarnings[0].message);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        content: `${createResult}\n\nValidation warnings:\n${warningText}\n\n${errorContext}\n\n${constants_1.FIX_VALIDATION_ERRORS_INSTRUCTION}`,
                    }));
                    return {
                        workflowReady: false,
                        workflow: result.workflow,
                    };
                }
            }
            messages.push(new messages_1.ToolMessage({ tool_call_id: toolCallId, content: createResult }));
            return {
                workflowReady: true,
                workflow: result.workflow,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorContext = this.getErrorContext(code, errorMessage);
            messages.push(new messages_1.ToolMessage({
                tool_call_id: toolCallId,
                content: `${createResult}\n\nParse error: ${errorMessage}\n\n${errorContext}\n\n${constants_1.FIX_VALIDATION_ERRORS_INSTRUCTION}`,
                additional_kwargs: { validationMessage: true },
            }));
            return { workflowReady: false };
        }
    }
    async tryParseForPreview(currentWorkflow) {
        const code = this.textEditorGetCode();
        if (!code) {
            return {};
        }
        try {
            const result = await this.parseAndValidate(code, currentWorkflow);
            return { chunk: this.createWorkflowUpdateChunk(result.workflow) };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { parseError: errorMessage };
        }
    }
    createToolProgressChunk(status, command, toolCallId) {
        const displayTitle = command === 'view' ? 'Viewing workflow' : 'Editing workflow';
        return {
            messages: [
                {
                    type: 'tool',
                    toolName: 'str_replace_based_edit_tool',
                    toolCallId,
                    displayTitle,
                    status,
                },
            ],
        };
    }
    createWorkflowUpdateChunk(workflow) {
        return {
            messages: [
                {
                    role: 'assistant',
                    type: 'workflow-updated',
                    codeSnippet: JSON.stringify(workflow, null, 2),
                },
            ],
        };
    }
}
exports.TextEditorToolHandler = TextEditorToolHandler;
//# sourceMappingURL=text-editor-tool-handler.js.map