"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapResultsToNodeExecutionData = exports.mapGuardrailErrorsToMessage = exports.mapGuardrailResultToUserResult = void 0;
const omit_1 = __importDefault(require("lodash/omit"));
const types_1 = require("../actions/types");
const mapGuardrailResultToUserResult = (result) => {
    const formatInfo = (info) => {
        return (0, omit_1.default)(info ?? {}, ['maskEntities']);
    };
    if ('status' in result) {
        if (result.status === 'fulfilled') {
            return {
                name: result.value.guardrailName,
                triggered: result.value.tripwireTriggered,
                confidenceScore: result.value.confidenceScore,
                executionFailed: result.value.executionFailed,
                exception: result.value.originalException
                    ? {
                        name: result.value.originalException.name,
                        description: result.value.originalException.message,
                    }
                    : undefined,
                info: formatInfo(result.value.info),
            };
        }
        else {
            return {
                name: result.reason instanceof types_1.GuardrailError
                    ? result.reason.guardrailName
                    : 'Unknown Guardrail',
                triggered: true,
                executionFailed: true,
                exception: result.reason instanceof Error
                    ? { name: result.reason.name, description: result.reason.message }
                    : { name: 'Unknown Exception', description: 'Unknown exception occurred' },
            };
        }
    }
    return {
        name: result.guardrailName,
        triggered: result.tripwireTriggered,
        confidenceScore: result.confidenceScore,
        executionFailed: result.executionFailed,
        exception: result.originalException
            ? {
                name: result.originalException.name,
                description: result.originalException.message,
            }
            : undefined,
        info: formatInfo(result.info),
    };
};
exports.mapGuardrailResultToUserResult = mapGuardrailResultToUserResult;
const mapGuardrailErrorsToMessage = (results) => {
    const failedChecks = results
        .filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.executionFailed))
        .map((result) => {
        const originalException = result.status === 'rejected' ? result.reason : result.value.originalException;
        const message = originalException?.message ?? 'Unknown exception occurred';
        const guardrailName = result.status === 'rejected'
            ? (originalException?.guardrailName ?? 'Unknown Guardrail')
            : result.value.guardrailName;
        return `${guardrailName} - ${message}`;
    })
        .join(',\n');
    return `Failed checks:\n${failedChecks}`;
};
exports.mapGuardrailErrorsToMessage = mapGuardrailErrorsToMessage;
const wrapResultsToNodeExecutionData = (checks, itemIndex) => {
    return checks.length > 0
        ? [
            {
                json: { checks },
                pairedItem: { item: itemIndex },
            },
        ]
        : [];
};
exports.wrapResultsToNodeExecutionData = wrapResultsToNodeExecutionData;
//# sourceMappingURL=mappers.js.map