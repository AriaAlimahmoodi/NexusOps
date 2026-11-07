"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractResourceOperations = extractResourceOperations;
exports.createResourceCacheKey = createResourceCacheKey;
exports.formatResourceOperationsForPrompt = formatResourceOperationsForPrompt;
const n8n_workflow_1 = require("n8n-workflow");
function isPropertyVisibleForVersion(property, nodeVersion) {
    const displayOptions = property.displayOptions;
    if (!displayOptions) {
        return true;
    }
    const showVersion = displayOptions.show?.['@version'];
    if (showVersion && !(0, n8n_workflow_1.checkConditions)(showVersion, [nodeVersion])) {
        return false;
    }
    const hideVersion = displayOptions.hide?.['@version'];
    if (hideVersion && (0, n8n_workflow_1.checkConditions)(hideVersion, [nodeVersion])) {
        return false;
    }
    return true;
}
function findResourceProperty(properties, nodeVersion) {
    return properties.find((prop) => prop.name === 'resource' &&
        prop.type === 'options' &&
        isPropertyVisibleForVersion(prop, nodeVersion));
}
function isOperationVisibleForResource(prop, resourceValue) {
    const displayOptions = prop.displayOptions;
    if (!displayOptions) {
        return true;
    }
    const showResource = displayOptions.show?.resource;
    if (showResource && !(0, n8n_workflow_1.checkConditions)(showResource, [resourceValue])) {
        return false;
    }
    const hideResource = displayOptions.hide?.resource;
    if (hideResource && (0, n8n_workflow_1.checkConditions)(hideResource, [resourceValue])) {
        return false;
    }
    return true;
}
function findOperationProperties(properties, resourceValue, nodeVersion) {
    return properties.filter((prop) => {
        if (prop.name !== 'operation' || prop.type !== 'options') {
            return false;
        }
        if (!isPropertyVisibleForVersion(prop, nodeVersion)) {
            return false;
        }
        return isOperationVisibleForResource(prop, resourceValue);
    });
}
function extractOptions(property, logger, options) {
    if (!property.options || !Array.isArray(property.options)) {
        return [];
    }
    const includeDescription = options?.fields?.description ?? false;
    const includeBuilderHint = options?.fields?.builderHint ?? false;
    return property.options
        .filter((opt) => {
        if (typeof opt !== 'object' || opt === null || !('name' in opt) || !('value' in opt)) {
            return false;
        }
        const optName = opt.name;
        const optValue = opt.value;
        if (typeof optValue !== 'string') {
            logger?.debug('Skipping non-string option value in resource/operation extraction', {
                propertyName: property.name,
                optionName: optName,
                valueType: typeof optValue,
            });
            return false;
        }
        return true;
    })
        .map((opt) => ({
        value: opt.value,
        displayName: opt.name,
        ...(includeDescription && opt.description && { description: opt.description }),
        ...(includeBuilderHint && opt.builderHint && { builderHint: opt.builderHint }),
    }));
}
function extractResourceOperations(nodeType, nodeVersion, logger, options) {
    const properties = nodeType.properties;
    if (!properties || properties.length === 0) {
        logger?.debug('extractResourceOperations: No properties found', {
            nodeType: nodeType.name,
            nodeVersion,
        });
        return null;
    }
    const resourceProperty = findResourceProperty(properties, nodeVersion);
    if (!resourceProperty) {
        return null;
    }
    const resourceOptions = extractOptions(resourceProperty, logger, options);
    if (resourceOptions.length === 0) {
        logger?.warn('extractResourceOperations: Resource property found but no string options', {
            nodeType: nodeType.name,
            nodeVersion,
            propertyDefault: resourceProperty.default,
        });
        return null;
    }
    const resources = resourceOptions.map((resource) => {
        const operationProperties = findOperationProperties(properties, resource.value, nodeVersion);
        const allOperations = [];
        const seenValues = new Set();
        for (const opProp of operationProperties) {
            const ops = extractOptions(opProp, logger, options);
            for (const op of ops) {
                if (!seenValues.has(op.value)) {
                    seenValues.add(op.value);
                    allOperations.push({
                        value: op.value,
                        displayName: op.displayName,
                        ...(op.description && { description: op.description }),
                        ...(op.builderHint && { builderHint: op.builderHint }),
                    });
                }
            }
        }
        return {
            value: resource.value,
            displayName: resource.displayName,
            ...(resource.description && { description: resource.description }),
            ...(resource.builderHint && { builderHint: resource.builderHint }),
            operations: allOperations,
        };
    });
    return { resources };
}
function createResourceCacheKey(nodeName, version) {
    return `${nodeName}:${version}`;
}
function formatResourceOperationsForPrompt(info) {
    const parts = ['<available_resources_and_operations>'];
    for (const resource of info.resources) {
        if (resource.value === '__CUSTOM_API_CALL__')
            continue;
        parts.push(`  Resource: ${resource.displayName} (value: "${resource.value}")`);
        const filteredOps = resource.operations.filter((op) => op.value !== '__CUSTOM_API_CALL__');
        if (filteredOps.length > 0) {
            parts.push('    Operations:');
            for (const op of filteredOps) {
                parts.push(`      - ${op.displayName} (value: "${op.value}")`);
            }
        }
        else {
            parts.push('    Operations: none defined');
        }
    }
    parts.push('</available_resources_and_operations>');
    return parts.join('\n');
}
//# sourceMappingURL=resource-operation-extractor.js.map