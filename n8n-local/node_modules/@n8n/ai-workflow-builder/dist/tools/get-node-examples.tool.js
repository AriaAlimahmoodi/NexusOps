"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetNodeConnectionExamplesTool = exports.createGetNodeConfigurationExamplesTool = void 0;
exports.createGetNodeExamplesTool = createGetNodeExamplesTool;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const errors_1 = require("../errors");
const helpers_1 = require("./helpers");
const mermaid_utils_1 = require("./utils/mermaid.utils");
const node_configuration_utils_1 = require("./utils/node-configuration.utils");
const templates_1 = require("./web/templates");
const nodeRequestSchema = zod_1.z.object({
    nodeType: zod_1.z.string().describe('The exact node type name (e.g., n8n-nodes-base.httpRequest)'),
    nodeVersion: zod_1.z
        .number()
        .optional()
        .describe('Optional specific node version to filter examples by'),
});
const getNodeExamplesSchema = zod_1.z.object({
    nodes: zod_1.z
        .array(nodeRequestSchema)
        .min(1)
        .max(10)
        .describe('List of nodes to get examples for (1-10 nodes)'),
});
const TOOL_CONFIG = {
    configuration: {
        meta: {
            toolName: 'get_node_configuration_examples',
            displayTitle: 'Getting node configuration examples',
        },
        description: `Get real-world parameter configuration examples for multiple node types from community templates.

Use this tool when you need reference examples for configuring node parameters:
- When you need to understand proper parameter structure
- To see how templated workflows configure specific integrations

Parameters:
- nodes: Array of objects with nodeType (required) and nodeVersion (optional)
  Example: [{ nodeType: "n8n-nodes-base.httpRequest" }, { nodeType: "n8n-nodes-base.gmail", nodeVersion: 2 }]

Returns markdown-formatted examples showing proven parameter configurations for each node.`,
    },
    connections: {
        meta: {
            toolName: 'get_node_connection_examples',
            displayTitle: 'Getting node connection examples',
        },
        description: `Get mermaid diagrams showing how specific node types are typically connected in real workflows.

Use this tool when you need to understand node connection patterns:
- When connecting nodes with non-standard output patterns (e.g., splitInBatches, Switch, IF)
- To see how nodes are typically placed in workflow flows
- To understand which nodes typically come before/after specific nodes

Parameters:
- nodes: Array of objects with nodeType (required) and nodeVersion (optional)
  Example: [{ nodeType: "n8n-nodes-base.splitInBatches" }, { nodeType: "n8n-nodes-base.if" }]

Returns mermaid diagrams from community workflows containing each node.`,
    },
};
async function getWorkflowsForNodeType(nodeType, logger) {
    let stateCachedTemplates = [];
    try {
        const state = (0, helpers_1.getWorkflowState)();
        stateCachedTemplates = state?.cachedTemplates ?? [];
    }
    catch {
    }
    const relevantFromState = stateCachedTemplates.filter((wf) => wf.workflow.nodes.some((n) => n.type === nodeType));
    if (relevantFromState.length > 0) {
        const nodeConfigs = (0, node_configuration_utils_1.getNodeConfigurationsFromTemplates)(relevantFromState, nodeType);
        logger?.debug('Found node configurations in state cache', {
            nodeType,
            configCount: nodeConfigs.length,
            workflowCount: relevantFromState.length,
        });
        return {
            workflows: relevantFromState,
            nodeConfigs,
            newTemplates: [],
        };
    }
    try {
        const result = await (0, templates_1.fetchWorkflowsFromTemplates)({ nodes: nodeType, rows: 5 }, { maxTemplates: 5, logger });
        if (result.workflows.length > 0) {
            const nodeConfigs = (0, node_configuration_utils_1.getNodeConfigurationsFromTemplates)(result.workflows, nodeType);
            logger?.debug('Fetched workflows from templates API', {
                nodeType,
                configCount: nodeConfigs.length,
                workflowCount: result.workflows.length,
            });
            return {
                workflows: result.workflows,
                nodeConfigs,
                newTemplates: result.workflows,
            };
        }
    }
    catch (error) {
        logger?.warn('Failed to fetch node examples from templates', { nodeType, error });
    }
    return {
        workflows: [],
        nodeConfigs: [],
        newTemplates: [],
    };
}
const MAX_EXAMPLES = 1;
function formatConnectionExamples(nodeType, workflows) {
    const shortNodeType = nodeType.split('.').pop() ?? nodeType;
    if (workflows.length === 0) {
        return `## Node Connection Examples: ${nodeType}\n\nNo connection examples found.`;
    }
    const lines = [
        `## Node Connection Examples: ${nodeType}`,
        '',
        `These mermaid diagrams show workflows containing **${shortNodeType}**.`,
        '',
        'Look for the target node in each diagram to understand:',
        '- Which nodes typically come BEFORE this node (incoming connections)',
        '- Which nodes typically come AFTER this node (outgoing connections)',
        '- For multi-output nodes like splitInBatches: output 0 = "done" branch, output 1 = "loop" branch',
        '',
    ];
    for (const workflow of workflows.slice(0, MAX_EXAMPLES)) {
        const mermaid = (0, mermaid_utils_1.mermaidStringify)(workflow, { includeNodeParameters: false });
        lines.push(`### Example: ${workflow.name}`, '', '```mermaid', mermaid, '```', '');
    }
    return lines.join('\n');
}
function handleToolError(error, reporter, toolName, config) {
    if (error instanceof zod_1.z.ZodError) {
        const validationError = new errors_1.ValidationError('Invalid input parameters', {
            extra: { errors: error.errors },
        });
        reporter.error(validationError);
        return (0, helpers_1.createErrorResponse)(config, validationError);
    }
    const toolError = new errors_1.ToolExecutionError(error instanceof Error ? error.message : 'Unknown error occurred', { toolName, cause: error instanceof Error ? error : undefined });
    reporter.error(toolError);
    return (0, helpers_1.createErrorResponse)(config, toolError);
}
function createGetNodeExamplesTool({ exampleType, logger }) {
    const { meta: toolMeta, description } = TOOL_CONFIG[exampleType];
    const dynamicTool = (0, tools_1.tool)(async (input, config) => {
        const reporter = (0, helpers_1.createProgressReporter)(config, toolMeta.toolName, toolMeta.displayTitle);
        try {
            const validatedInput = getNodeExamplesSchema.parse(input);
            const { nodes } = validatedInput;
            reporter.start(validatedInput);
            (0, helpers_1.reportProgress)(reporter, `Fetching examples for ${nodes.length} node(s)...`);
            const results = await Promise.all(nodes.map(async ({ nodeType }) => await getWorkflowsForNodeType(nodeType, logger)));
            const allNewTemplates = [];
            let totalFound = 0;
            const allMessages = nodes.map(({ nodeType, nodeVersion }, i) => {
                const result = results[i];
                allNewTemplates.push(...result.newTemplates);
                totalFound +=
                    exampleType === 'configuration' ? result.nodeConfigs.length : result.workflows.length;
                return exampleType === 'configuration'
                    ? (0, node_configuration_utils_1.formatNodeConfigurationExamples)(nodeType, result.nodeConfigs, nodeVersion)
                    : formatConnectionExamples(nodeType, result.workflows);
            });
            const combinedMessage = allMessages.join('\n\n---\n\n');
            const nodeTypes = nodes.map((n) => n.nodeType);
            reporter.complete({ nodeTypes, totalFound, message: combinedMessage });
            const stateUpdates = {};
            if (allNewTemplates.length > 0) {
                stateUpdates.cachedTemplates = allNewTemplates;
            }
            return (0, helpers_1.createSuccessResponse)(config, combinedMessage, Object.keys(stateUpdates).length > 0 ? stateUpdates : undefined);
        }
        catch (error) {
            return handleToolError(error, reporter, toolMeta.toolName, config);
        }
    }, {
        name: toolMeta.toolName,
        description,
        schema: getNodeExamplesSchema,
    });
    return { tool: dynamicTool, ...toolMeta };
}
const createGetNodeConfigurationExamplesTool = (logger) => createGetNodeExamplesTool({ exampleType: 'configuration', logger });
exports.createGetNodeConfigurationExamplesTool = createGetNodeConfigurationExamplesTool;
const createGetNodeConnectionExamplesTool = (logger) => createGetNodeExamplesTool({ exampleType: 'connections', logger });
exports.createGetNodeConnectionExamplesTool = createGetNodeConnectionExamplesTool;
//# sourceMappingURL=get-node-examples.tool.js.map