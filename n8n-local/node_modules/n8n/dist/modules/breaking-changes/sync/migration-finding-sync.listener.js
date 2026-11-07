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
exports.MigrationFindingSyncListener = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const migration_finding_sync_service_1 = require("./migration-finding-sync.service");
let MigrationFindingSyncListener = class MigrationFindingSyncListener {
    constructor(eventService, syncService, logger, errorReporter) {
        this.eventService = eventService;
        this.syncService = syncService;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.logger = logger.scoped('breaking-changes');
    }
    init() {
        this.eventService.on('workflow-created', async ({ workflow }) => {
            await this.syncWorkflow(workflow.id);
        });
        this.eventService.on('workflow-saved', async ({ workflow }) => {
            await this.syncWorkflow(workflow.id);
        });
        this.eventService.on('workflow-activated', async ({ workflowId }) => {
            await this.syncWorkflow(workflowId);
        });
        this.eventService.on('workflow-imported', async ({ workflowId }) => {
            await this.syncWorkflow(workflowId);
        });
    }
    async syncWorkflow(workflowId) {
        try {
            await this.syncService.syncWorkflow(workflowId);
        }
        catch (error) {
            this.logger.warn('Re-detecting migration findings for a workflow failed', { workflowId });
            this.errorReporter.error(error, { extra: { workflowId } });
        }
    }
};
exports.MigrationFindingSyncListener = MigrationFindingSyncListener;
exports.MigrationFindingSyncListener = MigrationFindingSyncListener = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.EventService, migration_finding_sync_service_1.MigrationFindingSyncService, backend_common_1.Logger, n8n_core_1.ErrorReporter])
], MigrationFindingSyncListener);
//# sourceMappingURL=migration-finding-sync.listener.js.map