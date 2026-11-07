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
var MigrationFindingSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationFindingSyncService = void 0;
exports.computeRuleSetFingerprint = computeRuleSetFingerprint;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const node_crypto_1 = require("node:crypto");
const breaking_changes_rule_registry_service_1 = require("../breaking-changes.rule-registry.service");
const breaking_changes_service_1 = require("../breaking-changes.service");
const migration_finding_sync_repository_1 = require("../database/repositories/migration-finding-sync.repository");
const migration_finding_repository_1 = require("../database/repositories/migration-finding.repository");
const migration_workflow_owner_repository_1 = require("../database/repositories/migration-workflow-owner.repository");
const migration_owner_suggestion_service_1 = require("../owners/migration-owner-suggestion.service");
const migration_finding_diff_1 = require("./migration-finding-diff");
function computeRuleSetFingerprint(ruleIds) {
    return (0, node_crypto_1.createHash)('sha256')
        .update([...ruleIds].sort().join('\n'))
        .digest('hex');
}
let MigrationFindingSyncService = MigrationFindingSyncService_1 = class MigrationFindingSyncService {
    constructor(breakingChangeService, ruleRegistry, workflowRepository, findingRepository, syncRepository, ownerSuggestionService, ownerRepository, txRunner, logger, errorReporter) {
        this.breakingChangeService = breakingChangeService;
        this.ruleRegistry = ruleRegistry;
        this.workflowRepository = workflowRepository;
        this.findingRepository = findingRepository;
        this.syncRepository = syncRepository;
        this.ownerSuggestionService = ownerSuggestionService;
        this.ownerRepository = ownerRepository;
        this.txRunner = txRunner;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.ongoingSyncs = new Map();
        this.ongoingWorkflowSyncs = new Map();
        this.logger = logger.scoped('breaking-changes');
    }
    async syncIfStale(targetVersion) {
        const ongoing = this.ongoingSyncs.get(targetVersion);
        if (ongoing) {
            await ongoing;
            return;
        }
        const record = await this.syncRepository.getForVersion(targetVersion, {});
        const ruleIds = this.ruleRegistry.getRules(targetVersion).map((rule) => rule.id);
        if (record?.ruleSetFingerprint === computeRuleSetFingerprint(ruleIds))
            return;
        this.logger.debug('Migration finding table is stale, syncing', {
            targetVersion,
            reason: record ? 'rule set changed' : 'never synced',
        });
        await this.sync(targetVersion);
    }
    async sync(targetVersion) {
        const ongoing = this.ongoingSyncs.get(targetVersion);
        if (ongoing) {
            this.logger.debug('Reusing ongoing migration finding sync', { targetVersion });
            return await ongoing;
        }
        const run = this.runSync(targetVersion);
        this.ongoingSyncs.set(targetVersion, run);
        try {
            await run;
        }
        finally {
            this.ongoingSyncs.delete(targetVersion);
        }
    }
    async runSync(targetVersion) {
        this.logger.debug('Starting migration finding sync', { targetVersion });
        await this.syncRepository.deleteForVersion(targetVersion, {});
        const { report, failedChecks } = await this.breakingChangeService.detect(targetVersion);
        const hitsByWorkflow = groupHitsByWorkflow(report.workflowResults);
        const unknownByWorkflow = groupByWorkflow(failedChecks);
        if (failedChecks.length > 0) {
            this.logger.warn('Leaving the findings of rule checks that failed during the scan as is', {
                targetVersion,
                count: failedChecks.length,
            });
        }
        const take = MigrationFindingSyncService_1.BATCH_SIZE;
        let afterId;
        let workflowIds;
        let failedBatches = 0;
        do {
            workflowIds = await this.workflowRepository.getIdsAfter(afterId, take);
            try {
                await this.syncBatch(targetVersion, workflowIds, hitsByWorkflow, unknownByWorkflow);
                await this.refreshSuggestedOwners(targetVersion, workflowIds);
            }
            catch (error) {
                failedBatches++;
                this.logger.warn('Migration finding sync batch failed, continuing with the next batch', {
                    targetVersion,
                    batchStart: workflowIds[0],
                });
                this.errorReporter.error(error, {
                    extra: { targetVersion, batchStart: workflowIds[0] },
                });
            }
            afterId = workflowIds.at(-1);
        } while (workflowIds.length === take);
        if (failedBatches > 0) {
            this.logger.warn('Migration finding sync was partial, not recording it as complete', {
                targetVersion,
                failedBatches,
            });
            return;
        }
        const ruleIds = this.ruleRegistry.getRules(targetVersion).map((rule) => rule.id);
        await this.syncRepository.upsertForVersion({
            targetVersion,
            syncedAt: new Date(),
            ruleSetFingerprint: computeRuleSetFingerprint(ruleIds),
        }, {});
        this.logger.debug('Migration finding sync completed', { targetVersion });
    }
    async syncWorkflow(workflowId) {
        const previous = this.ongoingWorkflowSyncs.get(workflowId) ?? Promise.resolve();
        const run = previous.then(async () => await this.runWorkflowSync(workflowId));
        this.ongoingWorkflowSyncs.set(workflowId, run);
        try {
            await run;
        }
        finally {
            if (this.ongoingWorkflowSyncs.get(workflowId) === run) {
                this.ongoingWorkflowSyncs.delete(workflowId);
            }
        }
    }
    async runWorkflowSync(workflowId) {
        const targetVersion = api_types_1.MIGRATION_REPORT_TARGET_VERSION;
        if (!targetVersion)
            return;
        try {
            const { hits, failedChecks } = await this.breakingChangeService.detectWorkflowHits(targetVersion, workflowId);
            const batchRulePairs = this.ruleRegistry
                .getRules(targetVersion)
                .filter((rule) => 'collectWorkflowData' in rule)
                .map((rule) => ({ ruleId: rule.id, workflowId }));
            await this.syncBatch(targetVersion, [workflowId], groupByWorkflow(hits), groupByWorkflow([...failedChecks, ...batchRulePairs]));
            await this.refreshSuggestedOwners(targetVersion, [workflowId]);
        }
        catch (error) {
            this.logger.warn('Migration finding sync for one workflow failed', {
                targetVersion,
                workflowId,
            });
            this.errorReporter.error(error, { extra: { targetVersion, workflowId } });
        }
    }
    async refreshSuggestedOwners(targetVersion, workflowIds) {
        try {
            const affectedIds = await this.findingRepository.listWorkflowIdsWithUnresolvedFindings(targetVersion, workflowIds, {});
            const suggestions = affectedIds.length > 0 ? await this.ownerSuggestionService.suggestOwners(affectedIds) : [];
            await this.ownerRepository.replaceSuggestions(workflowIds, suggestions, {});
        }
        catch (error) {
            this.logger.warn('Refreshing the suggested owners failed, the findings are unaffected', {
                targetVersion,
                batchStart: workflowIds[0],
            });
            this.errorReporter.error(error, { extra: { targetVersion, batchStart: workflowIds[0] } });
        }
    }
    async syncBatch(targetVersion, pagedIds, hitsByWorkflow, unknownByWorkflow) {
        if (pagedIds.length === 0)
            return;
        await this.txRunner.run({}, async (ctx) => {
            const workflowIds = await this.workflowRepository.findExistingIds(pagedIds, ctx);
            if (workflowIds.length === 0)
                return;
            const hits = workflowIds.flatMap((workflowId) => hitsByWorkflow.get(workflowId) ?? []);
            const unknown = workflowIds.flatMap((workflowId) => unknownByWorkflow.get(workflowId) ?? []);
            const existing = await this.findingRepository.listForWorkflows(targetVersion, workflowIds, ctx);
            const diff = (0, migration_finding_diff_1.diffMigrationFindings)({ targetVersion, workflowIds, hits, existing, unknown });
            if (diff.toInsert.length > 0) {
                await this.findingRepository.insertMany(diff.toInsert, ctx);
            }
            if (diff.toMarkFixed.length > 0) {
                await this.findingRepository.markFixedForIds(diff.toMarkFixed, ctx);
            }
            if (diff.toReopen.length > 0) {
                await this.findingRepository.updateStatusForIds(diff.toReopen, 'open', undefined, ctx);
            }
        });
    }
};
exports.MigrationFindingSyncService = MigrationFindingSyncService;
MigrationFindingSyncService.BATCH_SIZE = 100;
exports.MigrationFindingSyncService = MigrationFindingSyncService = MigrationFindingSyncService_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [breaking_changes_service_1.BreakingChangeService, breaking_changes_rule_registry_service_1.RuleRegistry, db_1.WorkflowRepository, migration_finding_repository_1.MigrationFindingRepository, migration_finding_sync_repository_1.MigrationFindingSyncRepository, migration_owner_suggestion_service_1.MigrationOwnerSuggestionService, migration_workflow_owner_repository_1.MigrationWorkflowOwnerRepository, db_1.TransactionRunner, backend_common_1.Logger, n8n_core_1.ErrorReporter])
], MigrationFindingSyncService);
function groupHitsByWorkflow(workflowResults) {
    return groupByWorkflow(workflowResults.flatMap((result) => result.affectedWorkflows.map((workflow) => ({
        ruleId: result.ruleId,
        workflowId: workflow.id,
    }))));
}
function groupByWorkflow(pairs) {
    const byWorkflow = new Map();
    for (const pair of pairs) {
        const group = byWorkflow.get(pair.workflowId) ?? [];
        group.push(pair);
        byWorkflow.set(pair.workflowId, group);
    }
    return byWorkflow;
}
//# sourceMappingURL=migration-finding-sync.service.js.map