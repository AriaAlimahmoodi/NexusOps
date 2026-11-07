"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNodeFailures = formatNodeFailures;
exports.formatFailedActivationError = formatFailedActivationError;
function formatNodeFailures(failures) {
    return failures.map(({ nodeName, message }) => `"${nodeName}": ${message}`).join('; ');
}
function formatFailedActivationError(failures) {
    if (failures.length === 1)
        return failures[0].message;
    return `Triggers failed to activate: ${formatNodeFailures(failures)}`;
}
//# sourceMappingURL=format-node-failures.js.map