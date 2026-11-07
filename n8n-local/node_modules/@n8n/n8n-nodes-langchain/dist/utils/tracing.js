"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTracingMetadata = buildTracingMetadata;
exports.getTracingConfig = getTracingConfig;
const n8n_workflow_1 = require("n8n-workflow");
function buildTracingMetadata(entries, logger) {
    const additionalMetadata = {};
    for (const entry of entries ?? []) {
        const key = entry.key?.trim();
        if (!key) {
            continue;
        }
        if (entry.type) {
            const fieldType = entry.type.replace('Value', '');
            const rawValue = entry[entry.type];
            if (rawValue === undefined || rawValue === null) {
                continue;
            }
            if (fieldType === 'string' && rawValue === '') {
                continue;
            }
            let value;
            try {
                if (fieldType === 'string') {
                    value = String(rawValue);
                }
                else if (fieldType === 'object') {
                    value = typeof rawValue === 'string' ? (0, n8n_workflow_1.jsonParse)(rawValue) : rawValue;
                }
                else {
                    const validationResult = (0, n8n_workflow_1.validateFieldType)(key, rawValue, fieldType);
                    if (validationResult.valid) {
                        value = validationResult.newValue;
                    }
                    else {
                        logger?.warn(`Tracing metadata entry '${key}' skipped: failed ${fieldType} validation`);
                        continue;
                    }
                }
            }
            catch (error) {
                logger?.warn(`Tracing metadata entry '${key}' skipped: ${error.message}`);
                continue;
            }
            additionalMetadata[key] = value;
        }
        else {
            const value = entry.value;
            if (value === undefined) {
                continue;
            }
            if (typeof value === 'string' && value === '') {
                continue;
            }
            additionalMetadata[key] = value;
        }
    }
    return additionalMetadata;
}
function getTracingConfig(context, config = {}) {
    const parentRunManager = 'getParentCallbackManager' in context && context.getParentCallbackManager
        ? context.getParentCallbackManager()
        : undefined;
    return {
        runName: `[${context.getWorkflow().name}] ${context.getNode().name}`,
        metadata: {
            execution_id: context.getExecutionId(),
            workflow: context.getWorkflow(),
            node: context.getNode().name,
            ...(config.additionalMetadata ?? {}),
        },
        callbacks: parentRunManager,
    };
}
//# sourceMappingURL=tracing.js.map