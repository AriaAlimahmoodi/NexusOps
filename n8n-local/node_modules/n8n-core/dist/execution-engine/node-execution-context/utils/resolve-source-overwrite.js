"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSourceOverwrite = resolveSourceOverwrite;
function resolveSourceOverwrite(item, executionData) {
    const isToolExecution = !!executionData.metadata?.preserveSourceOverwrite;
    if (!isToolExecution) {
        return null;
    }
    if (executionData.metadata?.preservedSourceOverwrite) {
        return executionData.metadata.preservedSourceOverwrite;
    }
    if (typeof item.pairedItem === 'object' && 'sourceOverwrite' in item.pairedItem) {
        return item.pairedItem.sourceOverwrite;
    }
    return null;
}
//# sourceMappingURL=resolve-source-overwrite.js.map