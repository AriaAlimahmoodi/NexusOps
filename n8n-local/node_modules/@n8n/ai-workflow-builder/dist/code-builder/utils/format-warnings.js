"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWarnings = formatWarnings;
function formatWarnings(warnings, warningTracker) {
    return warnings
        .map((w) => {
        const tag = warningTracker?.isPreExisting(w) ? ' [pre-existing]' : '';
        return `- [${w.code}]${tag} ${w.message}`;
    })
        .join('\n');
}
//# sourceMappingURL=format-warnings.js.map