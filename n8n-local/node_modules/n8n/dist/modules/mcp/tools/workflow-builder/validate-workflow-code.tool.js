"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidateWorkflowCodeTool = void 0;
const workflow_sdk_1 = require("@n8n/workflow-sdk");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const workflow_helpers_1 = require("../../../../workflow-helpers");
const mcp_constants_1 = require("../../mcp.constants");
const workflow_validation_utils_1 = require("../workflow-validation.utils");
const connection_structure_check_1 = require("./connection-structure-check");
const constants_1 = require("./constants");
const inputSchema = {
    code: zod_1.default
        .string()
        .max(constants_1.MAX_WORKFLOW_CODE_LENGTH)
        .describe(`Full TypeScript/JavaScript workflow code using the n8n Workflow SDK. Must include the workflow export. Max ${constants_1.MAX_WORKFLOW_CODE_LENGTH} characters.`),
};
const outputSchema = {
    valid: zod_1.default.boolean().describe('Whether the workflow code is valid'),
    nodeCount: zod_1.default.number().optional().describe('The number of nodes in the workflow (if valid)'),
    warnings: zod_1.default
        .array(zod_1.default.object({
        code: zod_1.default.string().describe('The warning code identifying the type of warning'),
        message: zod_1.default.string().describe('The warning message'),
        nodeName: zod_1.default.string().optional().describe('The node that triggered the warning'),
        parameterPath: zod_1.default
            .string()
            .optional()
            .describe('The parameter path that triggered the warning'),
    }))
        .optional()
        .describe('Validation warnings (if any)'),
    errors: zod_1.default.array(zod_1.default.string()).optional().describe('Validation errors (if invalid)'),
    hint: zod_1.default
        .string()
        .optional()
        .describe('Actionable hint for recovering from the error. When present, follow the suggested action before retrying.'),
};
const createValidateWorkflowCodeTool = (user, telemetry, nodeTypes) => ({
    name: constants_1.CODE_BUILDER_VALIDATE_TOOL.toolName,
    config: {
        description: 'Validate n8n Workflow SDK code. Required before creating or updating workflows from code. If you have not already read get_workflow_sdk_reference, call that first; guessing SDK syntax commonly creates invalid workflows.',
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.CODE_BUILDER_VALIDATE_TOOL.displayTitle,
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ code }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.CODE_BUILDER_VALIDATE_TOOL.toolName,
            parameters: { codeLength: code.length },
        };
        try {
            const { ParseValidateHandler, stripImportStatements } = await import('@n8n/ai-workflow-builder');
            const handler = new ParseValidateHandler({
                generatePinData: false,
                nodeTypesProvider: nodeTypes,
            });
            const strippedCode = stripImportStatements(code);
            const result = await handler.parseAndValidate(strippedCode);
            const invalidToolSourceResponse = (0, connection_structure_check_1.buildInvalidAiToolSourceErrorResponse)(result.workflow, nodeTypes, (errorMessage) => ({ valid: false, errors: [errorMessage] }), telemetryPayload, telemetry);
            if (invalidToolSourceResponse)
                return invalidToolSourceResponse;
            if ((result.workflow.nodeGroups?.length ?? 0) > 0) {
                const groupsResult = (0, n8n_workflow_1.validateWorkflowGroups)({
                    nodes: (0, workflow_sdk_1.toGroupValidationNodes)(result.workflow.nodes),
                    connectionsBySourceNode: (0, workflow_sdk_1.toEngineConnections)(result.workflow.connections),
                    nodeGroups: result.workflow.nodeGroups,
                    getNodeType: (0, workflow_helpers_1.makeGetNodeTypeForGrouping)(nodeTypes),
                });
                if (!groupsResult.valid) {
                    const errorMessages = groupsResult.violations.map((violation) => violation.message);
                    telemetryPayload.results = {
                        success: false,
                        error: errorMessages.join(' '),
                        data: {
                            groupCount: result.workflow.nodeGroups?.length ?? 0,
                            groupViolationCount: groupsResult.violations.length,
                            groupViolationCodes: [
                                ...new Set(groupsResult.violations.map((violation) => violation.code)),
                            ],
                        },
                    };
                    telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                    const output = { valid: false, errors: errorMessages };
                    return {
                        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                        structuredContent: output,
                        isError: true,
                    };
                }
            }
            telemetryPayload.results = {
                success: true,
                data: {
                    nodeCount: result.workflow.nodes.length,
                    warningCount: result.warnings.length,
                    groupCount: result.workflow.nodeGroups?.length ?? 0,
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const response = {
                valid: true,
                nodeCount: result.workflow.nodes.length,
            };
            if (result.warnings.length > 0) {
                response.warnings = result.warnings;
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
                structuredContent: response,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            telemetryPayload.results = {
                success: false,
                error: errorMessage,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const hint = (0, workflow_validation_utils_1.getSdkReferenceHint)(error);
            const output = {
                valid: false,
                errors: [errorMessage],
                ...(hint ? { hint } : {}),
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createValidateWorkflowCodeTool = createValidateWorkflowCodeTool;
//# sourceMappingURL=validate-workflow-code.tool.js.map