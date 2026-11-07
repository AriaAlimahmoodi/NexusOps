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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakingChangesController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const permissions_1 = require("@n8n/permissions");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const breaking_changes_migration_service_1 = require("./breaking-changes.migration.service");
const breaking_changes_rule_registry_service_1 = require("./breaking-changes.rule-registry.service");
const migration_report_csv_1 = require("./migration-report-csv");
const migration_finding_notification_service_1 = require("./notifications/migration-finding-notification.service");
const migration_owner_assignment_service_1 = require("./owners/migration-owner-assignment.service");
const migration_finding_query_service_1 = require("./query/migration-finding-query.service");
const migration_finding_sync_service_1 = require("./sync/migration-finding-sync.service");
const migration_finding_triage_service_1 = require("./triage/migration-finding-triage.service");
const types_1 = require("./types");
const DEFAULT_TARGET_VERSION = 'v2';
let BreakingChangesController = class BreakingChangesController {
    constructor(migrationService, syncService, queryService, ruleRegistry, triageService, eventService, ownerAssignmentService, notificationService, workflowFinderService) {
        this.migrationService = migrationService;
        this.syncService = syncService;
        this.queryService = queryService;
        this.ruleRegistry = ruleRegistry;
        this.triageService = triageService;
        this.eventService = eventService;
        this.ownerAssignmentService = ownerAssignmentService;
        this.notificationService = notificationService;
        this.workflowFinderService = workflowFinderService;
    }
    async scopeFor(user) {
        if ((0, permissions_1.hasGlobalScope)(user, 'workflow:update'))
            return { kind: 'instance' };
        const workflowIds = await this.workflowFinderService.findAllWorkflowIdsForUser(user, [
            'workflow:update',
        ]);
        return { kind: 'workflows', workflowIds };
    }
    async editableWorkflowIds(user, workflowIds) {
        if ((0, permissions_1.hasGlobalScope)(user, 'workflow:update'))
            return workflowIds;
        const editable = await this.workflowFinderService.findWorkflowIdsWithScopeForUser(workflowIds, user, ['workflow:update']);
        return workflowIds.filter((workflowId) => editable.has(workflowId));
    }
    async assertCanEdit(user, workflowId) {
        const [editable] = await this.editableWorkflowIds(user, [workflowId]);
        if (!editable)
            throw new errors_1.NotFoundError(breaking_changes_migration_service_1.WORKFLOW_NOT_EDITABLE_MESSAGE);
    }
    async getDetectionReport(req, _res, query) {
        const version = query.version ?? DEFAULT_TARGET_VERSION;
        const scope = await this.scopeFor(req.user);
        await this.syncService.syncIfStale(version);
        const report = await this.queryService.getLightReport(version, scope);
        this.eventService.emit('migration-report-viewed', {
            user: req.user,
            targetVersion: version,
            refreshed: false,
            report,
        });
        return report;
    }
    async regenerate(req, _res, query) {
        const version = query.version ?? DEFAULT_TARGET_VERSION;
        const scope = await this.scopeFor(req.user);
        if (scope.kind !== 'instance') {
            throw new errors_1.ForbiddenError('Only a user who can edit every workflow can refresh the report');
        }
        await this.syncService.sync(version);
        const report = await this.queryService.getLightReport(version, scope);
        this.eventService.emit('migration-report-viewed', {
            user: req.user,
            targetVersion: version,
            refreshed: true,
            report,
        });
        return report;
    }
    async exportReport(req, res, query) {
        const version = query.version ?? DEFAULT_TARGET_VERSION;
        const scope = await this.scopeFor(req.user);
        await this.syncService.syncIfStale(version);
        const report = await this.queryService.getLightReport(version, scope);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${(0, migration_report_csv_1.migrationReportCsvFilename)(version, new Date())}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.send((0, migration_report_csv_1.toMigrationReportCsv)(report));
    }
    async getDetectionReportForRule(req, _res, ruleId) {
        const rule = this.ruleRegistry.getRule(ruleId);
        if (!rule || !(0, types_1.isWorkflowLevelRule)(rule)) {
            throw new errors_1.NotFoundError(`Breaking change rule with ID '${ruleId}' not found.`);
        }
        const version = rule.getMetadata().version;
        const scope = await this.scopeFor(req.user);
        await this.syncService.syncIfStale(version);
        return await this.queryService.getRuleFindings(version, ruleId, scope);
    }
    async updateFindingStatuses(req, _res, ruleId, body) {
        const workflowIds = await this.editableWorkflowIds(req.user, body.workflowIds);
        if (workflowIds.length === 0)
            return;
        await this.triageService.setStatuses(ruleId, workflowIds, body.status);
    }
    async notifyOwners(req, _res, ruleId, body) {
        return await this.notificationService.notifyOwners(ruleId, body.workflowIds, req.user);
    }
    async updateFindingStatus(req, _res, ruleId, workflowId, body) {
        await this.assertCanEdit(req.user, workflowId);
        await this.triageService.setStatus(ruleId, workflowId, body.status);
    }
    async listOwnerCandidates(req, _res, workflowId) {
        await this.assertCanEdit(req.user, workflowId);
        return await this.ownerAssignmentService.candidates(workflowId);
    }
    async assignOwner(req, _res, workflowId, body) {
        await this.assertCanEdit(req.user, workflowId);
        const owner = await this.ownerAssignmentService.assign(workflowId, body.userId, req.user);
        return { owner };
    }
    async unassignOwner(req, _res, workflowId) {
        await this.assertCanEdit(req.user, workflowId);
        const owner = await this.ownerAssignmentService.unassign(workflowId);
        return { owner };
    }
    async migrateWorkflow(req, _res, ruleId, workflowId) {
        return await this.migrationService.migrateWorkflow(ruleId, workflowId, req.user);
    }
};
exports.BreakingChangesController = BreakingChangesController;
__decorate([
    (0, decorators_1.Get)('/report'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.BreakingChangeReportQueryDto]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "getDetectionReport", null);
__decorate([
    (0, decorators_1.Post)('/report/refresh'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.BreakingChangeReportQueryDto]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "regenerate", null);
__decorate([
    (0, decorators_1.Get)('/report/export'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.BreakingChangeReportQueryDto]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "exportReport", null);
__decorate([
    (0, decorators_1.Get)('/report/:ruleId'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, (0, decorators_1.Param)('ruleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "getDetectionReportForRule", null);
__decorate([
    (0, decorators_1.Patch)('/report/:ruleId/workflows'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, (0, decorators_1.Param)('ruleId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateMigrationFindingStatusesRequestDto]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "updateFindingStatuses", null);
__decorate([
    (0, decorators_1.Post)('/report/:ruleId/workflows/notify'),
    (0, decorators_1.GlobalScope)('breakingChanges:migrate'),
    __param(2, (0, decorators_1.Param)('ruleId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.NotifyMigrationOwnersRequestDto]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "notifyOwners", null);
__decorate([
    (0, decorators_1.Patch)('/report/:ruleId/workflows/:workflowId'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, (0, decorators_1.Param)('ruleId')),
    __param(3, (0, decorators_1.Param)('workflowId')),
    __param(4, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.UpdateMigrationFindingStatusRequestDto]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "updateFindingStatus", null);
__decorate([
    (0, decorators_1.Get)('/workflows/:workflowId/owner/candidates'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "listOwnerCandidates", null);
__decorate([
    (0, decorators_1.Put)('/workflows/:workflowId/owner'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.AssignMigrationOwnerDto]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "assignOwner", null);
__decorate([
    (0, decorators_1.Delete)('/workflows/:workflowId/owner'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "unassignOwner", null);
__decorate([
    (0, decorators_1.Post)('/report/:ruleId/workflows/:workflowId/migrate'),
    (0, decorators_1.GlobalScope)('breakingChanges:list'),
    __param(2, (0, decorators_1.Param)('ruleId')),
    __param(3, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], BreakingChangesController.prototype, "migrateWorkflow", null);
exports.BreakingChangesController = BreakingChangesController = __decorate([
    (0, decorators_1.RestController)('/breaking-changes'),
    __metadata("design:paramtypes", [breaking_changes_migration_service_1.BreakingChangeMigrationService, migration_finding_sync_service_1.MigrationFindingSyncService, migration_finding_query_service_1.MigrationFindingQueryService, breaking_changes_rule_registry_service_1.RuleRegistry, migration_finding_triage_service_1.MigrationFindingTriageService, backend_services_1.EventService, migration_owner_assignment_service_1.MigrationOwnerAssignmentService, migration_finding_notification_service_1.MigrationFindingNotificationService, workflow_finder_service_1.WorkflowFinderService])
], BreakingChangesController);
//# sourceMappingURL=breaking-changes.controller.js.map