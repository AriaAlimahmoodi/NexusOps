"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkflowDetailsTool = void 0;
exports.getWorkflowDetails = getWorkflowDetails;
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const schemas_1 = require("./schemas");
const tool_error_utils_1 = require("./tool-error.utils");
const webhook_utils_1 = require("./webhook-utils");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const inputSchema = {
    workflowId: zod_1.default.string().describe('The ID of the workflow to retrieve'),
    detailLevel: zod_1.default
        .enum(['full', 'execution'])
        .default('full')
        .describe("Level of detail to return. 'full' (default) includes the complete workflow payload. 'execution' returns only the workflow metadata and trigger information needed to run it — prefer it when the goal is just to execute the workflow via execute_workflow."),
};
const SUPPORTED_TRIGGER_TYPES = Object.keys(mcp_constants_1.SUPPORTED_MCP_TRIGGERS);
const splitTriggers = (candidates) => {
    const enabledNodes = candidates.filter((node) => node.disabled !== true);
    return {
        supported: enabledNodes.filter((node) => SUPPORTED_TRIGGER_TYPES.includes(node.type)),
        unsupported: enabledNodes.filter((node) => (0, n8n_workflow_1.isTriggerNodeType)(node.type) && !SUPPORTED_TRIGGER_TYPES.includes(node.type)),
    };
};
const toActiveVersionSummary = (workflow) => {
    if (!workflow.activeVersionId || !workflow.activeVersion)
        return null;
    if (workflow.activeVersionId === workflow.versionId)
        return { sameAsDraft: true };
    const publishedNodes = (0, schemas_1.ensureNodeParameters)(workflow.activeVersion.nodes ?? []);
    return {
        sameAsDraft: false,
        nodes: publishedNodes.map(schemas_1.sanitizeNodeCredentials),
        connections: workflow.activeVersion.connections ?? {},
        nodeGroups: (0, schemas_1.toNodeGroupSummary)(workflow.activeVersion.nodeGroups ?? [], publishedNodes),
    };
};
const outputSchema = schemas_1.workflowDetailsOutputSchema.shape;
const createWorkflowDetailsTool = (user, baseWebhookUrl, workflowFinderService, credentialsService, nodeTypes, endpoints, telemetry, roleService, projectService, testBaseWebhookUrl = baseWebhookUrl) => {
    return {
        name: 'get_workflow_details',
        config: {
            description: 'Get detailed information about a specific workflow including trigger details',
            inputSchema,
            outputSchema,
            annotations: {
                title: 'Get Workflow Details',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        handler: async ({ workflowId, detailLevel, }) => {
            const parameters = { workflowId, detailLevel };
            const telemetryPayload = {
                user_id: user.id,
                tool_name: 'get_workflow_details',
                parameters,
            };
            try {
                const payload = await getWorkflowDetails(user, baseWebhookUrl, workflowFinderService, credentialsService, nodeTypes, endpoints, roleService, projectService, { workflowId, detailLevel }, testBaseWebhookUrl);
                telemetryPayload.results = {
                    success: true,
                    data: {
                        workflow_id: workflowId,
                        workflow_name: payload.workflow.name,
                        trigger_count: payload.workflow.triggerCount,
                        node_count: payload.workflow.nodeCount,
                    },
                };
                telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(payload) }],
                    structuredContent: payload,
                };
            }
            catch (error) {
                (0, tool_error_utils_1.trackAndRethrowToolError)(telemetry, telemetryPayload, error);
            }
        },
    };
};
exports.createWorkflowDetailsTool = createWorkflowDetailsTool;
async function getWorkflowDetails(user, baseWebhookUrl, workflowFinderService, credentialsService, nodeTypes, endpoints, roleService, projectService, { workflowId, detailLevel = 'full' }, testBaseWebhookUrl = baseWebhookUrl) {
    const includeGraph = detailLevel === 'full';
    const workflow = await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:read'], workflowFinderService, {
        includeActiveVersion: true,
        includeTags: true,
        includeParentFolder: true,
        publishHistory: 'none',
    });
    const projectRelations = await projectService.getProjectRelationsForUser(user);
    const workflowWithScopes = roleService.addScopes(workflow, user, projectRelations);
    const scopes = workflowWithScopes.scopes ?? [];
    const canExecute = scopes.includes('workflow:execute');
    const nodes = (0, schemas_1.ensureNodeParameters)(workflow.nodes ?? []);
    const noticeFor = async ({ supported, unsupported }) => await (0, webhook_utils_1.getTriggerDetails)(user, supported, unsupported, baseWebhookUrl, credentialsService, nodeTypes, endpoints, workflow.id, testBaseWebhookUrl);
    const draftTriggers = splitTriggers(nodes);
    const triggerNotice = await noticeFor(draftTriggers);
    const hasDivergedPublishedVersion = workflow.activeVersionId !== null && workflow.activeVersionId !== workflow.versionId;
    const publishedNodes = hasDivergedPublishedVersion ? workflow.activeVersion?.nodes : undefined;
    let activeVersionTriggerNotice;
    if (publishedNodes) {
        const publishedTriggers = splitTriggers((0, schemas_1.ensureNodeParameters)(publishedNodes));
        if (JSON.stringify(publishedTriggers) !== JSON.stringify(draftTriggers)) {
            const publishedNotice = await noticeFor(publishedTriggers);
            if (publishedNotice !== triggerNotice) {
                activeVersionTriggerNotice = publishedNotice;
            }
        }
    }
    const sanitizedWorkflow = {
        id: workflow.id,
        name: workflow.name,
        active: workflow.activeVersionId !== null,
        isArchived: workflow.isArchived,
        versionId: workflow.versionId,
        activeVersionId: workflow.activeVersionId,
        triggerCount: workflow.triggerCount,
        nodeCount: nodes.length,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
        settings: workflow.settings ?? null,
        tags: (0, schemas_1.toTagSummary)(workflow.tags),
        parentFolderId: workflow.parentFolder?.id ?? null,
        description: workflow.description ?? undefined,
        scopes,
        canExecute,
        ...(includeGraph
            ? {
                connections: workflow.connections ?? {},
                nodes: nodes.map(schemas_1.sanitizeNodeCredentials),
                nodeGroups: (0, schemas_1.toNodeGroupSummary)(workflow.nodeGroups ?? [], nodes),
                activeVersion: toActiveVersionSummary(workflow),
                meta: workflow.meta ?? null,
            }
            : {}),
    };
    return {
        workflow: sanitizedWorkflow,
        triggerInfo: triggerNotice,
        activeVersionTriggerInfo: activeVersionTriggerNotice,
    };
}
//# sourceMappingURL=get-workflow-details.tool.js.map