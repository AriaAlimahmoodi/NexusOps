"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetWorkflowVersionsDiffTool = void 0;
exports.getWorkflowVersionsDiff = getWorkflowVersionsDiff;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const json_diff_1 = require("json-diff");
const omit_1 = __importDefault(require("lodash/omit"));
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const schemas_1 = require("./schemas");
const workflow_history_utils_1 = require("./workflow-history.utils");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const inputSchema = {
    workflowId: zod_1.default.string().describe('The ID of the workflow the versions belong to'),
    fromVersionId: zod_1.default
        .string()
        .describe('The base (older) version ID, as returned by get_workflow_history'),
    toVersionId: zod_1.default
        .string()
        .describe('The target (newer) version ID, as returned by get_workflow_history'),
};
const nodeChangeSummarySchema = zod_1.default.object({
    id: zod_1.default.string(),
    name: zod_1.default.string(),
    type: zod_1.default.string(),
});
const modifiedNodeSchema = nodeChangeSummarySchema.extend({
    changes: zod_1.default
        .record(zod_1.default.string(), zod_1.default.unknown())
        .describe('Field-level delta in json-diff format: changed values appear as { __old, __new }, added keys as "<key>__added", removed keys as "<key>__deleted", array changes as [op, value] tuples.'),
});
const connectionChangeSchema = zod_1.default.object({
    from: zod_1.default
        .string()
        .describe('Source node name, using its target-version name, or its base-version name if the node no longer exists there'),
    to: zod_1.default
        .string()
        .describe('Target node name, using its target-version name, or its base-version name if the node no longer exists there'),
    type: zod_1.default.string().describe("Connection type (e.g. 'main', 'ai_tool')"),
    fromOutput: zod_1.default
        .number()
        .describe('Index of the source node output (e.g. 0 = true branch, 1 = false branch on an If)'),
    toInput: zod_1.default.number().describe('Index of the target node input (e.g. 1 = second input of a Merge)'),
});
const outputSchema = {
    success: zod_1.default.boolean(),
    workflowId: zod_1.default.string(),
    fromVersionId: zod_1.default.string(),
    toVersionId: zod_1.default.string(),
    nodesAdded: zod_1.default
        .array(schemas_1.nodeSchema)
        .describe('Full content of nodes present in the target version but not in the base version (credentials reduced to { id, name }), so the diff is self-contained'),
    nodesRemoved: zod_1.default
        .array(nodeChangeSummarySchema)
        .describe('Nodes present in the base version but not in the target version. Fetch the base version with get_workflow_version if you need their content.'),
    nodesModified: zod_1.default
        .array(modifiedNodeSchema)
        .describe('Nodes present in both versions whose content changed (position-only moves are not reported). Listed by their name in the target version.'),
    connectionsAdded: zod_1.default
        .array(connectionChangeSchema)
        .describe('Connections present in the target version but not the base version. Renaming a node does not by itself produce connection changes; endpoints are matched by node id.'),
    connectionsRemoved: zod_1.default
        .array(connectionChangeSchema)
        .describe('Connections present in the base version but not the target version.'),
    error: zod_1.default.string().optional(),
};
const IGNORED_NODE_PROPS = ['position'];
const structuredDiff = json_diff_1.diff;
function diffNodeContents(fromNode, toNode) {
    return structuredDiff((0, omit_1.default)((0, schemas_1.sanitizeNodeCredentials)(fromNode), IGNORED_NODE_PROPS), (0, omit_1.default)((0, schemas_1.sanitizeNodeCredentials)(toNode), IGNORED_NODE_PROPS));
}
function toNodeChangeSummary(node) {
    return { id: node.id, name: node.name, type: node.type };
}
function toIdKeyedConnections(connections, nodes) {
    const idByName = new Map(nodes.map((node) => [node.name, node.id]));
    const keyed = {};
    for (const [sourceName, byType] of Object.entries(connections)) {
        keyed[idByName.get(sourceName) ?? sourceName] = Object.fromEntries(Object.entries(byType).map(([type, outputs]) => [
            type,
            outputs.map((connections) => connections?.map((connection) => ({
                ...connection,
                node: idByName.get(connection.node) ?? connection.node,
            })) ?? null),
        ]));
    }
    return keyed;
}
function flattenConnectionsDiff(connectionsDiff, nameById) {
    const changes = [];
    for (const [from, byType] of Object.entries(connectionsDiff)) {
        for (const [type, entries] of Object.entries(byType)) {
            for (const entry of entries) {
                if (!entry.value)
                    continue;
                const { node, index } = entry.value.connection;
                changes.push({
                    from: nameById.get(from) ?? from,
                    to: nameById.get(node) ?? node,
                    type,
                    fromOutput: entry.sourceIndex,
                    toInput: index,
                });
            }
        }
    }
    return changes;
}
const createGetWorkflowVersionsDiffTool = (user, workflowFinderService, workflowHistoryService, telemetry) => ({
    name: 'get_workflow_versions_diff',
    config: {
        description: 'Compare two saved versions of a workflow and return what changed between them: nodes added (with their full content), removed, or modified (with a field-level delta per modified node) and connections added or removed. Pass the older version as fromVersionId and the newer one as toVersionId, using version IDs from get_workflow_history.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Get Workflow Versions Diff',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, fromVersionId, toVersionId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'get_workflow_versions_diff',
            parameters: { workflowId },
        };
        try {
            const payload = await getWorkflowVersionsDiff(user, workflowFinderService, workflowHistoryService, { workflowId, fromVersionId, toVersionId });
            const output = { success: true, ...payload };
            telemetryPayload.results = {
                success: true,
                data: { workflow_id: workflowId },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (er) {
            const error = (0, ensure_error_1.ensureError)(er);
            const isAccessError = error instanceof mcp_errors_1.WorkflowAccessError;
            const output = {
                success: false,
                workflowId,
                fromVersionId,
                toVersionId,
                nodesAdded: [],
                nodesRemoved: [],
                nodesModified: [],
                connectionsAdded: [],
                connectionsRemoved: [],
                error: error.message,
            };
            telemetryPayload.results = {
                success: false,
                error: error.message,
                error_reason: isAccessError ? error.reason : undefined,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createGetWorkflowVersionsDiffTool = createGetWorkflowVersionsDiffTool;
async function getWorkflowVersionsDiff(user, workflowFinderService, workflowHistoryService, { workflowId, fromVersionId, toVersionId }) {
    await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:read'], workflowFinderService);
    const [fromVersion, toVersion] = await Promise.all([
        (0, workflow_history_utils_1.getMcpWorkflowVersion)(workflowHistoryService, user, workflowId, fromVersionId),
        (0, workflow_history_utils_1.getMcpWorkflowVersion)(workflowHistoryService, user, workflowId, toVersionId),
    ]);
    const fromNodes = (0, schemas_1.ensureNodeParameters)(fromVersion.nodes ?? []);
    const toNodes = (0, schemas_1.ensureNodeParameters)(toVersion.nodes ?? []);
    const nodeDiff = (0, n8n_workflow_1.compareWorkflowsNodes)(fromNodes, toNodes);
    const toNodesById = new Map(toNodes.map((node) => [node.id, node]));
    const nodesAdded = [];
    const nodesRemoved = [];
    const nodesModified = [];
    for (const { status, node } of nodeDiff.values()) {
        if (status === "added")
            nodesAdded.push((0, schemas_1.sanitizeNodeCredentials)(node));
        else if (status === "deleted")
            nodesRemoved.push(toNodeChangeSummary(node));
        else if (status === "modified") {
            const toNode = toNodesById.get(node.id);
            if (!toNode)
                continue;
            nodesModified.push({
                ...toNodeChangeSummary(toNode),
                changes: diffNodeContents(node, toNode) ?? {},
            });
        }
    }
    const nameById = new Map([...fromNodes, ...toNodes].map((node) => [node.id, node.name]));
    const connectionsDiff = (0, n8n_workflow_1.compareConnections)(toIdKeyedConnections(fromVersion.connections ?? {}, fromNodes), toIdKeyedConnections(toVersion.connections ?? {}, toNodes));
    return {
        workflowId,
        fromVersionId: fromVersion.versionId,
        toVersionId: toVersion.versionId,
        nodesAdded,
        nodesRemoved,
        nodesModified,
        connectionsAdded: flattenConnectionsDiff(connectionsDiff.added, nameById),
        connectionsRemoved: flattenConnectionsDiff(connectionsDiff.removed, nameById),
    };
}
//# sourceMappingURL=get-workflow-versions-diff.tool.js.map