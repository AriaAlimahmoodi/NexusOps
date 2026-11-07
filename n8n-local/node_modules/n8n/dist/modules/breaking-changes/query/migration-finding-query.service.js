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
exports.MigrationFindingQueryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const n8n_core_1 = require("n8n-core");
const breaking_changes_migration_registry_service_1 = require("../breaking-changes.migration-registry.service");
const breaking_changes_rule_registry_service_1 = require("../breaking-changes.rule-registry.service");
const breaking_changes_service_1 = require("../breaking-changes.service");
const migration_finding_sync_repository_1 = require("../database/repositories/migration-finding-sync.repository");
const migration_finding_repository_1 = require("../database/repositories/migration-finding.repository");
const migration_workflow_owner_repository_1 = require("../database/repositories/migration-workflow-owner.repository");
const group_nodes_by_type_1 = require("../group-nodes-by-type");
const workflow_owner_1 = require("../owners/workflow-owner");
const summarize_execution_statistics_1 = require("../summarize-execution-statistics");
const types_1 = require("../types");
const constants_1 = require("../../../constants");
const workflowFilter = (scope) => scope.kind === 'workflows' ? scope.workflowIds : undefined;
const WORKFLOW_FIELDS = ['name', 'active', 'activeVersionId', 'nodes', 'updatedAt'];
let MigrationFindingQueryService = class MigrationFindingQueryService {
    constructor(ruleRegistry, migrationRegistry, breakingChangeService, workflowRepository, workflowStatisticsRepository, findingRepository, syncRepository, ownerRepository, userRepository, sharedWorkflowRepository, logger, errorReporter) {
        this.ruleRegistry = ruleRegistry;
        this.migrationRegistry = migrationRegistry;
        this.breakingChangeService = breakingChangeService;
        this.workflowRepository = workflowRepository;
        this.workflowStatisticsRepository = workflowStatisticsRepository;
        this.findingRepository = findingRepository;
        this.syncRepository = syncRepository;
        this.ownerRepository = ownerRepository;
        this.userRepository = userRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.logger = logger.scoped('breaking-changes');
    }
    async getLightReport(targetVersion, scope) {
        const rules = this.ruleRegistry.getRules(targetVersion);
        const workflowRules = rules.filter(types_1.isWorkflowLevelRule);
        const instanceRules = rules.filter(types_1.isInstanceRule);
        const filter = workflowFilter(scope);
        const [openCounts, wontFixCounts, totalAffectedWorkflows, sync, totalWorkflows, instanceResults,] = await Promise.all([
            this.findingRepository.countUnresolvedByRule(targetVersion, filter, {}),
            this.findingRepository.countWontFixByRule(targetVersion, filter, {}),
            this.findingRepository.countDistinctUnresolvedWorkflows(targetVersion, filter, {}),
            this.syncRepository.getForVersion(targetVersion, {}),
            scope.kind === 'instance' ? this.workflowRepository.count() : scope.workflowIds.length,
            scope.kind === 'instance'
                ? this.breakingChangeService.getAllInstanceRulesResults(instanceRules)
                : [],
        ]);
        const openCountByRule = new Map(openCounts.map((row) => [row.ruleId, row.count]));
        const wontFixCountByRule = new Map(wontFixCounts.map((row) => [row.ruleId, row.count]));
        const workflowResults = [];
        for (const rule of workflowRules) {
            const nbAffectedWorkflows = openCountByRule.get(rule.id) ?? 0;
            const nbWontFixWorkflows = wontFixCountByRule.get(rule.id) ?? 0;
            if (nbAffectedWorkflows === 0 && nbWontFixWorkflows === 0)
                continue;
            workflowResults.push({
                ...(await this.describeRule(rule)),
                nbAffectedWorkflows,
                nbWontFixWorkflows,
            });
        }
        return {
            report: {
                generatedAt: sync?.syncedAt,
                targetVersion,
                currentVersion: constants_1.N8N_VERSION,
                instanceResults,
                workflowResults,
            },
            totalWorkflows,
            totalAffectedWorkflows,
            shouldCache: false,
        };
    }
    async getRuleFindings(targetVersion, ruleId, scope) {
        const rule = this.ruleRegistry.getRule(ruleId);
        if (!rule || !(0, types_1.isWorkflowLevelRule)(rule)) {
            throw new errors_1.NotFoundError(`Breaking change rule with ID '${ruleId}' not found.`);
        }
        const findings = await this.findingRepository.listTriageableForRule(targetVersion, ruleId, workflowFilter(scope), {});
        const workflowIds = findings.map((finding) => finding.workflowId);
        const [workflows, statistics, ownersByWorkflow, projectsByWorkflow] = await Promise.all([
            this.workflowRepository.findByIds(workflowIds, { fields: WORKFLOW_FIELDS }),
            this.workflowStatisticsRepository.findByWorkflowIds(workflowIds),
            this.loadOwners(workflowIds),
            this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(workflowIds),
        ]);
        const statisticsByWorkflow = groupByWorkflowId(statistics);
        const issuesByWorkflow = 'collectWorkflowData' in rule
            ? await this.issuesFromScan(targetVersion, rule)
            : await this.issuesFromRecheck(rule, workflows);
        const affectedWorkflows = [];
        for (const finding of findings) {
            const project = projectsByWorkflow.get(finding.workflowId);
            affectedWorkflows.push({
                id: finding.workflowId,
                name: finding.workflow.name,
                active: !!finding.workflow.activeVersionId,
                lastUpdatedAt: finding.workflow.updatedAt,
                ...(0, summarize_execution_statistics_1.summarizeExecutionStatistics)(statisticsByWorkflow.get(finding.workflowId) ?? []),
                issues: issuesByWorkflow.get(finding.workflowId) ?? [],
                status: finding.status,
                notifiedAt: finding.notifiedAt ?? undefined,
                owner: ownersByWorkflow.get(finding.workflowId),
                homeProjectId: project?.id,
                homeProjectName: project?.name,
                homeProjectType: project?.type,
            });
        }
        return { ...(await this.describeRule(rule, affectedWorkflows)), affectedWorkflows };
    }
    async describeRule(rule, affectedWorkflows = []) {
        const metadata = rule.getMetadata();
        return {
            ruleId: rule.id,
            ruleTitle: metadata.title,
            ruleDescription: metadata.description,
            ruleImpact: metadata.impact,
            ruleDocumentationUrl: metadata.documentationUrl,
            recommendations: await rule.getRecommendations(affectedWorkflows),
            migratable: this.migrationRegistry.has(rule.id),
        };
    }
    async loadOwners(workflowIds) {
        const rows = await this.ownerRepository.findByWorkflowIds(workflowIds, {});
        const userIds = [...new Set(rows.flatMap((row) => (row.userId ? [row.userId] : [])))];
        const users = userIds.length > 0 ? await this.userRepository.findManyByIds(userIds) : [];
        const usersById = new Map(users.map((user) => [user.id, user]));
        const owners = new Map();
        for (const row of rows) {
            const user = row.userId ? usersById.get(row.userId) : undefined;
            if (!user)
                continue;
            owners.set(row.workflowId, (0, workflow_owner_1.toWorkflowOwner)(user, row.source));
        }
        return owners;
    }
    async issuesFromScan(targetVersion, rule) {
        const result = await this.breakingChangeService.detectRule(targetVersion, rule);
        return new Map((result?.affectedWorkflows ?? []).map((workflow) => [workflow.id, workflow.issues]));
    }
    async issuesFromRecheck(rule, workflows) {
        const issuesByWorkflow = new Map();
        for (const workflow of workflows) {
            try {
                const result = await rule.detectWorkflow(workflow, (0, group_nodes_by_type_1.groupNodesByType)(workflow.nodes));
                issuesByWorkflow.set(workflow.id, result.issues);
            }
            catch (error) {
                this.logger.warn('Breaking change rule failed for workflow, listing it without issues', {
                    ruleId: rule.id,
                    workflowId: workflow.id,
                });
                this.errorReporter.error(error, { extra: { ruleId: rule.id, workflowId: workflow.id } });
            }
        }
        return issuesByWorkflow;
    }
};
exports.MigrationFindingQueryService = MigrationFindingQueryService;
exports.MigrationFindingQueryService = MigrationFindingQueryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [breaking_changes_rule_registry_service_1.RuleRegistry, breaking_changes_migration_registry_service_1.MigrationRegistry, breaking_changes_service_1.BreakingChangeService, db_1.WorkflowRepository, db_1.WorkflowStatisticsRepository, migration_finding_repository_1.MigrationFindingRepository, migration_finding_sync_repository_1.MigrationFindingSyncRepository, migration_workflow_owner_repository_1.MigrationWorkflowOwnerRepository, db_1.UserRepository, db_1.SharedWorkflowRepository, backend_common_1.Logger, n8n_core_1.ErrorReporter])
], MigrationFindingQueryService);
function groupByWorkflowId(statistics) {
    const grouped = new Map();
    for (const statistic of statistics) {
        const existing = grouped.get(statistic.workflowId);
        if (existing)
            existing.push(statistic);
        else
            grouped.set(statistic.workflowId, [statistic]);
    }
    return grouped;
}
//# sourceMappingURL=migration-finding-query.service.js.map