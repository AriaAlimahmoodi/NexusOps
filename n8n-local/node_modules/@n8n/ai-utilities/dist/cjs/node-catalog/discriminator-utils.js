"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractModeDiscriminator = extractModeDiscriminator;
exports.extractOperationOnlyDiscriminator = extractOperationOnlyDiscriminator;
function extractModeDiscriminator(nodeType, nodeVersion) {
    const properties = nodeType.properties;
    if (!properties || properties.length === 0) {
        return null;
    }
    const modeProperty = properties.find((prop) => prop.name === 'mode' &&
        prop.type === 'options' &&
        isPropertyVisibleForVersion(prop, nodeVersion) &&
        !prop.displayOptions?.show?.operation &&
        !prop.displayOptions?.show?.resource);
    if (!modeProperty?.options) {
        return null;
    }
    const modes = modeProperty.options
        .filter((opt) => typeof opt === 'object' && opt !== null && 'value' in opt && typeof opt.value === 'string')
        .map((opt) => ({
        value: opt.value,
        displayName: opt.name,
        outputConnectionType: opt.outputConnectionType,
        description: opt.description,
        builderHint: opt.builderHint,
    }));
    if (modes.length === 0) {
        return null;
    }
    return { modes };
}
function extractOperationOnlyDiscriminator(nodeType, nodeVersion) {
    const properties = nodeType.properties;
    if (!properties || properties.length === 0) {
        return null;
    }
    const hasResource = properties.some((prop) => prop.name === 'resource' &&
        prop.type === 'options' &&
        isPropertyVisibleForVersion(prop, nodeVersion));
    if (hasResource) {
        return null;
    }
    const operationProperty = properties.find((prop) => prop.name === 'operation' &&
        prop.type === 'options' &&
        isPropertyVisibleForVersion(prop, nodeVersion));
    if (!operationProperty?.options) {
        return null;
    }
    const operations = operationProperty.options
        .filter((opt) => typeof opt === 'object' && opt !== null && 'value' in opt && typeof opt.value === 'string')
        .map((opt) => ({
        value: opt.value,
        displayName: opt.name,
        description: opt.description,
        builderHint: opt.builderHint,
    }));
    if (operations.length === 0) {
        return null;
    }
    return { operations };
}
function isPropertyVisibleForVersion(property, nodeVersion) {
    const displayOptions = property.displayOptions;
    if (!displayOptions) {
        return true;
    }
    const showVersion = displayOptions.show?.['@version'];
    if (showVersion) {
        if (Array.isArray(showVersion)) {
            if (!showVersion.includes(nodeVersion)) {
                return false;
            }
        }
    }
    const hideVersion = displayOptions.hide?.['@version'];
    if (hideVersion) {
        if (Array.isArray(hideVersion)) {
            if (hideVersion.includes(nodeVersion)) {
                return false;
            }
        }
    }
    return true;
}
//# sourceMappingURL=discriminator-utils.js.map