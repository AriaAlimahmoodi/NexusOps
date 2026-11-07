"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPDATE_FAILURE_SAMPLE_SIZE = void 0;
exports.buildHttpProviderErrorContext = buildHttpProviderErrorContext;
exports.buildFailureSummaryLogContext = buildFailureSummaryLogContext;
exports.logSecretsProviderOperationFailure = logSecretsProviderOperationFailure;
const backend_network_1 = require("@n8n/backend-network");
exports.UPDATE_FAILURE_SAMPLE_SIZE = 5;
function buildHttpProviderErrorContext(error) {
    const context = {};
    if ((0, backend_network_1.isConnectionRefusedError)(error)) {
        context.errorCode = 'ECONNREFUSED';
    }
    const statusCode = (0, backend_network_1.httpStatusFromError)(error);
    if (statusCode !== undefined) {
        context.statusCode = statusCode;
    }
    if (context.errorCode === undefined &&
        typeof error === 'object' &&
        error !== null &&
        'code' in error) {
        const { code } = error;
        if ((typeof code === 'string' || typeof code === 'number') && code !== statusCode) {
            context.errorCode = code;
        }
    }
    if (context.errorCode === undefined &&
        context.statusCode === undefined &&
        error instanceof Error) {
        context.errorCode = error.name;
    }
    return context;
}
function buildFailureSummaryLogContext(failures) {
    if (failures.length === 0) {
        return null;
    }
    const errorCodes = {};
    for (const failure of failures) {
        const key = String(failure.errorCode ?? 'unknown');
        errorCodes[key] = (errorCodes[key] ?? 0) + 1;
    }
    return {
        failedCount: failures.length,
        errorCodes,
        sampleSecretNames: failures.slice(0, exports.UPDATE_FAILURE_SAMPLE_SIZE).map((failure) => failure.name),
    };
}
function logSecretsProviderOperationFailure({ logger, message, providerName, providerDisplayName, operation, error, context = {}, }) {
    logger.warn(message, {
        providerName,
        providerDisplayName,
        operation,
        errorName: error instanceof Error ? error.name : undefined,
        ...context,
    });
}
//# sourceMappingURL=secrets-provider-errors.js.map