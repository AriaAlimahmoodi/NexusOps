"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPDATING_NODE_PARAMETER_TOOL = void 0;
exports.createUpdateNodeParametersTool = createUpdateNodeParametersTool;
const tools_1 = require("@langchain/core/tools");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const trim_workflow_context_1 = require("../utils/trim-workflow-context");
const parameter_updater_1 = require("../chains/parameter-updater");
const errors_1 = require("../errors");
const progress_1 = require("./helpers/progress");
const response_1 = require("./helpers/response");
const state_1 = require("./helpers/state");
const validation_1 = require("./helpers/validation");
const parameter_update_utils_1 = require("./utils/parameter-update.utils");
const updateNodeParametersSchema = zod_1.z.object({
    nodeId: zod_1.z.string().describe('The ID of the node to update'),
    changes: zod_1.z
        .array(zod_1.z.string())
        .min(1)
        .describe('Array of natural language changes to apply to the node parameters (e.g., "Set the URL to call the weather API", "Add an API key header")'),
});
function isHiddenByCondition(displayOptions, conditionKey, value) {
    const showCondition = displayOptions?.show?.[conditionKey];
    if (showCondition && !(0, n8n_workflow_1.checkConditions)(showCondition, [value])) {
        return true;
    }
    const hideCondition = displayOptions?.hide?.[conditionKey];
    if (hideCondition && (0, n8n_workflow_1.checkConditions)(hideCondition, [value])) {
        return true;
    }
    return false;
}
function isINodePropertyOptions(item) {
    return (typeof item === 'object' &&
        item !== null &&
        'value' in item &&
        'name' in item &&
        !('values' in item));
}
function isINodePropertyCollection(item) {
    if (typeof item !== 'object' || item === null)
        return false;
    if (!('values' in item) || !('name' in item))
        return false;
    return Array.isArray(item.values);
}
function isINodeProperties(item) {
    return (typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        'name' in item &&
        'default' in item);
}
function isItemHiddenForContext(displayOptions, nodeVersion, currentValues) {
    if (!displayOptions)
        return false;
    if (isHiddenByCondition(displayOptions, '@version', nodeVersion))
        return true;
    const resource = currentValues.resource;
    if (typeof resource === 'string' && isHiddenByCondition(displayOptions, 'resource', resource)) {
        return true;
    }
    const operation = currentValues.operation;
    if (typeof operation === 'string' &&
        isHiddenByCondition(displayOptions, 'operation', operation)) {
        return true;
    }
    return false;
}
function filterPropertyRecursively(property, nodeVersion, currentValues) {
    if (!property.options || property.options.length === 0) {
        return property;
    }
    const { type, options } = property;
    if (type === 'options' || type === 'multiOptions') {
        const filteredOptions = [];
        for (const opt of options) {
            if (isINodePropertyOptions(opt)) {
                if (!isItemHiddenForContext(opt.displayOptions, nodeVersion, currentValues)) {
                    filteredOptions.push(opt);
                }
            }
        }
        return { ...property, options: filteredOptions };
    }
    if (type === 'collection') {
        const filteredOptions = [];
        for (const prop of options) {
            if (isINodeProperties(prop)) {
                if (!isItemHiddenForContext(prop.displayOptions, nodeVersion, currentValues)) {
                    filteredOptions.push(filterPropertyRecursively(prop, nodeVersion, currentValues));
                }
            }
        }
        return { ...property, options: filteredOptions };
    }
    if (type === 'fixedCollection') {
        const filteredOptions = [];
        for (const coll of options) {
            if (isINodePropertyCollection(coll)) {
                const filteredValues = [];
                for (const prop of coll.values) {
                    if (!isItemHiddenForContext(prop.displayOptions, nodeVersion, currentValues)) {
                        filteredValues.push(filterPropertyRecursively(prop, nodeVersion, currentValues));
                    }
                }
                filteredOptions.push({ ...coll, values: filteredValues });
            }
        }
        return { ...property, options: filteredOptions };
    }
    return property;
}
function isPropertyVisibleForContext(property, nodeVersion, currentValues) {
    const displayOptions = property.displayOptions;
    if (!displayOptions) {
        return true;
    }
    if (isHiddenByCondition(displayOptions, '@version', nodeVersion)) {
        return false;
    }
    const resource = currentValues.resource;
    const operation = currentValues.operation;
    if (typeof resource === 'string' && isHiddenByCondition(displayOptions, 'resource', resource)) {
        return false;
    }
    if (typeof operation === 'string' &&
        isHiddenByCondition(displayOptions, 'operation', operation)) {
        return false;
    }
    return true;
}
function filterPropertiesForContext(properties, node, _nodeType, currentValues) {
    const nodeVersion = node.typeVersion;
    return (properties
        .filter((property) => isPropertyVisibleForContext(property, nodeVersion, currentValues))
        .map((property) => filterPropertyRecursively(property, nodeVersion, currentValues)));
}
function buildSuccessMessage(node, _changes) {
    return `Updated "${node.name}" (${node.type})`;
}
async function processParameterUpdates(node, nodeType, nodeId, changes, state, llm, logger, instanceUrl) {
    const workflow = (0, state_1.getCurrentWorkflow)(state);
    const currentParameters = (0, parameter_update_utils_1.extractNodeParameters)(node);
    const formattedChanges = (0, parameter_update_utils_1.formatChangesForPrompt)(changes);
    const currentValues = node.parameters ?? {};
    const filteredProperties = filterPropertiesForContext(nodeType.properties || [], node, nodeType, currentValues);
    const filteredPropertiesJson = JSON.stringify(filteredProperties, null, 2);
    logger?.debug('Filtered node properties for LLM context', {
        nodeId,
        nodeType: node.type,
        nodeVersion: node.typeVersion,
        resource: currentValues.resource,
        operation: currentValues.operation,
        originalCount: nodeType.properties?.length ?? 0,
        filteredCount: filteredProperties.length,
    });
    const parametersChain = (0, parameter_updater_1.createParameterUpdaterChain)(llm, {
        nodeType: node.type,
        nodeDefinition: nodeType,
        requestedChanges: changes,
    }, logger);
    const newParameters = (await parametersChain.invoke({
        workflow_json: (0, trim_workflow_context_1.trimWorkflowJSON)(workflow),
        execution_schema: state.workflowContext?.executionSchema ?? 'NO SCHEMA',
        execution_data: state.workflowContext?.executionData ?? 'NO EXECUTION DATA YET',
        node_id: nodeId,
        node_name: node.name,
        node_type: node.type,
        current_parameters: JSON.stringify(currentParameters, null, 2),
        node_definition: filteredPropertiesJson,
        changes: formattedChanges,
        instanceUrl: instanceUrl ?? '',
    }));
    if (!newParameters || typeof newParameters !== 'object') {
        throw new errors_1.ParameterUpdateError('Invalid parameters returned from LLM', {
            nodeId,
            nodeType: node.type,
        });
    }
    if (!newParameters.parameters || typeof newParameters.parameters !== 'object') {
        throw new errors_1.ParameterUpdateError('Invalid parameters structure returned from LLM', {
            nodeId,
            nodeType: node.type,
        });
    }
    return (0, parameter_update_utils_1.fixExpressionPrefixes)(newParameters.parameters);
}
exports.UPDATING_NODE_PARAMETER_TOOL = {
    toolName: 'update_node_parameters',
    displayTitle: 'Updating node parameters',
};
function getCustomNodeTitle(input, nodes) {
    if ('nodeId' in input && typeof input['nodeId'] === 'string') {
        const targetNode = nodes?.find((node) => node.id === input.nodeId);
        if (targetNode) {
            return `Updating "${targetNode.name}" node parameters`;
        }
    }
    return exports.UPDATING_NODE_PARAMETER_TOOL.displayTitle;
}
function createUpdateNodeParametersTool(nodeTypes, llm, logger, instanceUrl) {
    const dynamicTool = (0, tools_1.tool)(async (input, config) => {
        const reporter = (0, progress_1.createProgressReporter)(config, exports.UPDATING_NODE_PARAMETER_TOOL.toolName, exports.UPDATING_NODE_PARAMETER_TOOL.displayTitle);
        try {
            const validatedInput = updateNodeParametersSchema.parse(input);
            const { nodeId, changes } = validatedInput;
            const state = (0, state_1.getWorkflowState)();
            const workflow = (0, state_1.getCurrentWorkflow)(state);
            reporter.start(validatedInput, {
                customDisplayTitle: getCustomNodeTitle(input, workflow.nodes),
            });
            const node = (0, validation_1.validateNodeExists)(nodeId, workflow.nodes);
            if (!node) {
                const error = (0, validation_1.createNodeNotFoundError)(nodeId);
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            const nodeType = (0, validation_1.findNodeType)(node.type, node.typeVersion, nodeTypes);
            if (!nodeType) {
                const error = (0, validation_1.createNodeTypeNotFoundError)(node.type);
                reporter.error(error);
                return (0, response_1.createErrorResponse)(config, error);
            }
            (0, progress_1.reportProgress)(reporter, `Updating parameters for node "${node.name}"`, {
                nodeId,
                changes,
            });
            try {
                const updatedParameters = await processParameterUpdates(node, nodeType, nodeId, changes, state, llm, logger, instanceUrl);
                const updatedNode = (0, parameter_update_utils_1.updateNodeWithParameters)(node, updatedParameters);
                const message = buildSuccessMessage(node, changes);
                const output = {
                    nodeId,
                    nodeName: node.name,
                    nodeType: node.type,
                    updatedParameters,
                    appliedChanges: changes,
                    message,
                };
                reporter.complete(output);
                const stateUpdates = (0, state_1.updateNodeInWorkflow)(state, nodeId, updatedNode);
                return (0, response_1.createSuccessResponse)(config, message, stateUpdates);
            }
            catch (error) {
                if (error instanceof errors_1.ParameterUpdateError) {
                    reporter.error(error);
                    return (0, response_1.createErrorResponse)(config, error);
                }
                const toolError = new errors_1.ToolExecutionError(`Failed to update node parameters: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                    toolName: exports.UPDATING_NODE_PARAMETER_TOOL.toolName,
                    cause: error instanceof Error ? error : undefined,
                });
                reporter.error(toolError);
                return (0, response_1.createErrorResponse)(config, toolError);
            }
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
                toolName: exports.UPDATING_NODE_PARAMETER_TOOL.toolName,
                cause: error instanceof Error ? error : undefined,
            });
            reporter.error(toolError);
            return (0, response_1.createErrorResponse)(config, toolError);
        }
    }, {
        name: exports.UPDATING_NODE_PARAMETER_TOOL.toolName,
        description: 'Update the parameters of an existing node in the workflow based on natural language changes. This tool intelligently modifies only the specified parameters while preserving others. Examples: "Set the URL to https://api.example.com", "Add authentication header", "Change method to POST", "Set the condition to check if status equals success".',
        schema: updateNodeParametersSchema,
    });
    return {
        tool: dynamicTool,
        ...exports.UPDATING_NODE_PARAMETER_TOOL,
    };
}
//# sourceMappingURL=update-node-parameters.tool.js.map