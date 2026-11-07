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
exports.WorkflowImportMatchService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const workflow_finder_service_1 = require("../../../../workflows/workflow-finder.service");
let WorkflowImportMatchService = class WorkflowImportMatchService {
    constructor(workflowFinderService, workflowRepository) {
        this.workflowFinderService = workflowFinderService;
        this.workflowRepository = workflowRepository;
    }
    async findOwningProjectsByWorkflowId(workflowIds) {
        if (workflowIds.length === 0)
            return new Map();
        const workflows = await this.workflowRepository.findPreExistingWorkflows(workflowIds);
        return new Map(workflows.map((workflow) => [
            workflow.id,
            {
                projectId: workflow.shared?.[0]?.projectId ?? null,
                name: workflow.name,
                isArchived: workflow.isArchived,
            },
        ]));
    }
    async findBySourceWorkflowIds(projectId, sourceWorkflowIds) {
        if (sourceWorkflowIds.length === 0) {
            return { matches: new Map(), lineageConflicts: [] };
        }
        const packageWorkflowIds = new Set(sourceWorkflowIds);
        const finderOptions = {
            includeActiveVersion: true,
            includeParentFolder: true,
            includeArchived: true,
        };
        const matchBySourceWorkflowId = new Map();
        const lineageConflicts = [];
        const workflows = await this.workflowFinderService.findOwnedWorkflowsBySourceWorkflowIds(projectId, sourceWorkflowIds, finderOptions);
        const workflowsBySourceId = new Map();
        for (const workflow of workflows) {
            if (!workflow.sourceWorkflowId)
                continue;
            const key = workflow.sourceWorkflowId;
            if (!packageWorkflowIds.has(key))
                continue;
            const candidates = workflowsBySourceId.get(key) ?? [];
            candidates.push(workflow);
            workflowsBySourceId.set(key, candidates);
        }
        for (const [sourceWorkflowId, candidates] of workflowsBySourceId) {
            const activeCandidates = candidates.filter((workflow) => !workflow.isArchived);
            if (candidates.length === 1 || activeCandidates.length === 1) {
                matchBySourceWorkflowId.set(sourceWorkflowId, activeCandidates[0] ?? candidates[0]);
                continue;
            }
            const sortedCandidates = candidates.toSorted((left, right) => left.id.localeCompare(right.id));
            matchBySourceWorkflowId.set(sourceWorkflowId, sortedCandidates[0]);
            lineageConflicts.push({
                sourceWorkflowId,
                projectId,
                existingWorkflows: sortedCandidates.map(({ id, name, isArchived }) => ({
                    id,
                    name,
                    isArchived,
                })),
            });
        }
        for (const workflow of workflows) {
            if (workflow.sourceWorkflowId !== null)
                continue;
            const key = workflow.id;
            if (!packageWorkflowIds.has(key) || matchBySourceWorkflowId.has(key))
                continue;
            matchBySourceWorkflowId.set(key, workflow);
        }
        return { matches: matchBySourceWorkflowId, lineageConflicts };
    }
};
exports.WorkflowImportMatchService = WorkflowImportMatchService;
exports.WorkflowImportMatchService = WorkflowImportMatchService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [workflow_finder_service_1.WorkflowFinderService, db_1.WorkflowRepository])
], WorkflowImportMatchService);
//# sourceMappingURL=workflow-import-match.service.js.map