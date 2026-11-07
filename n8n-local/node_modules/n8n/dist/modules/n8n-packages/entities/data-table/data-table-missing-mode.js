"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideAbsentTable = decideAbsentTable;
const data_table_types_1 = require("./data-table.types");
const ON_ABSENT_TABLE = {
    create: () => ({ action: 'create' }),
    'must-preexist': (requirement) => ({
        action: 'fail',
        failure: (0, data_table_types_1.createFailure)(requirement, 'missing'),
    }),
    'do-nothing': () => ({ action: 'skip' }),
};
function decideAbsentTable(mode, requirement) {
    return ON_ABSENT_TABLE[mode](requirement);
}
//# sourceMappingURL=data-table-missing-mode.js.map