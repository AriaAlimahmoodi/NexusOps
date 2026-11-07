"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestWorkflowTool = void 0;
exports.testWorkflow = testWorkflow;
const constants_1 = require("@n8n/constants");
const workflow_sdk_1 = require("@n8n/workflow-sdk");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const mcp_utils_1 = require("../mcp.utils");
const execution_utils_1 = require("./execution-utils");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const inputSchema = zod_1.default.object({
    workflowId: zod_1.default.string().describe('The ID of the workflow to test'),
    pinData: zod_1.default
        .record(zod_1.default.array(zod_1.default.record(zod_1.default.unknown())))
        .describe('Pin data for all workflow nodes. Use the prepare_workflow_pin_data tool to generate this. Keys are node names, values are arrays of items. Each item MUST be wrapped in a "json" property, e.g. [{"json": {"id": "123", "name": "test"}}]. Do NOT pass flat objects like [{"id": "123"}].'),
    triggerNodeName: zod_1.default
        .string()
        .optional()
        .describe('Optional name of the trigger node to start execution from. Useful for workflows with multiple triggers. Defaults to the first trigger node found.'),
    timeout: zod_1.default
        .number()
        .int()
        .positive()
        .max(execution_utils_1.WORKFLOW_EXECUTION_TIMEOUT_MAX_SECONDS)
        .optional()
        .describe(`Optional timeout in seconds before the test execution is interrupted. Defaults to ${execution_utils_1.WORKFLOW_EXECUTION_TIMEOUT_DEFAULT_SECONDS} seconds. Increase this to test workflows that take longer to run.`),
});
const outputSchema = {
    executionId: zod_1.default.string().nullable(),
    status: zod_1.default
        .enum(['success', 'error', 'running', 'waiting', 'canceled', 'crashed', 'new', 'unknown'])
        .describe('The status of the test execution'),
    error: zod_1.default.string().optional().describe('Error message if the execution failed'),
};
const createTestWorkflowTool = (user, workflowFinderService, activeExecutions, workflowRunner, nodeTypes, telemetry, mcpService) => ({
    name: 'test_workflow',
    config: {
        description: 'Test a workflow using pin data to bypass external services. Trigger nodes, nodes with credentials, and HTTP Request nodes are pinned (use simulated data). Other nodes (Set, If, Code, etc.) execute normally — including credential-free I/O nodes like Execute Command or file read/write nodes. Use prepare_workflow_pin_data to generate the pin data first.',
        inputSchema: inputSchema.shape,
        outputSchema,
        annotations: {
            title: 'Test Workflow',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, pinData, triggerNodeName, timeout, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'test_workflow',
            parameters: {
                workflowId,
                nodeCount: Object.keys(pinData).length,
                hasTriggerNodeName: !!triggerNodeName,
                hasCustomTimeout: timeout !== undefined,
            },
        };
        try {
            const output = await testWorkflow(user, workflowFinderService, activeExecutions, workflowRunner, nodeTypes, mcpService, workflowId, pinData, triggerNodeName, timeout);
            telemetryPayload.results = {
                success: output.status === 'success',
                data: { executionId: output.executionId, status: output.status },
            };
            if (output.status === 'error' && output.error) {
                telemetryPayload.results.error = output.error;
            }
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: (0, n8n_workflow_1.jsonStringify)(output) }],
                structuredContent: output,
            };
        }
        catch (er) {
            const error = (0, ensure_error_1.ensureError)(er);
            const isTimeout = error instanceof mcp_errors_1.McpExecutionTimeoutError;
            const isAccessError = error instanceof mcp_errors_1.WorkflowAccessError;
            const output = {
                executionId: isTimeout ? error.executionId : null,
                status: 'error',
                error: isTimeout
                    ? `Workflow execution timed out after ${error.timeoutMs * constants_1.Time.milliseconds.toSeconds} seconds`
                    : (error.message ?? `${error.constructor.name}: (no message)`),
            };
            telemetryPayload.results = {
                success: false,
                error: isTimeout ? 'Workflow execution timed out' : error.message,
                error_reason: isAccessError ? error.reason : undefined,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: (0, n8n_workflow_1.jsonStringify)(output) }],
                structuredContent: output,
            };
        }
    },
});
exports.createTestWorkflowTool = createTestWorkflowTool;
async function testWorkflow(user, workflowFinderService, activeExecutions, workflowRunner, nodeTypes, mcpService, workflowId, pinData, triggerNodeName, timeoutSeconds = execution_utils_1.WORKFLOW_EXECUTION_TIMEOUT_DEFAULT_SECONDS) {
    const workflow = await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:execute'], workflowFinderService);
    const nodes = workflow.nodes ?? [];
    const connections = workflow.connections ?? {};
    const triggerNode = (0, mcp_utils_1.findEnabledEligibleTrigger)(nodes, (node) => {
        try {
            const nodeType = nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            return (0, n8n_workflow_1.isTriggerNode)(nodeType.description);
        }
        catch {
            return false;
        }
    }, triggerNodeName);
    if (!triggerNode) {
        throw new mcp_errors_1.WorkflowAccessError(triggerNodeName
            ? `Trigger node "${triggerNodeName}" not found in the workflow. Check the node name and ensure it is a trigger node.`
            : 'Workflow has no trigger node. A trigger node is required to test the workflow.', 'unsupported_trigger');
    }
    const nodeNames = new Set(nodes.map((n) => n.name));
    const unknownKeys = Object.keys(pinData).filter((key) => !nodeNames.has(key));
    if (unknownKeys.length > 0) {
        throw new mcp_errors_1.WorkflowAccessError(`Pin data contains unknown node names: ${unknownKeys.join(', ')}. Check for typos — node names must match exactly.`, 'invalid_pin_data');
    }
    const normalizedPinData = (0, workflow_sdk_1.normalizePinData)(pinData);
    const triggerPinData = normalizedPinData[triggerNode.name] ?? [
        { json: {} },
    ];
    const mcpMessageId = `mcp-test-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const runData = {
        executionMode: 'manual',
        workflowData: { ...workflow, nodes, connections },
        userId: user.id,
        isMcpExecution: mcpService.isQueueMode,
        mcpType: 'service',
        mcpSessionId: mcpMessageId,
        mcpMessageId,
        startNodes: [{ name: triggerNode.name, sourceData: null }],
        pinData: normalizedPinData,
        executionData: (0, n8n_workflow_1.createRunExecutionData)({
            startData: {},
            resultData: {
                pinData: normalizedPinData,
                runData: {},
            },
            executionData: {
                contextData: {},
                metadata: {},
                nodeExecutionStack: [
                    {
                        node: triggerNode,
                        data: {
                            main: [triggerPinData],
                        },
                        source: null,
                    },
                ],
                waitingExecution: {},
                waitingExecutionSource: {},
            },
        }),
    };
    const executionId = await workflowRunner.run(runData);
    const data = await (0, execution_utils_1.waitForExecutionResult)(executionId, activeExecutions, mcpService, timeoutSeconds * constants_1.Time.seconds.toMilliseconds);
    const hasError = data.status === 'error' || data.data.resultData?.error;
    return {
        executionId,
        status: hasError ? 'error' : data.status,
        error: hasError
            ? (data.data.resultData?.error?.message ?? 'Execution completed with errors')
            : undefined,
    };
}
//# sourceMappingURL=test-workflow.tool.js.map