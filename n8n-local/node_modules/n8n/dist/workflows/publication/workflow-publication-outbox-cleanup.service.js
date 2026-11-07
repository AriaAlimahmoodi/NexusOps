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
exports.WorkflowPublicationOutboxCleanupService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
let WorkflowPublicationOutboxCleanupService = class WorkflowPublicationOutboxCleanupService {
    constructor(logger, workflowsConfig, outboxRepository, tracing, eventService) {
        this.workflowsConfig = workflowsConfig;
        this.outboxRepository = outboxRepository;
        this.tracing = tracing;
        this.eventService = eventService;
        this.logger = logger.scoped('workflow-publication');
    }
    async cleanup(signal) {
        const completedRetentionSeconds = this.workflowsConfig.publicationOutboxCompletedRetentionHours * constants_1.Time.hours.toSeconds;
        const failedRetentionSeconds = this.workflowsConfig.publicationOutboxFailedRetentionHours * constants_1.Time.hours.toSeconds;
        const batchSize = this.workflowsConfig.publicationOutboxCleanupBatchSize;
        const startedAt = Date.now();
        await this.tracing.startSpan({ name: 'Publication outbox cleanup', op: 'publication.outbox.cleanup' }, async (span) => {
            let totalDeleted = 0;
            let result = 'failure';
            try {
                let deleted;
                do {
                    deleted = await this.outboxRepository.deleteTerminalOlderThan(completedRetentionSeconds, failedRetentionSeconds, batchSize);
                    totalDeleted += deleted;
                } while (deleted >= batchSize && !signal.aborted);
                result = 'success';
                span.setStatus({ code: 1 });
                if (totalDeleted > 0) {
                    this.logger.debug('Cleaned up terminal workflow publication outbox records', {
                        count: totalDeleted,
                    });
                }
            }
            finally {
                span.setAttribute('n8n.publication.records_deleted', totalDeleted);
                this.eventService.emit('workflow-publication-outbox-cleanup', {
                    result,
                    deletedCount: totalDeleted,
                    durationMs: Date.now() - startedAt,
                });
            }
        });
    }
};
exports.WorkflowPublicationOutboxCleanupService = WorkflowPublicationOutboxCleanupService;
exports.WorkflowPublicationOutboxCleanupService = WorkflowPublicationOutboxCleanupService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.WorkflowsConfig, db_1.WorkflowPublicationOutboxRepository, n8n_core_1.Tracing, backend_services_1.EventService])
], WorkflowPublicationOutboxCleanupService);
//# sourceMappingURL=workflow-publication-outbox-cleanup.service.js.map