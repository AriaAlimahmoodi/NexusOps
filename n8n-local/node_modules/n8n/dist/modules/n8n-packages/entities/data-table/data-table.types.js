"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFailure = createFailure;
function createFailure(requirement, kind, details = {}) {
    return {
        kind,
        sourceId: requirement.id,
        name: requirement.name,
        ...details,
    };
}
//# sourceMappingURL=data-table.types.js.map