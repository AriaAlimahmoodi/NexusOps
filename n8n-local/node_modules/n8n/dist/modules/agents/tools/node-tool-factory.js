"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveNodeTool = resolveNodeTool;
const tool_1 = require("@n8n/agents/tool");
const fromai_helpers_1 = require("@n8n/ai-utilities/fromai-helpers");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const node_execution_1 = require("../../../node-execution");
const node_types_1 = require("../../../node-types");
const policy_refusal_1 = require("./policy-refusal");
function toExecutorCredentials(credentials) {
    if (!credentials)
        return undefined;
    const out = {};
    for (const [slot, ref] of Object.entries(credentials)) {
        if ('__aiGatewayManaged' in ref) {
            out[slot] = { id: null, name: ref.name, __aiGatewayManaged: true };
        }
        else if (ref.id) {
            out[slot] = { id: ref.id, name: ref.name };
        }
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
function createNativeStringToolInputSchema(description) {
    return zod_1.z.preprocess((value) => (typeof value === 'string' ? { input: value } : value), zod_1.z.object({
        input: zod_1.z.string().describe(description),
    }));
}
async function resolveInputSchema(toolSchema, ctx) {
    const collectedArguments = (0, fromai_helpers_1.extractFromAIParameters)((toolSchema.node.nodeParameters ?? {}));
    if (collectedArguments.length > 0)
        return (0, fromai_helpers_1.createZodSchemaFromArgs)(collectedArguments);
    let nodeType;
    const nodeTypeName = (0, node_execution_1.resolveToolNodeType)(toolSchema.node.nodeType, toolSchema.node.nodeTypeVersion);
    try {
        nodeType = di_1.Container.get(node_types_1.NodeTypes).getByNameAndVersion(nodeTypeName, toolSchema.node.nodeTypeVersion);
    }
    catch {
        return { type: 'object', properties: {} };
    }
    if (typeof nodeType.supplyData === 'function') {
        const introspected = await ctx.executor.introspectSupplyDataToolSchema({
            projectId: ctx.projectId,
            nodeType: nodeTypeName,
            nodeTypeVersion: toolSchema.node.nodeTypeVersion,
            nodeParameters: toolSchema.node.nodeParameters,
            credentials: toExecutorCredentials(toolSchema.node.credentials) ?? null,
        });
        if (introspected)
            return introspected;
        return createNativeStringToolInputSchema(toolSchema.description ??
            nodeType.description.description ??
            `The query or input text to pass to ${toolSchema.node.nodeType}.`);
    }
    return { type: 'object', properties: {} };
}
async function resolveNodeTool(toolSchema, ctx) {
    const sanitizedName = (0, n8n_workflow_1.nodeNameToToolName)(toolSchema.name);
    const nodeType = (0, node_execution_1.resolveToolNodeType)(toolSchema.node.nodeType, toolSchema.node.nodeTypeVersion);
    const instrument = ctx.instrumentToolAdditionalData;
    const instrumentedExecution = instrument
        ? {
            nodeName: sanitizedName,
            configureAdditionalData: (additionalData) => instrument(additionalData, { toolName: sanitizedName, toolKind: 'node' }),
        }
        : {};
    const built = new tool_1.Tool(sanitizedName)
        .description(toolSchema.description ?? `Execute the ${nodeType} node`)
        .input(await resolveInputSchema(toolSchema, ctx))
        .handler(async (input) => {
        const result = await ctx.executor.executeInline({
            nodeType,
            nodeTypeVersion: toolSchema.node.nodeTypeVersion,
            nodeParameters: toolSchema.node.nodeParameters,
            credentialDetails: toExecutorCredentials(toolSchema.node.credentials),
            inputData: [{ json: input }],
            projectId: ctx.projectId,
            ...instrumentedExecution,
        });
        if (result.status === 'error' && result.violations) {
            return (0, policy_refusal_1.toPolicyRefusalResult)(result.error ?? result.violations[0].message, result.violations);
        }
        if (result.status === 'error') {
            throw new Error(result.error ?? `Node "${toolSchema.node.nodeType}" failed to execute`);
        }
        return result;
    })
        .build();
    return {
        ...built,
        metadata: {
            kind: 'node',
            nodeType: toolSchema.node.nodeType,
            nodeTypeVersion: toolSchema.node.nodeTypeVersion,
            displayName: toolSchema.name,
            nodeParameters: toolSchema.node.nodeParameters,
        },
    };
}
//# sourceMappingURL=node-tool-factory.js.map