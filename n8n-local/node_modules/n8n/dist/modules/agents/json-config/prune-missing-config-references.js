"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pruneMissingConfigReferences = pruneMissingConfigReferences;
function pruneMissingConfigReferences(config, previousSchema, available) {
    if (config.tools !== undefined) {
        const existingIds = new Set((previousSchema?.tools ?? []).filter((ref) => ref.type === 'custom').map((ref) => ref.id));
        config.tools = config.tools.filter((ref) => ref.enabled === false ||
            ref.type !== 'custom' ||
            existingIds.has(ref.id) ||
            Object.hasOwn(available.tools, ref.id));
    }
    if (config.tasks !== undefined) {
        config.tasks = config.tasks.filter((ref) => available.taskIds.has(ref.id));
    }
}
//# sourceMappingURL=prune-missing-config-references.js.map