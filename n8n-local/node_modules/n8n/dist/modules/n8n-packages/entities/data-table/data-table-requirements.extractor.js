"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableRequirementsExtractor = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
let DataTableRequirementsExtractor = class DataTableRequirementsExtractor {
    extract(workflow) {
        return this.extractIds(workflow.nodes ?? []).map((dataTableId) => ({
            workflowId: workflow.id,
            dataTableId,
        }));
    }
    extractIds(nodes) {
        const ids = new Set();
        for (const node of nodes) {
            if (!n8n_workflow_1.DATA_TABLE_NODE_TYPES.includes(node.type))
                continue;
            const resourceLocator = node.parameters?.dataTableId;
            if (!resourceLocator?.value ||
                typeof resourceLocator.value !== 'string' ||
                resourceLocator.mode === 'name' ||
                resourceLocator.value.includes('{') ||
                ids.has(resourceLocator.value)) {
                continue;
            }
            ids.add(resourceLocator.value);
        }
        return [...ids];
    }
};
exports.DataTableRequirementsExtractor = DataTableRequirementsExtractor;
exports.DataTableRequirementsExtractor = DataTableRequirementsExtractor = __decorate([
    (0, di_1.Service)()
], DataTableRequirementsExtractor);
//# sourceMappingURL=data-table-requirements.extractor.js.map