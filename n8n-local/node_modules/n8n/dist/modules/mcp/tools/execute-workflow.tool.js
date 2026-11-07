"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflow = exports.createExecuteWorkflowTool = void 0;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const mcp_utils_1 = require("../mcp.utils");
const workflow_inputs_1 = require("./workflow-inputs");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const inputSchema = zod_1.default.object({
    workflowId: zod_1.default.string().describe('The ID of the workflow to execute'),
    executionMode: zod_1.default
        .enum(['manual', 'production'])
        .describe('Required execution intent. Use "manual" for testing or validating the current workflow, including tests against live external services. Use "production" only when intentionally running the published workflow as a live execution.'),
    triggerNodeName: zod_1.default
        .string()
        .optional()
        .describe('Name of the trigger node to execute. Required when providing inputs. If omitted, the workflow must have exactly one trigger that does not require inputs (Schedule Trigger, or Manual Trigger in manual mode). Use get_workflow_details to see available trigger names.'),
    inputs: workflow_inputs_1.workflowInputsSchema
        .optional()
        .describe('Trigger payload. Required for webhook, chat, and form triggers. Must be omitted for schedule and manual triggers. Use get_workflow_details to see the expected payload for each trigger.'),
});
const outputSchema = {
    executionId: zod_1.default.string().nullable(),
    status: zod_1.default.enum(['started', 'error']).describe('The status of the execution'),
    error: zod_1.default.string().optional().describe('Error message if the execution failed'),
};
const createExecuteWorkflowTool = (user, workflowFinderService, workflowRunner, telemetry, mcpService, workflowsConfig, workflowPublishedDataService) => ({
    name: 'execute_workflow',
    config: {
        description: "Execute a workflow by ID. Returns the execution ID immediately without waiting for completion. Before executing always ensure you know the input schema by first using the get_workflow_details tool and consulting workflow description; pass detailLevel 'execution' to that tool when running the workflow is all you need, since the full graph is not required here.",
        inputSchema: inputSchema.shape,
        outputSchema,
        annotations: {
            title: 'Execute Workflow',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: true,
        },
    },
    handler: async ({ workflowId, executionMode, triggerNodeName, inputs }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'execute_workflow',
            parameters: {
                workflowId,
                executionMode,
                inputs: getInputMetaData(inputs, triggerNodeName),
            },
        };
        try {
            const output = await (0, exports.executeWorkflow)(user, workflowFinderService, workflowRunner, mcpService, workflowsConfig, workflowPublishedDataService, workflowId, inputs, executionMode, triggerNodeName);
            telemetryPayload.results = {
                success: true,
                data: {
                    executionId: output.executionId,
                    status: output.status,
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: (0, n8n_workflow_1.jsonStringify)(output) }],
                structuredContent: output,
            };
        }
        catch (er) {
            const error = (0, ensure_error_1.ensureError)(er);
            const isAccessError = error instanceof mcp_errors_1.WorkflowAccessError;
            const errorInfo = {
                message: error.message || 'Unknown error',
                name: error.constructor.name,
            };
            if ('extra' in error && error.extra) {
                errorInfo.extra = error.extra;
            }
            if (error.cause) {
                errorInfo.cause =
                    error.cause instanceof Error ? error.cause.message : (0, n8n_workflow_1.jsonStringify)(error.cause);
            }
            const output = {
                executionId: null,
                status: 'error',
                error: error.message ?? `${error.constructor.name}: (no message)`,
            };
            telemetryPayload.results = {
                success: false,
                error: errorInfo,
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
exports.createExecuteWorkflowTool = createExecuteWorkflowTool;
const executeWorkflow = async (user, workflowFinderService, workflowRunner, mcpService, workflowsConfig, workflowPublishedDataService, workflowId, inputs, executionMode, triggerNodeName) => {
    const workflow = await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:execute'], workflowFinderService, { includeActiveVersion: true, publishHistory: 'none' });
    const runData = await buildRunData(workflow, user.id, workflowId, executionMode, inputs, mcpService, workflowsConfig, workflowPublishedDataService, triggerNodeName);
    const executionId = await workflowRunner.run(runData);
    return {
        executionId,
        status: 'started',
    };
};
exports.executeWorkflow = executeWorkflow;
const getVersionDataForExecution = async (workflow, workflowId, executionMode, workflowsConfig, workflowPublishedDataService) => {
    if (executionMode !== 'production') {
        return { nodes: workflow.nodes ?? [], connections: workflow.connections ?? {} };
    }
    if (workflowsConfig.useWorkflowPublicationService) {
        const publishedData = await workflowPublishedDataService.getPublishedWorkflowData(workflowId);
        if (publishedData === null) {
            throw new mcp_errors_1.WorkflowAccessError(`Workflow '${workflowId}' has no published (active) version to execute`, 'workflow_not_active');
        }
        return {
            nodes: publishedData.publishedVersion.nodes,
            connections: publishedData.publishedVersion.connections,
        };
    }
    if (!workflow.activeVersionId) {
        throw new mcp_errors_1.WorkflowAccessError(`Workflow '${workflowId}' has no published (active) version to execute`, 'workflow_not_active');
    }
    return {
        nodes: workflow.activeVersion?.nodes ?? [],
        connections: workflow.activeVersion?.connections ?? {},
    };
};
const buildRunData = async (workflow, userId, workflowId, executionMode, inputs, mcpService, workflowsConfig, workflowPublishedDataService, triggerNodeName) => {
    const { nodes, connections } = await getVersionDataForExecution(workflow, workflowId, executionMode, workflowsConfig, workflowPublishedDataService);
    const triggerNode = resolveExecuteWorkflowTrigger(nodes, executionMode, triggerNodeName, inputs);
    const mcpMessageId = `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const isManualExecution = executionMode === 'manual';
    const runData = {
        executionMode: isManualExecution ? 'manual' : getExecutionModeForTrigger(triggerNode),
        workflowData: { ...workflow, nodes, connections },
        userId,
        isMcpExecution: mcpService.isQueueMode,
        mcpType: 'service',
        mcpSessionId: mcpMessageId,
        mcpMessageId,
    };
    runData.startNodes = [{ name: triggerNode.name, sourceData: null }];
    const triggerPinData = await getPinDataForTrigger(triggerNode, inputs);
    const workflowPinData = isManualExecution ? (workflow.pinData ?? {}) : {};
    runData.pinData = { ...workflowPinData, ...triggerPinData };
    runData.executionData = (0, n8n_workflow_1.createRunExecutionData)({
        startData: {},
        resultData: {
            pinData: runData.pinData,
            runData: {},
        },
        executionData: {
            contextData: {},
            metadata: {},
            nodeExecutionStack: [
                {
                    node: triggerNode,
                    data: {
                        main: [runData.pinData[triggerNode.name]],
                    },
                    source: null,
                },
            ],
            waitingExecution: {},
            waitingExecutionSource: {},
        },
    });
    return runData;
};
const resolveExecuteWorkflowTrigger = (nodes, executionMode, triggerNodeName, inputs) => {
    const eligible = (0, mcp_utils_1.findEnabledEligibleTriggers)(nodes, (node) => (0, mcp_utils_1.isMcpSupportedTriggerType)(node.type, executionMode));
    const available = formatTriggerNames(eligible);
    if (inputs && !triggerNodeName) {
        if (eligible.length === 0)
            throw noEligibleTriggerError(executionMode);
        throw new mcp_errors_1.WorkflowAccessError(`Provide triggerNodeName when passing inputs. Available triggers: ${available}.`, 'invalid_inputs');
    }
    if (triggerNodeName) {
        const named = nodes.find((node) => node.name === triggerNodeName);
        if (!named) {
            throw new mcp_errors_1.WorkflowAccessError(`Trigger node "${triggerNodeName}" was not found. Available triggers: ${available}.`, 'unsupported_trigger');
        }
        if (named.disabled) {
            throw new mcp_errors_1.WorkflowAccessError(`Trigger node "${triggerNodeName}" is disabled. Enable it or choose another trigger: ${available}.`, 'unsupported_trigger');
        }
        if (!(0, mcp_utils_1.isMcpSupportedTriggerType)(named.type, executionMode)) {
            if (named.type === n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE && executionMode === 'production') {
                throw new mcp_errors_1.WorkflowAccessError(`Trigger node "${triggerNodeName}" cannot be used in production mode. Use a webhook, form, chat, or schedule trigger, or execute in manual mode.`, 'unsupported_trigger');
            }
            throw new mcp_errors_1.WorkflowAccessError(`Trigger node "${triggerNodeName}" is not supported for MCP execution. Available triggers: ${available}.`, 'unsupported_trigger');
        }
        validateInputsForTrigger(named, inputs);
        return named;
    }
    const noPayloadTriggers = eligible.filter((node) => !(0, workflow_inputs_1.triggerRequiresInputs)(node.type));
    if (eligible.length === 1 && noPayloadTriggers.length === 1) {
        return noPayloadTriggers[0];
    }
    if (eligible.length === 0)
        throw noEligibleTriggerError(executionMode);
    if (eligible.every((node) => (0, workflow_inputs_1.triggerRequiresInputs)(node.type))) {
        throw new mcp_errors_1.WorkflowAccessError(`Provide triggerNodeName and inputs to execute this workflow. Available triggers: ${available}.`, 'invalid_inputs');
    }
    throw new mcp_errors_1.WorkflowAccessError(`This workflow has multiple triggers. Provide triggerNodeName to specify which one to execute. Available triggers: ${available}.`, 'unsupported_trigger');
};
const validateInputsForTrigger = (node, inputs) => {
    if (!(0, workflow_inputs_1.triggerRequiresInputs)(node.type)) {
        if (inputs) {
            throw new mcp_errors_1.WorkflowAccessError(`Trigger node "${node.name}" does not accept inputs. Omit inputs.`, 'invalid_inputs');
        }
        return;
    }
    if (!inputs || !inputsMatchTrigger(node.type, inputs)) {
        throw new mcp_errors_1.WorkflowAccessError(`Trigger node "${node.name}" requires inputs matching ${(0, workflow_inputs_1.getExpectedInputsDescription)(node.type)}.`, 'invalid_inputs');
    }
};
const inputsMatchTrigger = (nodeType, inputs) => {
    switch (nodeType) {
        case n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE:
            return 'chatInput' in inputs;
        case n8n_workflow_1.FORM_TRIGGER_NODE_TYPE:
            return 'formData' in inputs;
        case n8n_workflow_1.WEBHOOK_NODE_TYPE:
            return 'webhookData' in inputs;
        default:
            return false;
    }
};
const formatTriggerNames = (nodes) => nodes.length > 0 ? nodes.map((node) => node.name).join(', ') : 'none';
const noEligibleTriggerError = (executionMode) => new mcp_errors_1.WorkflowAccessError(`This workflow has no trigger that can be executed in ${executionMode} mode. Supported triggers: ${getSupportedTriggerNamesForMode(executionMode).join(', ')}.`, 'unsupported_trigger');
const getExecutionModeForTrigger = (node) => {
    switch (node.type) {
        case n8n_workflow_1.WEBHOOK_NODE_TYPE:
            return 'webhook';
        case n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE:
            return 'chat';
        case n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE:
            return 'manual';
        case n8n_workflow_1.FORM_TRIGGER_NODE_TYPE:
            return 'trigger';
        default:
            return 'trigger';
    }
};
const getPinDataForTrigger = async (node, inputs) => {
    switch (node.type) {
        case n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE:
            return {
                [node.name]: [{ json: {} }],
            };
        case n8n_workflow_1.WEBHOOK_NODE_TYPE: {
            const webhookData = inputs && 'webhookData' in inputs ? inputs.webhookData : undefined;
            return {
                [node.name]: [
                    {
                        json: {
                            headers: webhookData?.headers ?? {},
                            query: webhookData?.query ?? {},
                            body: webhookData?.body ?? {},
                        },
                    },
                ],
            };
        }
        case n8n_workflow_1.CHAT_TRIGGER_NODE_TYPE: {
            const chatInput = inputs && 'chatInput' in inputs ? inputs.chatInput : '';
            return {
                [node.name]: [
                    {
                        json: {
                            sessionId: `mcp-session-${Date.now()}`,
                            action: 'sendMessage',
                            chatInput,
                        },
                    },
                ],
            };
        }
        case n8n_workflow_1.FORM_TRIGGER_NODE_TYPE: {
            const formData = inputs && 'formData' in inputs ? inputs.formData : {};
            return {
                [node.name]: [
                    {
                        json: {
                            submittedAt: new Date().toISOString(),
                            formMode: 'mcp',
                            ...formData,
                        },
                    },
                ],
            };
        }
        case n8n_workflow_1.SCHEDULE_TRIGGER_NODE_TYPE: {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const moment = (await import('moment-timezone')).default;
            const momentTz = moment.tz(timezone);
            return {
                [node.name]: [
                    {
                        json: {
                            timestamp: momentTz.toISOString(true),
                            'Readable date': momentTz.format('MMMM Do YYYY, h:mm:ss a'),
                            'Readable time': momentTz.format('h:mm:ss a'),
                            'Day of week': momentTz.format('dddd'),
                            Year: momentTz.format('YYYY'),
                            Month: momentTz.format('MMMM'),
                            'Day of month': momentTz.format('DD'),
                            Hour: momentTz.format('HH'),
                            Minute: momentTz.format('mm'),
                            Second: momentTz.format('ss'),
                            Timezone: `${timezone} (UTC${momentTz.format('Z')})`,
                        },
                    },
                ],
            };
        }
        default:
            return { [node.name]: [{ json: {} }] };
    }
};
const getSupportedTriggerNamesForMode = (executionMode) => {
    return executionMode === 'production'
        ? Object.values(mcp_constants_1.SUPPORTED_PRODUCTION_MCP_TRIGGERS)
        : Object.values(mcp_constants_1.SUPPORTED_MCP_TRIGGERS);
};
const getInputMetaData = (inputs, triggerNodeName) => {
    if (!inputs && !triggerNodeName) {
        return undefined;
    }
    const metadata = {};
    if (triggerNodeName) {
        metadata.triggerNodeName = triggerNodeName;
    }
    if (!inputs) {
        return metadata;
    }
    if ('chatInput' in inputs) {
        metadata.type = 'chat';
        metadata.parameter_count = 1;
    }
    else if ('formData' in inputs) {
        metadata.type = 'form';
        metadata.parameter_count = Object.keys(inputs.formData ?? {}).length;
    }
    else if ('webhookData' in inputs) {
        metadata.type = 'webhook';
        metadata.parameter_count = [
            inputs.webhookData?.body ? Object.keys(inputs.webhookData.body).length : 0,
            inputs.webhookData?.query ? Object.keys(inputs.webhookData.query).length : 0,
            inputs.webhookData?.headers ? Object.keys(inputs.webhookData.headers).length : 0,
        ].reduce((a, b) => a + b, 0);
    }
    return metadata;
};
//# sourceMappingURL=execute-workflow.tool.js.map