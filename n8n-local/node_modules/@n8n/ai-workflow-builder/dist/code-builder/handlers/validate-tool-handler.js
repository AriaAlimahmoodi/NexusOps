"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateToolHandler = void 0;
const messages_1 = require("@langchain/core/messages");
const constants_1 = require("../constants");
const format_warnings_1 = require("../utils/format-warnings");
class ValidateToolHandler {
    parseAndValidate;
    getErrorContext;
    constructor(config) {
        this.parseAndValidate = config.parseAndValidate;
        this.getErrorContext = config.getErrorContext;
    }
    async *execute(params) {
        const { toolCallId, code, currentWorkflow, messages, warningTracker } = params;
        yield this.createToolProgressChunk('running', toolCallId);
        if (!code) {
            messages.push(new messages_1.ToolMessage({
                tool_call_id: toolCallId,
                content: 'No workflow code exists. You MUST create the workflow code using str_replace_based_edit_tool with command "create" before validating. Do NOT call validate_workflow again until you have written code. If empty workflow is expected, stop calling tools to finish.',
            }));
            yield this.createToolProgressChunk('completed', toolCallId);
            return { workflowReady: false };
        }
        const parseStartTime = Date.now();
        try {
            const result = await this.parseAndValidate(code, currentWorkflow);
            const parseDuration = Date.now() - parseStartTime;
            if (result.warnings.length > 0) {
                const newWarnings = warningTracker.filterNewWarnings(result.warnings);
                if (newWarnings.length > 0) {
                    warningTracker.markAsSeen(newWarnings);
                    const warningText = (0, format_warnings_1.formatWarnings)(newWarnings, warningTracker);
                    const errorContext = this.getErrorContext(code, newWarnings[0].message);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCallId,
                        content: `Validation warnings:\n${warningText}\n\n${errorContext}\n\n${constants_1.FIX_VALIDATION_ERRORS_INSTRUCTION}`,
                    }));
                    yield this.createWorkflowUpdateChunk(result.workflow);
                    yield this.createToolProgressChunk('completed', toolCallId);
                    return {
                        workflowReady: false,
                        workflow: result.workflow,
                        parseDuration,
                    };
                }
            }
            messages.push(new messages_1.ToolMessage({
                tool_call_id: toolCallId,
                content: 'Validation passed. Workflow code is valid.\n\nIMPORTANT: Stop calling tools now to finalize the workflow.',
            }));
            yield this.createWorkflowUpdateChunk(result.workflow);
            yield this.createToolProgressChunk('completed', toolCallId);
            return {
                workflowReady: true,
                workflow: result.workflow,
                parseDuration,
            };
        }
        catch (error) {
            const parseDuration = Date.now() - parseStartTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorContext = this.getErrorContext(code, errorMessage);
            messages.push(new messages_1.ToolMessage({
                tool_call_id: toolCallId,
                content: `Parse error: ${errorMessage}\n\n${errorContext}\n\n${constants_1.FIX_VALIDATION_ERRORS_INSTRUCTION}`,
            }));
            yield this.createToolProgressChunk('completed', toolCallId);
            return {
                workflowReady: false,
                parseDuration,
            };
        }
    }
    createToolProgressChunk(status, toolCallId) {
        return {
            messages: [
                {
                    type: 'tool',
                    toolName: 'validate_workflow',
                    toolCallId,
                    displayTitle: 'Validating workflow',
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
exports.ValidateToolHandler = ValidateToolHandler;
//# sourceMappingURL=validate-tool-handler.js.map