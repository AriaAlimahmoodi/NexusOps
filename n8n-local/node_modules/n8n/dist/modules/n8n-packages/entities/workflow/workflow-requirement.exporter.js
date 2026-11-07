"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRequirementExporter = void 0;
const di_1 = require("@n8n/di");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
const requirement_source_1 = require("../requirement-source");
let WorkflowRequirementExporter = class WorkflowRequirementExporter {
    constructor(workflowFinder) {
        this.workflowFinder = workflowFinder;
    }
    async export(request) {
        const workflowsById = new Map(request.workflows.map((workflow) => [workflow.id, workflow]));
        const usageByReferencedId = (0, requirement_source_1.groupRequirementUsage)(request.requirements, ({ referencedWorkflowId }) => referencedWorkflowId);
        const missingWorkflowNamesById = await this.findMissingReferencedWorkflowNames(request.user, [...usageByReferencedId.keys()].filter((id) => !workflowsById.has(id)));
        const requirements = [...usageByReferencedId].map(([referencedWorkflowId, { usedBy }]) => {
            const name = workflowsById.get(referencedWorkflowId)?.name ??
                missingWorkflowNamesById.get(referencedWorkflowId);
            return {
                id: referencedWorkflowId,
                ...(name ? { name } : {}),
                usedBy,
            };
        });
        return { requirements };
    }
    async findMissingReferencedWorkflowNames(user, workflowIds) {
        if (workflowIds.length === 0)
            return new Map();
        const workflows = await this.workflowFinder.findWorkflowsByIdsForUser(workflowIds, user, [
            'workflow:export',
        ]);
        return new Map(workflows.map((workflow) => [workflow.id, workflow.name]));
    }
};
exports.WorkflowRequirementExporter = WorkflowRequirementExporter;
exports.WorkflowRequirementExporter = WorkflowRequirementExporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService])
], WorkflowRequirementExporter);
//# sourceMappingURL=workflow-requirement.exporter.js.map