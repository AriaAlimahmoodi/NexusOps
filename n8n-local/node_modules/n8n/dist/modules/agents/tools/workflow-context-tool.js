"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkflowContextTool = createWorkflowContextTool;
const tool_1 = require("@n8n/agents/tool");
const zod_1 = require("zod");
const agent_data_utils_1 = require("./agent-data-utils");
const DESCRIPTION = 'Inspect data produced by OTHER earlier nodes in this workflow. ' +
    'Call without arguments to list the nodes that have executed so far. ' +
    'Call with a nodeName to read that node output (last run). ' +
    'Pass a JMESPath query together with a nodeName to extract a specific part of large output.';
function lastRunMainItems(runs) {
    const lastRun = runs[runs.length - 1];
    const mainBranches = lastRun?.data?.main ?? [];
    return mainBranches.flatMap((branch) => branch ?? []);
}
function lastRunMainItemCount(runs) {
    const lastRun = runs[runs.length - 1];
    const mainBranches = lastRun?.data?.main ?? [];
    return mainBranches.reduce((count, branch) => count + (branch?.length ?? 0), 0);
}
function createWorkflowContextTool(context) {
    const nodeTypesByName = new Map((context.nodes ?? []).map((node) => [node.name, node.type]));
    return (new tool_1.Tool('fetch_workflow_context')
        .description(DESCRIPTION)
        .input(zod_1.z.object({
        nodeName: zod_1.z
            .string()
            .optional()
            .describe('Name of an executed node whose output data to fetch. Omit to list all executed nodes.'),
        query: zod_1.z
            .string()
            .optional()
            .describe(`JMESPath query to retrieve a specific part of the node output, untrimmed. ${agent_data_utils_1.ITEM_SHAPE_HINT} ${agent_data_utils_1.QUERY_WHEN_TRUNCATED_HINT}`),
    }))
        .systemInstruction('To inspect data produced by OTHER earlier nodes in this workflow, call ' +
        'fetch_workflow_context with no arguments to list executed nodes, then with a nodeName ' +
        `to read that node output. ${agent_data_utils_1.ITEM_SHAPE_HINT} For a query, also pass a nodeName. ${agent_data_utils_1.QUERY_WHEN_TRUNCATED_HINT}`)
        .handler(async ({ nodeName, query }) => {
        try {
            const runData = context.runExecutionData.resultData.runData;
            if (!nodeName) {
                if (query) {
                    return { error: 'Specify a nodeName to run a query against that node output.' };
                }
                return {
                    workflow: { id: context.workflowId ?? null, name: context.workflowName ?? null },
                    invokedBy: context.callingNodeName,
                    executedNodes: Object.entries(runData).map(([name, runs]) => ({
                        name,
                        type: nodeTypesByName.get(name) ?? 'unknown',
                        status: runs[runs.length - 1]?.executionStatus ?? 'unknown',
                        runs: runs.length,
                        items: lastRunMainItemCount(runs),
                    })),
                };
            }
            const runs = Object.hasOwn(runData, nodeName) ? runData[nodeName] : undefined;
            if (!runs?.length) {
                return {
                    error: `No execution data found for node '${nodeName}'.`,
                    availableNodes: Object.keys(runData),
                };
            }
            const allItems = lastRunMainItems(runs);
            if (query) {
                return { nodeName, query, ...(0, agent_data_utils_1.queryItems)(allItems, query) };
            }
            const { items, truncated } = (0, agent_data_utils_1.trimItems)(allItems);
            return {
                nodeName,
                status: runs[runs.length - 1]?.executionStatus ?? 'unknown',
                runs: runs.length,
                totalItems: allItems.length,
                items,
                truncated,
            };
        }
        catch (error) {
            return { error: `Failed to read workflow context: ${error.message}` };
        }
    })
        .build());
}
//# sourceMappingURL=workflow-context-tool.js.map