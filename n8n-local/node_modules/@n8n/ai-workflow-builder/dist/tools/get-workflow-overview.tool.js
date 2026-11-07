"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_WORKFLOW_OVERVIEW_TOOL = void 0;
exports.createGetWorkflowOverviewTool = createGetWorkflowOverviewTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const node_helpers_1 = require("../utils/node-helpers");
const truncate_json_1 = require("../utils/truncate-json");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const mermaid_utils_1 = require("./utils/mermaid.utils");
const DISPLAY_TITLE = 'Getting workflow overview';
const getWorkflowOverviewSchema = zod_1.z.object({
    format: zod_1.z
        .enum(['mermaid', 'summary'])
        .optional()
        .default('mermaid')
        .describe('Output format: mermaid (visual diagram) or summary (text list)'),
    includeParameters: zod_1.z
        .boolean()
        .optional()
        .default(true)
        .describe('Include node parameters in the output (recommended to identify configuration issues)'),
});
function findTriggerNode(nodes) {
    return nodes.find((n) => (0, node_helpers_1.isTriggerNodeType)(n.type));
}
function countConnections(connections) {
    let count = 0;
    for (const sourceConns of Object.values(connections)) {
        if (typeof sourceConns === 'object' && sourceConns !== null) {
            for (const typeConns of Object.values(sourceConns)) {
                if (Array.isArray(typeConns)) {
                    for (const connArray of typeConns) {
                        if (Array.isArray(connArray)) {
                            count += connArray.length;
                        }
                    }
                }
            }
        }
    }
    return count;
}
function buildSummaryFormat(nodes, triggerNode, includeParameters) {
    const parts = ['<workflow_summary>'];
    parts.push(`Node count: ${nodes.length}`);
    if (triggerNode) {
        parts.push(`Trigger: ${triggerNode.name} [id: ${triggerNode.id}] (${triggerNode.type})`);
    }
    else {
        parts.push('Trigger: None');
    }
    parts.push('');
    parts.push('Nodes:');
    for (const node of nodes) {
        const nodeHeader = `- ${node.name} [id: ${node.id}] (${node.type})`;
        if (includeParameters && node.parameters && Object.keys(node.parameters).length > 0) {
            parts.push(nodeHeader);
            parts.push(`  Parameters: ${(0, truncate_json_1.truncateJson)(node.parameters, { indent: 0 })}`);
        }
        else {
            parts.push(nodeHeader);
        }
    }
    parts.push('</workflow_summary>');
    return parts.join('\n');
}
function buildMermaidFormat(workflow, triggerNode, includeParameters) {
    const parts = ['<workflow_overview>'];
    parts.push(`Node count: ${workflow.nodes.length}`);
    if (triggerNode) {
        parts.push(`Trigger: ${triggerNode.name} (${triggerNode.type})`);
    }
    else {
        parts.push('Trigger: None');
    }
    parts.push('');
    const mermaid = (0, mermaid_utils_1.mermaidStringify)({ workflow }, {
        includeNodeType: true,
        includeNodeParameters: includeParameters,
        includeNodeName: true,
    });
    parts.push(mermaid);
    parts.push('</workflow_overview>');
    return parts.join('\n');
}
exports.GET_WORKFLOW_OVERVIEW_TOOL = {
    toolName: 'get_workflow_overview',
    displayTitle: DISPLAY_TITLE,
};
function createGetWorkflowOverviewTool(logger) {
    const dynamicTool = (0, tools_1.tool)((input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.GET_WORKFLOW_OVERVIEW_TOOL.toolName, DISPLAY_TITLE);
        try {
            const validatedInput = getWorkflowOverviewSchema.parse(input);
            const { format, includeParameters } = validatedInput;
            reporter.start(validatedInput);
            const workflow = (0, state_1.getEffectiveWorkflow)();
            if (!workflow || workflow.nodes.length === 0) {
                const output = {
                    nodeCount: 0,
                    connectionCount: 0,
                    hasTrigger: false,
                    format,
                    message: 'Empty workflow',
                };
                reporter.complete(output);
                return (0, response_1.createSuccessResponse)(config, 'Empty workflow - no nodes to display');
            }
            const triggerNode = findTriggerNode(workflow.nodes);
            const connectionCount = countConnections(workflow.connections);
            logger?.debug(`Getting workflow overview: ${workflow.nodes.length} nodes, ${connectionCount} connections, format: ${format}`);
            let formattedOutput;
            if (format === 'summary') {
                formattedOutput = buildSummaryFormat(workflow.nodes, triggerNode, includeParameters);
            }
            else {
                formattedOutput = buildMermaidFormat(workflow, triggerNode, includeParameters);
            }
            const output = {
                nodeCount: workflow.nodes.length,
                connectionCount,
                hasTrigger: !!triggerNode,
                format,
                message: `Workflow has ${workflow.nodes.length} nodes with ${connectionCount} connections`,
            };
            reporter.complete(output);
            return (0, response_1.createSuccessResponse)(config, formattedOutput);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const validationError = new errors_1.ValidationError('Invalid input parameters', {
                    extra: { errors: error.errors },
                });
                reporter.error(validationError);
                return (0, response_1.createErrorResponse)(config, validationError);
            }
            const toolError = new errors_1.ToolExecutionError(error instanceof Error ? error.message : 'Unknown error occurred', {
                toolName: exports.GET_WORKFLOW_OVERVIEW_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.GET_WORKFLOW_OVERVIEW_TOOL.toolName,
        description: 'Get a high-level overview of the current workflow including a Mermaid flowchart diagram showing node connections and flow. Use this to understand the overall workflow structure before making changes.',
        schema: getWorkflowOverviewSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.GET_WORKFLOW_OVERVIEW_TOOL,
    };
}
//# sourceMappingURL=get-workflow-overview.tool.js.map