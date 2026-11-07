"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callerIdsReference = void 0;
exports.callerIdsReference = {
    extract() {
        return [];
    },
    apply(workflow, bindings) {
        const { settings } = workflow;
        if (!settings?.callerIds || typeof settings.callerIds !== 'string')
            return;
        settings.callerIds = settings.callerIds
            .split(',')
            .map((raw) => raw.trim())
            .filter((id) => id !== '')
            .map((id) => bindings.workflows.get(id) ?? id)
            .join(',');
    },
};
//# sourceMappingURL=caller-ids.reference.js.map