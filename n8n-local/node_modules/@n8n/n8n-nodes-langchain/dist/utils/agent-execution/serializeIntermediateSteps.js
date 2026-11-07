"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeIntermediateSteps = serializeIntermediateSteps;
function serializeIntermediateSteps(steps) {
    for (const step of steps) {
        if (step.action.messageLog) {
            step.action.messageLog = step.action.messageLog.map((msg) => {
                if (msg &&
                    typeof msg === 'object' &&
                    typeof msg.toJSON === 'function') {
                    return serializeMessage(msg);
                }
                return msg;
            });
        }
    }
}
function serializeMessage(msg) {
    const m = msg;
    const result = {};
    for (const key of Object.keys(m)) {
        if (key === 'toJSON' || key === '_getType')
            continue;
        result[key] = m[key];
    }
    if (!('type' in result) &&
        typeof m._getType === 'function') {
        result.type = m._getType();
    }
    return result;
}
//# sourceMappingURL=serializeIntermediateSteps.js.map