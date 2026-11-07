"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowSelect = void 0;
const base_select_dto_1 = require("./base.select.dto");
class WorkflowSelect extends base_select_dto_1.BaseSelect {
    static get selectableFields() {
        return new Set([
            'id',
            'name',
            'active',
            'activeVersionId',
            'tags',
            'createdAt',
            'updatedAt',
            'versionId',
            'ownedBy',
            'parentFolder',
            'nodes',
            'isArchived',
            'description',
        ]);
    }
    static fromString(rawFilter) {
        return this.toSelect(rawFilter, WorkflowSelect);
    }
}
exports.WorkflowSelect = WorkflowSelect;
//# sourceMappingURL=workflow.select.dto.js.map