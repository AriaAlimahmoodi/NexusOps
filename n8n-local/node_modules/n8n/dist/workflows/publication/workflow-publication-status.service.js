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
exports.WorkflowPublicationStatusService = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const constants_1 = require("../../constants");
const format_node_failures_1 = require("../../workflows/publication/format-node-failures");
let WorkflowPublicationStatusService = class WorkflowPublicationStatusService {
    constructor(outboxRepository, triggerStatusRepository) {
        this.outboxRepository = outboxRepository;
        this.triggerStatusRepository = triggerStatusRepository;
    }
    async getStatus(workflowId, ctx = {}) {
        const [inFlightPublication, currentTriggerStatuses] = await Promise.all([
            this.outboxRepository.findInFlightByWorkflowId(workflowId, ctx),
            this.triggerStatusRepository.findByWorkflowId(workflowId, ctx),
        ]);
        const triggers = currentTriggerStatuses.map((r) => ({
            nodeId: r.nodeId,
            status: r.status,
            errorMessage: r.errorMessage,
        }));
        const isPublishing = inFlightPublication !== null;
        const pendingVersionId = inFlightPublication?.publishedVersionId ?? null;
        const activatedRow = currentTriggerStatuses.find((r) => r.status === 'activated');
        const liveVersionId = activatedRow?.versionId ?? null;
        const status = this.deriveStatus(isPublishing, currentTriggerStatuses);
        return { status, liveVersionId, pendingVersionId, triggers };
    }
    async getListStatusesByWorkflowIds(workflowIds) {
        const counts = await this.triggerStatusRepository.getStatusCountsByWorkflowIds(workflowIds);
        const statuses = new Map();
        for (const [workflowId, { total, failed }] of counts) {
            statuses.set(workflowId, this.deriveSettledStatus(total, failed));
        }
        return statuses;
    }
    async getFailedActivationError(workflowId, nodes) {
        const rows = await this.triggerStatusRepository.findByWorkflowId(workflowId);
        if (this.deriveStatus(false, rows) !== 'failed')
            return null;
        const position = new Map(nodes.map((node, index) => [node.id, index]));
        const at = (row) => position.get(row.nodeId) ?? nodes.length;
        const ordered = [...rows].sort((a, b) => at(a) - at(b) || a.nodeId.localeCompare(b.nodeId));
        return (0, format_node_failures_1.formatFailedActivationError)(ordered.map((row) => ({
            nodeName: nodes[at(row)]?.name ?? row.nodeId,
            message: row.errorMessage || constants_1.UNKNOWN_FAILURE_REASON,
        })));
    }
    deriveStatus(isPublishing, currentTriggerStatuses) {
        if (isPublishing)
            return 'in_progress';
        if (currentTriggerStatuses.length === 0)
            return 'not_published';
        const failed = currentTriggerStatuses.filter((r) => r.status === 'failed').length;
        return this.deriveSettledStatus(currentTriggerStatuses.length, failed);
    }
    deriveSettledStatus(total, failed) {
        if (failed === 0)
            return 'published';
        return failed < total ? 'partial' : 'failed';
    }
};
exports.WorkflowPublicationStatusService = WorkflowPublicationStatusService;
exports.WorkflowPublicationStatusService = WorkflowPublicationStatusService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowPublicationOutboxRepository, db_1.WorkflowPublicationTriggerStatusRepository])
], WorkflowPublicationStatusService);
//# sourceMappingURL=workflow-publication-status.service.js.map