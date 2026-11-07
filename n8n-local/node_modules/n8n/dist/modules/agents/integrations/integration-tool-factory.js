"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntegrationToolConnectionDescriptors = getIntegrationToolConnectionDescriptors;
exports.buildIntegrationConnectionId = buildIntegrationConnectionId;
exports.createIntegrationContextTool = createIntegrationContextTool;
exports.createIntegrationActionTool = createIntegrationActionTool;
const agents_1 = require("@n8n/agents");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const integration_tool_definitions_1 = require("./integration-tool-definitions");
const integration_tool_descriptions_1 = require("./integration-tool-descriptions");
const integration_tool_execution_1 = require("./integration-tool-execution");
const integration_error_codes_1 = require("./integration-error-codes");
const integration_tool_schema_1 = require("./integration-tool-schema");
const integrationActionSuspendSchema = zod_1.z.object({
    type: zod_1.z.literal('integration_action'),
    action: zod_1.z.string(),
    integrationConnectionId: zod_1.z.string(),
    messageContext: zod_1.z.unknown(),
});
const actionSuspendSchema = zod_1.z.union([integrationActionSuspendSchema, agents_1.APPROVAL_SUSPEND_SCHEMA]);
function getIntegrationToolConnectionDescriptors(integrations, agentId, capabilitiesFor) {
    const sorted = [...integrations].sort((a, b) => {
        const byType = a.type.localeCompare(b.type);
        if (byType !== 0)
            return byType;
        return a.credentialId.localeCompare(b.credentialId);
    });
    const seenByType = new Map();
    return sorted.map((integration) => {
        const seenCount = seenByType.get(integration.type) ?? 0;
        const nextCount = seenCount + 1;
        seenByType.set(integration.type, nextCount);
        const suffix = nextCount === 1 ? '' : `_${nextCount}`;
        const baseName = `${integration.type}${suffix}`;
        const capabilities = capabilitiesFor?.(integration);
        const contextToolDefinitions = getContextToolDefinitions(capabilities);
        const actionToolDefinitions = getActionToolDefinitions(capabilities);
        return {
            agentId,
            integration,
            integrationConnectionId: buildIntegrationConnectionId(integration),
            contextToolName: `${baseName}_context`,
            actionToolName: `${baseName}_action`,
            contextQueries: contextToolDefinitions.map((definition) => definition.name),
            actions: actionToolDefinitions.map((definition) => definition.name),
            contextToolDefinitions,
            actionToolDefinitions,
            contextToolGuidance: capabilities?.contextToolGuidance,
            actionToolGuidance: capabilities?.actionToolGuidance,
            ...('approval' in integration && integration.approval
                ? { approval: integration.approval }
                : {}),
        };
    });
}
function buildIntegrationConnectionId(integration) {
    return integration.credentialId === undefined
        ? integration.type
        : `${integration.type}:${integration.credentialId}`;
}
function createIntegrationContextTool(params) {
    const { descriptor, queryExecutor } = params;
    return new agents_1.Tool(descriptor.contextToolName)
        .description((0, integration_tool_descriptions_1.buildContextToolDescription)(descriptor))
        .input((0, integration_tool_schema_1.buildContextInputSchema)(descriptor.contextToolDefinitions))
        .handler(async (input, ctx) => {
        const toolInput = input;
        if (toolInput.queries !== undefined) {
            const results = await Promise.all(toolInput.queries.map(async (rawOperation) => {
                const operation = (0, integration_tool_schema_1.toSingleContextOperation)(rawOperation);
                return {
                    query: operation.query,
                    result: await (0, integration_tool_execution_1.executeContextToolOperation)({
                        operation,
                        descriptor,
                        queryExecutor,
                        persistence: ctx.persistence,
                    }),
                };
            }));
            return { ok: true, results };
        }
        return await (0, integration_tool_execution_1.executeContextToolOperation)({
            operation: (0, integration_tool_schema_1.toSingleContextOperation)(toolInput),
            descriptor,
            queryExecutor,
            persistence: ctx.persistence,
        });
    });
}
function createIntegrationActionTool(params) {
    const { descriptor, messageContextStore, actionExecutor } = params;
    return new agents_1.Tool(descriptor.actionToolName)
        .description((0, integration_tool_descriptions_1.buildActionToolDescription)(descriptor))
        .input((0, integration_tool_schema_1.buildActionInputSchema)(descriptor.actionToolDefinitions))
        .suspend(actionSuspendSchema)
        .resume(integration_tool_execution_1.INTEGRATION_ACTION_RESUME_SCHEMA)
        .endsTurnWhen(integration_tool_execution_1.isSilentActionOutput)
        .handler(async (input, ctx) => {
        const interruptCtx = ctx;
        const approvalDecision = readApprovalDecision(interruptCtx);
        if (approvalDecision === undefined && ctx.resumeData) {
            return ctx.resumeData;
        }
        if (approvalDecision) {
            const { action, ...decision } = approvalDecision;
            if (decision.scope === 'session' && !ctx.approvalContext) {
                throw new n8n_workflow_1.UserError('Session approvals are not available for this tool.');
            }
            await ctx.approvalContext?.onDecision((0, integration_tool_execution_1.integrationActionApprovalKey)(descriptor.integrationConnectionId, action), decision);
            ctx.abortSignal?.throwIfAborted();
        }
        if (approvalDecision?.approved === false) {
            return {
                ok: false,
                error: {
                    code: integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_DECLINED,
                    message: `The action "${approvalDecision.action}" was not approved.`,
                },
            };
        }
        const toolInput = input;
        if (toolInput.actions !== undefined) {
            return await (0, integration_tool_execution_1.executeActionToolBatch)({
                operations: toolInput.actions.map(integration_tool_schema_1.toSingleActionOperation),
                descriptor,
                messageContextStore,
                actionExecutor,
                ctx,
            });
        }
        return await (0, integration_tool_execution_1.executeActionToolOperation)({
            operation: (0, integration_tool_schema_1.toSingleActionOperation)(toolInput),
            descriptor,
            messageContextStore,
            actionExecutor,
            ctx,
            interruptCtx,
            allowSuspend: true,
            ...(approvalDecision ? { approvedAction: approvalDecision.action } : {}),
        });
    });
}
function readApprovalDecision(ctx) {
    const payload = agents_1.APPROVAL_SUSPEND_SCHEMA.safeParse(ctx.suspendPayload);
    if (!payload.success)
        return undefined;
    const resume = agents_1.APPROVAL_RESUME_SCHEMA.safeParse(ctx.resumeData);
    return {
        action: payload.data.toolName,
        ...(resume.success ? resume.data : { approved: false }),
    };
}
function getContextToolDefinitions(capabilities) {
    if (capabilities?.contextToolDefinitions)
        return [...capabilities.contextToolDefinitions];
    if (capabilities?.contextQueries)
        return (0, integration_tool_definitions_1.resolveIntegrationContextQueryDefinitions)(capabilities.contextQueries);
    return [...integration_tool_definitions_1.DEFAULT_INTEGRATION_CONTEXT_TOOL_DEFINITIONS];
}
function getActionToolDefinitions(capabilities) {
    if (capabilities?.actionToolDefinitions)
        return [...capabilities.actionToolDefinitions];
    if (capabilities?.actions)
        return (0, integration_tool_definitions_1.resolveIntegrationActionDefinitions)(capabilities.actions);
    return [...integration_tool_definitions_1.DEFAULT_INTEGRATION_ACTION_TOOL_DEFINITIONS];
}
//# sourceMappingURL=integration-tool-factory.js.map