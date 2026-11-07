"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParameters = validateParameters;
const n8n_workflow_1 = require("n8n-workflow");
const node_type_map_1 = require("../../validation/utils/node-type-map");
function isOptionValue(value) {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
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
function isPropertyHiddenForContext(displayOptions, nodeVersion, currentValues) {
    if (!displayOptions)
        return false;
    if (isHiddenByCondition(displayOptions, '@version', nodeVersion))
        return true;
    if (displayOptions.show) {
        for (const [conditionKey, _conditionValue] of Object.entries(displayOptions.show)) {
            if (conditionKey === '@version')
                continue;
            const paramValue = currentValues[conditionKey];
            if (typeof paramValue === 'string' ||
                typeof paramValue === 'number' ||
                typeof paramValue === 'boolean') {
                if (isHiddenByCondition(displayOptions, conditionKey, paramValue)) {
                    return true;
                }
            }
            else if (paramValue === undefined) {
                return true;
            }
        }
    }
    if (displayOptions.hide) {
        for (const [conditionKey, _conditionValue] of Object.entries(displayOptions.hide)) {
            if (conditionKey === '@version')
                continue;
            const paramValue = currentValues[conditionKey];
            if (typeof paramValue === 'string' ||
                typeof paramValue === 'number' ||
                typeof paramValue === 'boolean') {
                if (isHiddenByCondition(displayOptions, conditionKey, paramValue)) {
                    return true;
                }
            }
        }
    }
    return false;
}
function hasMeaningfulDefault(property) {
    const d = property.default;
    if (d === undefined || d === null || d === '')
        return false;
    return !(Array.isArray(d) && d.length === 0);
}
function isINodePropertyOptions(item) {
    return (typeof item === 'object' &&
        item !== null &&
        'value' in item &&
        'name' in item &&
        !('values' in item));
}
function getAllowedOptionsValues(property) {
    if (property.type !== 'options' || !property.options) {
        return undefined;
    }
    const allowedValues = new Set();
    for (const opt of property.options) {
        if (isINodePropertyOptions(opt)) {
            allowedValues.add(opt.value);
        }
    }
    return allowedValues.size > 0 ? allowedValues : undefined;
}
function isEmptyValue(value) {
    if (value === undefined || value === null || value === '')
        return true;
    return Array.isArray(value) && value.length === 0;
}
function validateRequiredParameters(node, nodeType, nodeParameters, nodeVersion, violations) {
    for (const property of nodeType.properties) {
        if (property.required !== true)
            continue;
        if (property.type === 'collection' ||
            property.type === 'fixedCollection' ||
            property.type === 'credentialsSelect') {
            continue;
        }
        if (isPropertyHiddenForContext(property.displayOptions, nodeVersion, nodeParameters))
            continue;
        const paramValue = nodeParameters[property.name];
        if (isEmptyValue(paramValue) && !hasMeaningfulDefault(property)) {
            violations.push({
                name: 'node-missing-required-parameter',
                type: 'critical',
                description: `Node "${node.name}" is missing required parameter "${property.displayName}"`,
                pointsDeducted: 50,
                metadata: {
                    nodeName: node.name,
                    nodeType: node.type,
                    parameterName: property.name,
                    parameterDisplayName: property.displayName,
                },
            });
        }
    }
}
function validateOptionsValues(node, nodeType, nodeParameters, nodeVersion, violations) {
    for (const property of nodeType.properties) {
        if (property.type !== 'options')
            continue;
        if (property.typeOptions?.loadOptionsMethod)
            continue;
        if (isPropertyHiddenForContext(property.displayOptions, nodeVersion, nodeParameters))
            continue;
        const paramValue = nodeParameters[property.name];
        if (paramValue === undefined || paramValue === null || (0, n8n_workflow_1.isExpression)(paramValue))
            continue;
        if (!isOptionValue(paramValue))
            continue;
        const allowedValues = getAllowedOptionsValues(property);
        if (allowedValues && !allowedValues.has(paramValue)) {
            violations.push({
                name: 'node-invalid-options-value',
                type: 'critical',
                description: `Node "${node.name}" has invalid value "${String(paramValue)}" for parameter "${property.displayName}"`,
                pointsDeducted: 50,
                metadata: {
                    nodeName: node.name,
                    nodeType: node.type,
                    parameterName: property.name,
                    parameterDisplayName: property.displayName,
                    invalidValue: String(paramValue),
                },
            });
        }
    }
}
function validateParameters(workflow, nodeTypes) {
    const violations = [];
    if (!workflow.nodes || workflow.nodes.length === 0) {
        return violations;
    }
    const { nodeTypeMap, nodeTypesByName } = (0, node_type_map_1.createNodeTypeMaps)(nodeTypes);
    for (const node of workflow.nodes) {
        const nodeType = (0, node_type_map_1.getNodeTypeForNode)(node, nodeTypeMap, nodeTypesByName);
        if (!nodeType?.properties) {
            continue;
        }
        const nodeVersion = node.typeVersion ?? 1;
        const nodeParameters = node.parameters ?? {};
        validateRequiredParameters(node, nodeType, nodeParameters, nodeVersion, violations);
        validateOptionsValues(node, nodeType, nodeParameters, nodeVersion, violations);
    }
    return violations;
}
//# sourceMappingURL=parameters.js.map