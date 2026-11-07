"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectSingleNodeConfiguration = collectSingleNodeConfiguration;
exports.addNodeConfigurationToMap = addNodeConfigurationToMap;
exports.collectNodeConfigurationsFromWorkflows = collectNodeConfigurationsFromWorkflows;
exports.getNodeConfigurationsFromTemplates = getNodeConfigurationsFromTemplates;
exports.formatNodeConfigurationExamples = formatNodeConfigurationExamples;
const constants_1 = require("../../constants");
function collectSingleNodeConfiguration(node) {
    const hasParams = Object.keys(node.parameters).length > 0;
    if (!hasParams)
        return null;
    const parametersStr = JSON.stringify(node.parameters);
    if (parametersStr.length > constants_1.MAX_NODE_EXAMPLE_CHARS)
        return null;
    return {
        version: node.typeVersion,
        parameters: node.parameters,
    };
}
function addNodeConfigurationToMap(nodeType, config, configurationsMap) {
    if (!configurationsMap[nodeType]) {
        configurationsMap[nodeType] = [];
    }
    configurationsMap[nodeType].push(config);
}
function collectNodeConfigurationsFromWorkflows(workflows) {
    const configurations = {};
    for (const workflow of workflows) {
        for (const node of workflow.workflow.nodes) {
            if (node.type === 'n8n-nodes-base.stickyNote')
                continue;
            const config = collectSingleNodeConfiguration(node);
            if (config) {
                addNodeConfigurationToMap(node.type, config, configurations);
            }
        }
    }
    return configurations;
}
function getNodeConfigurationsFromTemplates(templates, nodeType, nodeVersion) {
    const configurations = [];
    for (const template of templates) {
        for (const node of template.workflow.nodes) {
            if (node.type !== nodeType)
                continue;
            if (nodeVersion !== undefined && node.typeVersion !== nodeVersion)
                continue;
            const config = collectSingleNodeConfiguration(node);
            if (config) {
                configurations.push(config);
            }
        }
    }
    return configurations;
}
function formatNodeConfigurationExamples(nodeType, configurations, nodeVersion, maxExamples = 1, maxChars = constants_1.MAX_NODE_EXAMPLE_CHARS) {
    const filtered = nodeVersion
        ? configurations.filter((c) => c.version === nodeVersion)
        : configurations;
    if (filtered.length === 0) {
        return `## Node Configuration Examples: ${nodeType}\n\nNo examples found.`;
    }
    const limited = filtered.slice(0, maxExamples);
    const { parts } = limited.reduce((acc, config) => {
        const exampleStr = JSON.stringify(config.parameters, null, 2);
        if (acc.chars + exampleStr.length <= maxChars) {
            acc.parts.push(`### Example (version ${config.version})`, '', '```json', exampleStr, '```', '');
            acc.chars += exampleStr.length;
        }
        return acc;
    }, { parts: [], chars: 0 });
    return [`## Node Configuration Examples: ${nodeType}`, '', ...parts].join('\n');
}
//# sourceMappingURL=node-configuration.utils.js.map