"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendArrayReducer = appendArrayReducer;
exports.cachedTemplatesReducer = cachedTemplatesReducer;
function appendArrayReducer(current, update) {
    return update && update.length > 0 ? [...current, ...update] : current;
}
function cachedTemplatesReducer(current, update) {
    if (!update || update.length === 0) {
        return current;
    }
    const existingById = new Map(current.map((wf) => [wf.templateId, wf]));
    for (const workflow of update) {
        if (!existingById.has(workflow.templateId)) {
            existingById.set(workflow.templateId, workflow);
        }
    }
    return Array.from(existingById.values());
}
//# sourceMappingURL=state-reducers.js.map