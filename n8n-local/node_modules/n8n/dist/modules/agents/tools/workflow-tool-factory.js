"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectTriggerNode = detectTriggerNode;
exports.validateCompatibility = validateCompatibility;
exports.listWorkflowInputFields = listWorkflowInputFields;
exports.inferInputSchema = inferInputSchema;
exports.getFixedWorkflowToolInputs = getFixedWorkflowToolInputs;
exports.buildWorkflowToolInputSchema = buildWorkflowToolInputSchema;
exports.mergeWorkflowToolInput = mergeWorkflowToolInput;
exports.executeWorkflow = executeWorkflow;
exports.extractResult = extractResult;
exports.resolveWorkflowTool = resolveWorkflowTool;
exports.buildUnavailableWorkflowTool = buildUnavailableWorkflowTool;
const tool_1 = require("@n8n/agents/tool");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const deferred_promise_1 = require("@n8n/utils/promise/deferred-promise");
const sleep_1 = require("@n8n/utils/sleep");
const luxon_1 = require("luxon");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const execution_persistence_1 = require("../../../executions/execution-persistence");
const webhook_response_relay_1 = require("../../../scaling/webhook-response-relay");
const agent_sandbox_principal_1 = require("../agent-sandbox-principal");
const agent_memory_scope_1 = require("../utils/agent-memory-scope");
const workflow_tool_unavailable_error_1 = require("./workflow-tool-unavailable-error");
const agent_background_job_service_1 = require("../background/agent-background-job.service");
const agent_config_composition_1 = require("../json-config/agent-config-composition");
const SUPPORTED_TRIGGERS = {
    [n8n_workflow_1.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE]: 'executeWorkflow',
};
const _assertSupportedTriggersInSync = SUPPORTED_TRIGGERS;
void _assertSupportedTriggersInSync;
const DEFAULT_TIMEOUT_MS = 120_000;
const WAIT_POLL_ELIGIBLE_MS = 60_000;
const WAIT_TRACKER_SWEEP_MS = 60_000;
const WAIT_POLL_INTERVAL_MS = 2_000;
const WAIT_SUSPEND_SCHEMA = zod_1.z.object({
    type: zod_1.z.literal(api_types_1.WORKFLOW_WAIT_SUSPEND_TYPE),
    title: zod_1.z.string(),
    components: zod_1.z.array(zod_1.z.object({ type: zod_1.z.string() }).catchall(zod_1.z.unknown())),
});
const WAIT_RESUME_SCHEMA = zod_1.z.object({
    type: zod_1.z.string().optional(),
    id: zod_1.z.string().optional(),
    value: zod_1.z.string().optional(),
});
const WAIT_CONTINUATION_SCHEMA = zod_1.z.object({ executionId: zod_1.z.string() });
function isWorkflowToolResponse(value) {
    return (0, is_record_1.isRecord)(value) && ('body' in value || 'headers' in value || 'statusCode' in value);
}
function detectTriggerNode(workflow) {
    const nodes = workflow.nodes ?? [];
    for (const node of nodes) {
        const triggerType = SUPPORTED_TRIGGERS[node.type];
        if (triggerType) {
            return { node, triggerType };
        }
    }
    throw noSupportedTriggerError(workflow);
}
function noSupportedTriggerError(workflow) {
    return new workflow_tool_unavailable_error_1.WorkflowToolUnavailableError('incompatible', `Workflow "${workflow.name}" needs a '${api_types_1.WORKFLOW_TOOL_TRIGGER_DISPLAY_NAME}' trigger to run as an agent tool.`);
}
function validateCompatibility(workflow) {
    const incompatibility = (0, api_types_1.getWorkflowToolIncompatibilityReason)(workflow);
    if (!incompatibility)
        return;
    if (incompatibility.reason === 'incompatible_nodes') {
        const nodes = workflow.nodes ?? [];
        const names = nodes
            .filter((n) => !n.disabled && incompatibility.nodeTypes.includes(n.type))
            .map((n) => `${n.name} (${n.type})`)
            .join(', ');
        throw new workflow_tool_unavailable_error_1.WorkflowToolUnavailableError('incompatible', `Workflow "${workflow.name}" contains nodes that aren't supported as agent tools: ${names}. ` +
            'Remove them or pick another workflow.');
    }
    throw noSupportedTriggerError(workflow);
}
const INPUT_SOURCE = 'inputSource';
const WORKFLOW_INPUTS = 'workflowInputs';
const JSON_EXAMPLE = 'jsonExample';
const PASSTHROUGH = 'passthrough';
function fieldTypeToZod(type, label) {
    const described = (schema) => schema.describe(label).nullable().optional();
    switch (type) {
        case 'number':
            return described(zod_1.z.coerce.number());
        case 'boolean':
            return described(zod_1.z.boolean());
        case 'array':
            return described(zod_1.z.array(zod_1.z.unknown()));
        case 'object':
            return described(zod_1.z.record(zod_1.z.unknown()));
        case 'any':
            return described(zod_1.z.unknown());
        default:
            return described(zod_1.z.coerce.string());
    }
}
function getExecuteWorkflowInputSource(triggerNode) {
    const params = triggerNode.parameters ?? {};
    return params[INPUT_SOURCE] ?? PASSTHROUGH;
}
function listWorkflowInputFields(triggerNode) {
    const params = triggerNode.parameters ?? {};
    const inputSource = getExecuteWorkflowInputSource(triggerNode);
    if (inputSource === PASSTHROUGH)
        return [];
    if (inputSource === JSON_EXAMPLE) {
        const jsonExample = params[JSON_EXAMPLE];
        if (!jsonExample)
            return [];
        let parsed;
        try {
            parsed = JSON.parse(jsonExample);
        }
        catch {
            return [];
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
            return [];
        return Object.entries(parsed).map(([name, value]) => ({
            name,
            type: value === null ? 'any' : Array.isArray(value) ? 'array' : typeof value,
        }));
    }
    const workflowInputs = params[WORKFLOW_INPUTS];
    return (workflowInputs?.values ?? []).filter((field) => typeof field.name === 'string' && field.name.length > 0);
}
function schemaFromFieldDefs(fields) {
    const shape = {};
    for (const field of fields) {
        shape[field.name] = fieldTypeToZod(field.type, field.name);
    }
    return Object.keys(shape).length > 0 ? zod_1.z.object(shape) : null;
}
function inferInputSchema(triggerNode, triggerType) {
    switch (triggerType) {
        case 'executeWorkflow': {
            const inputSource = getExecuteWorkflowInputSource(triggerNode);
            if (inputSource === PASSTHROUGH) {
                return zod_1.z.object({}).catchall(zod_1.z.unknown());
            }
            return (schemaFromFieldDefs(listWorkflowInputFields(triggerNode)) ??
                zod_1.z.object({}).catchall(zod_1.z.unknown()));
        }
        default:
            return zod_1.z.object({}).catchall(zod_1.z.unknown());
    }
}
function getFixedWorkflowToolInputs(inputs) {
    if (!inputs)
        return {};
    const fixed = [];
    for (const [name, binding] of Object.entries(inputs)) {
        if (binding.mode === 'fixed') {
            fixed.push([name, binding.value]);
        }
    }
    return Object.fromEntries(fixed);
}
function buildWorkflowToolInputSchema(schema, inputs) {
    if (!inputs)
        return schema;
    const shape = { ...schema.shape };
    for (const [name, binding] of Object.entries(inputs)) {
        if (binding.mode !== 'ai') {
            delete shape[name];
        }
        else if (Object.hasOwn(shape, name) && binding.description?.trim()) {
            shape[name] = shape[name].describe(binding.description.trim());
        }
    }
    const catchall = schema._def.catchall;
    if (catchall && !(catchall instanceof zod_1.z.ZodNever)) {
        return zod_1.z.object(shape).catchall(catchall);
    }
    return zod_1.z.object(shape);
}
function mergeWorkflowToolInput(llmInput, inputs, fullSchema, expressionValues = {}) {
    const merged = {
        ...llmInput,
        ...getFixedWorkflowToolInputs(inputs),
        ...expressionValues,
    };
    return fullSchema.parse(merged);
}
async function resolveWorkflowToolInput(input, inputs, fullSchema, context, toolName) {
    const modelInput = buildWorkflowToolInputSchema(fullSchema, inputs).parse(input);
    const expressions = {};
    const acceptsExtraInputs = !(fullSchema._def.catchall instanceof zod_1.z.ZodNever);
    for (const [name, binding] of Object.entries(inputs ?? {})) {
        if (binding.mode === 'expression' &&
            (Object.hasOwn(fullSchema.shape, name) || acceptsExtraInputs)) {
            expressions[name] = binding.value;
        }
    }
    if (Object.keys(expressions).length === 0) {
        return mergeWorkflowToolInput(modelInput, inputs, fullSchema);
    }
    const resolved = await context.executor.evaluateExpressions({
        projectId: context.projectId,
        nodeType: n8n_workflow_1.WORKFLOW_TOOL_LANGCHAIN_NODE_TYPE,
        nodeTypeVersion: 2.2,
        nodeParameters: {},
        nodeName: toolName,
    }, expressions, [{ json: modelInput }]);
    return mergeWorkflowToolInput(modelInput, inputs, fullSchema, resolved);
}
async function executeWorkflow(workflow, triggerNode, inputData, context, allOutputs = false, instrumentedToolName) {
    const { workflowRunner, subworkflowPolicyChecker, activeExecutions } = context;
    context.abortSignal?.throwIfAborted();
    await subworkflowPolicyChecker.checkForProject(workflow, context.projectId);
    context.abortSignal?.throwIfAborted();
    const triggerPinData = {
        [triggerNode.name]: [{ json: inputData }],
    };
    const workflowData = workflow.pinData === undefined ? workflow : { ...workflow, pinData: undefined };
    const runData = {
        executionMode: context.executionMode,
        workflowData,
        startNodes: [{ name: triggerNode.name, sourceData: null }],
        pinData: triggerPinData,
        executionData: (0, n8n_workflow_1.createRunExecutionData)({
            ...(context.agentRun ? { parentAgentRun: context.agentRun } : {}),
            startData: {},
            resultData: { pinData: triggerPinData, runData: {} },
            executionData: {
                contextData: {},
                metadata: {},
                nodeExecutionStack: [
                    {
                        node: triggerNode,
                        data: { main: [triggerPinData[triggerNode.name]] },
                        source: null,
                    },
                ],
                waitingExecution: {},
                waitingExecutionSource: {},
            },
        }),
    };
    const instrument = context.instrumentToolAdditionalData;
    if (instrument && instrumentedToolName) {
        runData.configureAdditionalData = (additionalData) => {
            instrument(additionalData, { toolName: instrumentedToolName, toolKind: 'workflow' });
        };
    }
    const responsePromise = (0, deferred_promise_1.createDeferredPromise)();
    let webhookResponse;
    void responsePromise.promise
        .then((response) => {
        webhookResponse = response;
    })
        .catch(() => { });
    const executionId = await workflowRunner.run(runData, undefined, undefined, undefined, responsePromise);
    return await withWorkflowCancellation(executionId, workflow.id, context.abortSignal, async () => {
        const timeoutMs = DEFAULT_TIMEOUT_MS;
        let completedRun;
        if (activeExecutions.has(executionId)) {
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Execution timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            });
            try {
                completedRun = await Promise.race([
                    activeExecutions.getPostExecutePromise(executionId),
                    timeoutPromise,
                ]);
                clearTimeout(timeoutId);
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof Error && error.message.includes('timed out')) {
                    try {
                        activeExecutions.stopExecution(executionId, new n8n_workflow_1.TimeoutExecutionCancelledError(executionId));
                    }
                    catch {
                    }
                    return {
                        executionId,
                        status: 'error',
                        error: `Execution timed out after ${timeoutMs}ms and was cancelled`,
                    };
                }
                throw error;
            }
        }
        const result = completedRun && context.executionMode === 'integrated'
            ? formatResult(executionId, completedRun.status, completedRun.data, allOutputs)
            : await extractResult(executionId, allOutputs);
        if (isWorkflowToolResponse(webhookResponse)) {
            const response = await di_1.Container.get(webhook_response_relay_1.WebhookResponseRelay).restoreOffloadedBody(webhookResponse, { reclaim: true, context: { workflowId: workflow.id, executionId } });
            result.data = {
                ...(result.data ?? {}),
                response: truncateWebhookResponse(response),
            };
        }
        return result;
    });
}
async function withWorkflowCancellation(executionId, workflowId, signal, execute) {
    if (!signal)
        return await execute();
    const aborted = (0, deferred_promise_1.createDeferredPromise)();
    const onAbort = () => {
        void (async () => {
            try {
                const { ExecutionService } = await import('../../../executions/execution.service.js');
                const id = workflowId ??
                    (await di_1.Container.get(execution_persistence_1.ExecutionPersistence).findSingleExecution(executionId))?.workflowId;
                if (!id)
                    throw new n8n_workflow_1.OperationalError('The workflow execution is no longer available');
                await di_1.Container.get(ExecutionService).stop(executionId, [id]);
                aborted.reject(signal.reason);
            }
            catch (error) {
                aborted.reject(error);
            }
        })();
    };
    signal.addEventListener('abort', onAbort, { once: true });
    try {
        if (signal.aborted) {
            onAbort();
            return await aborted.promise;
        }
        const result = await Promise.race([execute(), aborted.promise]);
        if (signal.aborted)
            return await aborted.promise;
        return result;
    }
    catch (error) {
        if (signal.aborted)
            return await aborted.promise;
        throw error;
    }
    finally {
        signal.removeEventListener('abort', onAbort);
    }
}
function normaliseExecutionStatus(status) {
    if (status === 'error' || status === 'crashed')
        return 'error';
    if (status === 'canceled')
        return 'canceled';
    if (status === 'running' || status === 'new')
        return 'running';
    if (status === 'waiting')
        return 'waiting';
    return 'success';
}
function formatResult(executionId, status, data, allOutputs) {
    const runData = data?.resultData?.runData;
    const resultData = runData ? (0, agent_background_job_service_1.collectResultData)(runData, allOutputs) : {};
    const normalisedStatus = normaliseExecutionStatus(status);
    const wait = normalisedStatus === 'waiting' ? extractWaitState(data) : undefined;
    return {
        executionId,
        status: normalisedStatus,
        data: Object.keys(resultData).length > 0 ? resultData : undefined,
        error: data?.resultData?.error?.message,
        ...(wait ? { wait } : {}),
    };
}
async function extractResult(executionId, allOutputs) {
    const execution = await di_1.Container.get(execution_persistence_1.ExecutionPersistence).findSingleExecution(executionId, {
        includeData: true,
        unflattenData: true,
    });
    if (!execution) {
        return { executionId, status: 'unknown' };
    }
    return formatResult(executionId, execution.status, execution.data, allOutputs);
}
function truncateWebhookResponse(response) {
    const { body, ...rest } = response;
    if (Buffer.isBuffer(body)) {
        return { ...rest, body: { _truncated: true, _byteLength: body.length } };
    }
    try {
        JSON.stringify(body);
    }
    catch {
        return { ...rest, body: { _truncated: true } };
    }
    return response;
}
function agentRunOf(context, ctx) {
    const threadId = ctx.persistence?.threadId;
    if (!context.agentId || !threadId || !ctx.runId || !ctx.toolCallId)
        return undefined;
    return {
        agentId: context.agentId,
        projectId: context.projectId,
        threadId,
        runId: ctx.runId,
        toolCallId: ctx.toolCallId,
        ...(context.integrationType ? { integrationType: context.integrationType } : {}),
        ...(context.userId ? { userId: context.userId } : {}),
        ...(context.previewChat ? { previewChat: true } : {}),
        ...(context.publishedN8nChat ? { publishedN8nChat: true } : {}),
    };
}
function extractWaitState(data) {
    if (!data)
        return undefined;
    const waitTill = data.waitTill ? new Date(data.waitTill) : undefined;
    const bounded = waitTill !== undefined && !(0, n8n_workflow_1.isIndefiniteWait)(waitTill);
    return bounded ? { waitTill } : {};
}
function withoutWaitState(result) {
    const { wait: _wait, ...rest } = result;
    return rest;
}
async function backgroundWaitingExecution(result, context, ctx, reference, allOutputs) {
    const agentRun = context.agentRun ?? agentRunOf(context, ctx);
    const parentResourceId = ctx.persistence?.resourceId;
    const sandboxScope = (0, agent_sandbox_principal_1.decodeAgentSandboxHostMetadata)(ctx.persistence?.hostMetadata);
    if (!agentRun ||
        !reference.workflowId ||
        !parentResourceId ||
        (0, agent_memory_scope_1.isTaskRunMemoryResourceId)(parentResourceId) ||
        !sandboxScope ||
        sandboxScope.projectId !== context.projectId) {
        return undefined;
    }
    try {
        const jobService = di_1.Container.get(agent_background_job_service_1.AgentBackgroundJobService);
        const receipt = await jobService.registerWorkflowJob({
            id: (0, uuid_1.v4)(),
            parentAgentId: agentRun.agentId,
            parentThreadId: agentRun.threadId,
            parentResourceId,
            parentPrincipalHash: sandboxScope.principalHash,
            title: reference.workflowName,
            workflowId: reference.workflowId,
            executionId: result.executionId,
        });
        if (receipt.status !== 'started')
            return undefined;
        const jobId = receipt.jobId;
        const executionPersistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
        const recheck = await executionPersistence.findSingleExecution(result.executionId);
        if (!recheck) {
            return await settleOutcomeUnknown(jobService, agentRun.threadId, jobId, result.executionId);
        }
        const rawStatus = recheck.status;
        if ((0, n8n_workflow_1.isTerminalExecutionStatus)(rawStatus)) {
            const full = await executionPersistence.findSingleExecution(result.executionId, {
                includeData: true,
                unflattenData: true,
            });
            if (!full) {
                return await settleOutcomeUnknown(jobService, agentRun.threadId, jobId, result.executionId);
            }
            const fresh = formatResult(result.executionId, full.status, full.data, allOutputs);
            const settlementStatus = (0, agent_background_job_service_1.settlementStatusForExecution)(rawStatus);
            const runData = full.data?.resultData?.runData;
            await jobService.settle(jobId, {
                status: settlementStatus,
                result: settlementStatus === 'completed' && runData
                    ? (0, agent_background_job_service_1.serializeWorkflowJobResult)((0, agent_background_job_service_1.collectResultData)(runData, false))
                    : null,
                error: fresh.error ?? null,
            });
            await consumeInlineMail(jobService, agentRun.threadId, jobId);
            return { ...withoutWaitState(fresh), jobId };
        }
        const continuesAt = result.wait?.waitTill
            ? ` It continues at ${result.wait.waitTill.toISOString()}.`
            : '';
        return {
            executionId: result.executionId,
            status: 'running_in_background',
            jobId,
            note: `The "${reference.workflowName}" workflow is paused at a Wait node and now runs as background job ${jobId}.${continuesAt}` +
                ' Use check_background_jobs for the result and cancel_background_job to stop it. Do not start it again.',
        };
    }
    catch (error) {
        di_1.Container.get(backend_common_1.Logger).error('Failed to background a waiting workflow execution', {
            executionId: result.executionId,
            workflowId: reference.workflowId,
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
}
async function consumeInlineMail(jobService, parentThreadId, jobId) {
    try {
        await jobService.markMailConsumed(parentThreadId, [jobId]);
    }
    catch (error) {
        di_1.Container.get(backend_common_1.Logger).warn('Failed to mark the inline workflow result as delivered', {
            jobId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
async function settleOutcomeUnknown(jobService, parentThreadId, jobId, executionId) {
    const claimed = await jobService.settle(jobId, {
        status: 'failed',
        error: agent_background_job_service_1.EXECUTION_OUTCOME_UNKNOWN_ERROR,
    });
    if (claimed)
        await consumeInlineMail(jobService, parentThreadId, jobId);
    return {
        executionId,
        status: 'unknown',
        jobId,
        note: claimed
            ? agent_background_job_service_1.EXECUTION_OUTCOME_UNKNOWN_ERROR
            : `This run already settled as background job ${jobId} — use check_background_jobs for its outcome.`,
    };
}
function isPollableWait(wait) {
    return (wait?.waitTill !== undefined && wait.waitTill.getTime() - Date.now() <= WAIT_POLL_ELIGIBLE_MS);
}
async function pollWaitingExecution(executionId, waitTill, allOutputs, abortSignal) {
    const deadline = Math.min(Date.now() + DEFAULT_TIMEOUT_MS, Math.max(waitTill.getTime(), Date.now()) + WAIT_TRACKER_SWEEP_MS);
    const persistence = di_1.Container.get(execution_persistence_1.ExecutionPersistence);
    while (Date.now() < deadline) {
        try {
            await (0, sleep_1.sleep)(WAIT_POLL_INTERVAL_MS, abortSignal);
        }
        catch {
            return undefined;
        }
        const status = (await persistence.findSingleExecution(executionId))?.status;
        if ((0, n8n_workflow_1.isTerminalExecutionStatus)(status))
            return await extractResult(executionId, allOutputs);
    }
    return undefined;
}
function buildWaitCard(workflowName, wait) {
    const components = [
        { type: 'section', text: `The "${workflowName}" workflow is paused, waiting to continue.` },
    ];
    if (wait?.waitTill) {
        components.push({
            type: 'fields',
            fields: [{ label: 'Continues at', value: formatWaitDeadline(wait.waitTill) }],
        });
    }
    components.push({
        type: 'button',
        label: 'Check for the result',
        value: api_types_1.WORKFLOW_WAIT_ACTION_CHECK,
        style: 'primary',
    }, {
        type: 'button',
        label: 'Stop waiting',
        value: api_types_1.WORKFLOW_WAIT_ACTION_CANCEL,
        style: 'danger',
    });
    return {
        type: api_types_1.WORKFLOW_WAIT_SUSPEND_TYPE,
        title: `Waiting on "${workflowName}"`,
        components,
    };
}
function formatWaitDeadline(waitTill) {
    const { timezone } = di_1.Container.get(config_1.GlobalConfig).generic;
    const deadline = luxon_1.DateTime.fromJSDate(waitTill);
    const local = deadline.setZone(timezone);
    return (local.isValid ? local : deadline.toUTC()).toFormat('d LLL yyyy, HH:mm ZZZZ');
}
function isWaitCancelled(resumeData) {
    return resumeData?.value === api_types_1.WORKFLOW_WAIT_ACTION_CANCEL;
}
async function pollIfDueSoon(parked, allOutputs, abortSignal) {
    if (!isPollableWait(parked.wait))
        return parked;
    const settled = await pollWaitingExecution(parked.executionId, parked.wait.waitTill, allOutputs, abortSignal);
    return settled ?? parked;
}
async function resolveWorkflowTool(descriptor, context) {
    return await buildWorkflowTool(descriptor, context);
}
function buildUnavailableWorkflowTool(descriptor, context) {
    return assembleWorkflowTool(descriptor, context, {
        reference: toReference(descriptor),
        inputSchema: zod_1.z.object({}).passthrough(),
    });
}
function toReference(descriptor) {
    return {
        workflowName: descriptor.workflow,
        ...(descriptor.workflowId !== undefined ? { workflowId: descriptor.workflowId } : {}),
    };
}
async function buildWorkflowTool(descriptor, context) {
    const workflow = await context.workflowLoader.loadWorkflow(context.projectId, toReference(descriptor), {
        usePublishedVersion: context.usePublishedWorkflowVersion === true,
    });
    if (!workflow) {
        throw new workflow_tool_unavailable_error_1.WorkflowToolUnavailableError('not_found', `Workflow "${descriptor.workflow}" not found`);
    }
    validateCompatibility(workflow);
    const { node: triggerNode, triggerType } = detectTriggerNode(workflow);
    const fullInputSchema = inferInputSchema(triggerNode, triggerType);
    return assembleWorkflowTool(descriptor, context, {
        reference: { workflowId: workflow.id, workflowName: workflow.name },
        inputSchema: buildWorkflowToolInputSchema(fullInputSchema, descriptor.inputs),
        triggerType,
    });
}
function assembleWorkflowTool(descriptor, context, tool) {
    const { reference, inputSchema, triggerType } = tool;
    const toolName = toToolName(descriptor.name ?? descriptor.workflow);
    const toolDescription = descriptor.description ?? `Execute the "${descriptor.workflow}" workflow`;
    const toolInputs = descriptor.inputs;
    const allOutputs = descriptor.allOutputs ?? false;
    const supportsHitl = context.supportsHitl ?? true;
    const builder = new tool_1.Tool(toolName)
        .description(toolDescription)
        .input(inputSchema)
        .output(zod_1.z.object({
        executionId: zod_1.z.string(),
        status: zod_1.z.string(),
        data: zod_1.z.record(zod_1.z.unknown()).optional(),
        error: zod_1.z.string().optional(),
        note: zod_1.z.string().optional(),
        jobId: zod_1.z.string().optional(),
    }))
        .suspend(WAIT_SUSPEND_SCHEMA)
        .resume(WAIT_RESUME_SCHEMA)
        .handler(async (input, ctx) => {
        const pending = WAIT_CONTINUATION_SCHEMA.safeParse(ctx.continuation);
        let current;
        let result;
        if (pending.success) {
            result = await extractResult(pending.data.executionId, allOutputs);
        }
        else {
            current = await loadCurrentWorkflow(context, reference);
            const currentFullSchema = inferInputSchema(current.triggerNode, current.triggerType);
            const parsedInput = await resolveWorkflowToolInput(input, toolInputs, currentFullSchema, context, toolName);
            result = await executeWorkflow(current.workflow, current.triggerNode, parsedInput, {
                ...context,
                agentRun: agentRunOf(context, ctx),
                abortSignal: ctx.abortSignal,
            }, allOutputs, toolName);
        }
        if (result.status === 'waiting' && isWaitCancelled(ctx.resumeData)) {
            return {
                ...withoutWaitState(result),
                note: 'The user stopped waiting for this workflow. It is still paused — do not start it again.',
            };
        }
        if (result.status !== 'waiting')
            return withoutWaitState(result);
        const waiting = result;
        return await withWorkflowCancellation(waiting.executionId, reference.workflowId, ctx.abortSignal, async () => {
            result = await pollIfDueSoon(waiting, allOutputs, ctx.abortSignal);
            ctx.abortSignal?.throwIfAborted();
            if (result.status === 'waiting' && context.backgroundTasksEnabled) {
                const backgrounded = await backgroundWaitingExecution(result, context, ctx, reference, allOutputs);
                ctx.abortSignal?.throwIfAborted();
                if (backgrounded)
                    return backgrounded;
            }
            if (result.status !== 'waiting' || !supportsHitl)
                return withoutWaitState(result);
            current ??= await loadCurrentWorkflow(context, reference);
            ctx.abortSignal?.throwIfAborted();
            return await ctx.suspend(buildWaitCard(current.workflow.name, result.wait), {
                continuation: { executionId: result.executionId },
            });
        });
    });
    const built = builder.build();
    return {
        ...built,
        metadata: {
            kind: 'workflow',
            workflowId: reference.workflowId,
            workflowName: reference.workflowName,
            ...(triggerType !== undefined && { triggerType }),
        },
    };
}
async function loadCurrentWorkflow(context, reference) {
    const workflow = await context.workflowLoader.loadWorkflow(context.projectId, reference, {
        usePublishedVersion: context.usePublishedWorkflowVersion === true,
    });
    if (!workflow) {
        throw new workflow_tool_unavailable_error_1.WorkflowToolUnavailableError('not_found', `Workflow "${reference.workflowName}" is no longer accessible`);
    }
    validateCompatibility(workflow);
    const { node: triggerNode, triggerType } = detectTriggerNode(workflow);
    return { workflow, triggerNode, triggerType };
}
const toToolName = agent_config_composition_1.sanitizeToolName;
//# sourceMappingURL=workflow-tool-factory.js.map