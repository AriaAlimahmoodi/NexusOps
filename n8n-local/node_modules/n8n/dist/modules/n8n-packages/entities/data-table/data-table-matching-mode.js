"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchTargetTable = matchTargetTable;
const MATCH_TARGET_TABLE = {
    'by-id': ({ id }, { targetsById, projectId }) => {
        const table = targetsById.get(id);
        return table && table.projectId === projectId ? table : undefined;
    },
};
function matchTargetTable(mode, requirement, candidates) {
    return MATCH_TARGET_TABLE[mode](requirement, candidates);
}
//# sourceMappingURL=data-table-matching-mode.js.map