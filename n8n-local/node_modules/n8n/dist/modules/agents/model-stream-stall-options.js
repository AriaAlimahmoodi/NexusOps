"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelStreamStallOptions = modelStreamStallOptions;
function modelStreamStallOptions(aiConfig) {
    const idleMs = normalizeTimeout(aiConfig.modelStreamIdleTimeoutMs, { zeroDisables: true });
    const firstOutputMs = normalizeTimeout(aiConfig.modelStreamFirstOutputTimeoutMs, {
        zeroDisables: false,
    });
    return {
        ...(idleMs !== undefined && { modelStreamIdleTimeoutMs: idleMs }),
        ...(firstOutputMs !== undefined && { modelStreamFirstOutputTimeoutMs: firstOutputMs }),
    };
}
function normalizeTimeout(value, { zeroDisables }) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
        return undefined;
    if (value === 0 && !zeroDisables)
        return undefined;
    return value;
}
//# sourceMappingURL=model-stream-stall-options.js.map