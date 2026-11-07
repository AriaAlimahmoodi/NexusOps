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
exports.BreakingChangeService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const breaking_changes_migration_registry_service_1 = require("./breaking-changes.migration-registry.service");
const breaking_changes_rule_registry_service_1 = require("./breaking-changes.rule-registry.service");
const group_nodes_by_type_1 = require("./group-nodes-by-type");
const summarize_execution_statistics_1 = require("./summarize-execution-statistics");
const constants_1 = require("../../constants");
let BreakingChangeService = class BreakingChangeService {
    constructor(ruleRegistry, migrationRegistry, workflowRepository, workflowStatisticsRepository, logger, errorReporter) {
        this.ruleRegistry = ruleRegistry;
        this.migrationRegistry = migrationRegistry;
        this.workflowRepository = workflowRepository;
        this.workflowStatisticsRepository = workflowStatisticsRepository;
        this.logger = logger;
        this.errorReporter = errorReporter;
        this.batchSize = 100;
        this.ongoingScans = new Map();
        this.scanChains = new Map();
        this.logger = logger.scoped('breaking-changes');
    }
    registerRules() {
        const ruleMetadata = di_1.Container.get(decorators_1.BreakingChangeRuleMetadata);
        const ruleInstances = ruleMetadata
            .getEntries()
            .map((entry) => di_1.Container.get(entry.class));
        this.ruleRegistry.registerAll(ruleInstances);
    }
    async getAllInstanceRulesResults(instanceLevelRules) {
        const instanceLevelResults = [];
        for (const rule of instanceLevelRules) {
            try {
                const ruleResult = await rule.detect();
                if (ruleResult.isAffected) {
                    instanceLevelResults.push({
                        ruleId: rule.id,
                        ruleTitle: rule.getMetadata().title,
                        ruleDescription: rule.getMetadata().description,
                        ruleImpact: rule.getMetadata().impact,
                        ruleDocumentationUrl: rule.getMetadata().documentationUrl,
                        instanceIssues: ruleResult.instanceIssues,
                        recommendations: ruleResult.recommendations,
                        migratable: this.migrationRegistry.has(rule.id),
                    });
                }
            }
            catch (error) {
                this.errorReporter.error(error, { shouldBeLogged: true });
            }
        }
        return instanceLevelResults;
    }
    async aggregateRegularRuleResults(workflowLevelRules, allAffectedWorkflowsByRule) {
        const results = [];
        for (const rule of workflowLevelRules) {
            const workflowResults = allAffectedWorkflowsByRule.get(rule.id) ?? [];
            const isAffected = workflowResults.some((wr) => wr.issues.length > 0);
            if (isAffected) {
                results.push({
                    ruleId: rule.id,
                    ruleTitle: rule.getMetadata().title,
                    ruleDescription: rule.getMetadata().description,
                    ruleImpact: rule.getMetadata().impact,
                    ruleDocumentationUrl: rule.getMetadata().documentationUrl,
                    affectedWorkflows: workflowResults,
                    recommendations: await rule.getRecommendations(workflowResults),
                    migratable: this.migrationRegistry.has(rule.id),
                });
            }
        }
        return results;
    }
    async aggregateBatchRuleResults(batchRules, workflowMetadataMap) {
        const results = [];
        for (const rule of batchRules) {
            const batchReport = await rule.produceReport();
            if (batchReport.affectedWorkflows.length === 0) {
                continue;
            }
            const affectedWorkflows = [];
            for (const affected of batchReport.affectedWorkflows) {
                const metadata = workflowMetadataMap.get(affected.workflowId);
                if (!metadata) {
                    this.logger.warn('Workflow metadata not found for batch rule result', {
                        workflowId: affected.workflowId,
                        ruleId: rule.id,
                    });
                    continue;
                }
                affectedWorkflows.push({
                    id: affected.workflowId,
                    name: metadata.name,
                    active: metadata.active,
                    issues: affected.issues,
                    numberOfExecutions: metadata.numberOfExecutions,
                    lastExecutedAt: metadata.lastExecutedAt,
                    lastUpdatedAt: metadata.lastUpdatedAt,
                });
            }
            if (affectedWorkflows.length > 0) {
                results.push({
                    ruleId: rule.id,
                    ruleTitle: rule.getMetadata().title,
                    ruleDescription: rule.getMetadata().description,
                    ruleImpact: rule.getMetadata().impact,
                    ruleDocumentationUrl: rule.getMetadata().documentationUrl,
                    affectedWorkflows,
                    recommendations: await rule.getRecommendations(affectedWorkflows),
                    migratable: this.migrationRegistry.has(rule.id),
                });
            }
        }
        return results;
    }
    async getAllWorkflowRulesResults(workflowLevelRules, batchRules, totalWorkflows) {
        const allAffectedWorkflowsByRule = new Map();
        const workflowMetadataMap = new Map();
        const failedChecks = [];
        batchRules.forEach((rule) => rule.reset());
        this.logger.debug('Processing workflows in batches', {
            totalWorkflows,
            batchSize: this.batchSize,
            regularRulesCount: workflowLevelRules.length,
            batchRulesCount: batchRules.length,
        });
        for (let skip = 0; skip < totalWorkflows; skip += this.batchSize) {
            const workflows = await this.workflowRepository.find({
                select: ['id', 'name', 'active', 'activeVersionId', 'nodes', 'updatedAt'],
                skip,
                take: this.batchSize,
                order: { id: 'ASC' },
            });
            this.logger.debug('Processing batch', { skip, workflowsInBatch: workflows.length });
            const workflowIds = workflows.map((w) => w.id);
            const allStatistics = await this.workflowStatisticsRepository.find({
                where: { workflowId: (0, typeorm_1.In)(workflowIds) },
            });
            const statisticsByWorkflowId = new Map();
            for (const stat of allStatistics) {
                if (!stat.workflowId)
                    continue;
                const existing = statisticsByWorkflowId.get(stat.workflowId);
                if (existing) {
                    existing.push(stat);
                }
                else {
                    statisticsByWorkflowId.set(stat.workflowId, [stat]);
                }
            }
            for (const workflow of workflows) {
                const nodesGroupedByType = (0, group_nodes_by_type_1.groupNodesByType)(workflow.nodes);
                const statistics = statisticsByWorkflowId.get(workflow.id) ?? [];
                const workflowMetadata = {
                    name: workflow.name,
                    active: !!workflow.activeVersionId,
                    ...(0, summarize_execution_statistics_1.summarizeExecutionStatistics)(statistics),
                    lastUpdatedAt: workflow.updatedAt,
                };
                workflowMetadataMap.set(workflow.id, workflowMetadata);
                for (const rule of workflowLevelRules) {
                    const result = await this.runWorkflowRule(rule, workflow, nodesGroupedByType, failedChecks);
                    if (result?.isAffected) {
                        const affectedWorkflow = {
                            id: workflow.id,
                            issues: result.issues,
                            ...workflowMetadata,
                        };
                        const existing = allAffectedWorkflowsByRule.get(rule.id);
                        if (existing) {
                            existing.push(affectedWorkflow);
                        }
                        else {
                            allAffectedWorkflowsByRule.set(rule.id, [affectedWorkflow]);
                        }
                    }
                }
                for (const rule of batchRules) {
                    try {
                        await rule.collectWorkflowData(workflow, nodesGroupedByType);
                    }
                    catch (error) {
                        this.reportRuleError(error, rule.id, workflow.id);
                        failedChecks.push({ ruleId: rule.id, workflowId: workflow.id });
                    }
                }
            }
        }
        const regularResults = await this.aggregateRegularRuleResults(workflowLevelRules, allAffectedWorkflowsByRule);
        const batchResults = await this.aggregateBatchRuleResults(batchRules, workflowMetadataMap);
        return { results: regularResults.concat(batchResults), failedChecks };
    }
    async shareInFlight(inFlight, targetVersion, start) {
        const existing = inFlight.get(targetVersion);
        if (existing) {
            this.logger.debug('Reusing ongoing scan', { targetVersion });
            return await existing;
        }
        const promise = start();
        inFlight.set(targetVersion, promise);
        try {
            return await promise;
        }
        finally {
            inFlight.delete(targetVersion);
        }
    }
    async runWorkflowRule(rule, workflow, nodesGroupedByType, failedChecks) {
        try {
            return await rule.detectWorkflow(workflow, nodesGroupedByType);
        }
        catch (error) {
            this.reportRuleError(error, rule.id, workflow.id);
            failedChecks.push({ ruleId: rule.id, workflowId: workflow.id });
            return undefined;
        }
    }
    reportRuleError(error, ruleId, workflowId) {
        this.logger.warn('Breaking change rule failed for workflow, skipping', { ruleId, workflowId });
        this.errorReporter.error(error, { extra: { ruleId, workflowId } });
    }
    async detectWorkflowHits(targetVersion, workflowId) {
        const workflow = await this.workflowRepository.findOne({
            select: ['id', 'name', 'active', 'activeVersionId', 'nodes', 'updatedAt'],
            where: { id: workflowId },
        });
        if (!workflow)
            return { hits: [], failedChecks: [] };
        const workflowLevelRules = this.ruleRegistry
            .getRules(targetVersion)
            .filter((rule) => 'detectWorkflow' in rule);
        const nodesGroupedByType = (0, group_nodes_by_type_1.groupNodesByType)(workflow.nodes);
        const hits = [];
        const failedChecks = [];
        for (const rule of workflowLevelRules) {
            const result = await this.runWorkflowRule(rule, workflow, nodesGroupedByType, failedChecks);
            if (result?.isAffected)
                hits.push({ ruleId: rule.id, workflowId });
        }
        return { hits, failedChecks };
    }
    async detect(targetVersion) {
        return await this.shareInFlight(this.ongoingScans, targetVersion, async () => await this.runAfterPreviousScan(targetVersion, async () => await this.runScan(targetVersion)));
    }
    async detectRule(targetVersion, rule) {
        const fullScan = this.ongoingScans.get(targetVersion);
        if (fullScan) {
            this.logger.debug('Taking the rule result from the ongoing detection', {
                targetVersion,
                ruleId: rule.id,
            });
            const { report } = await fullScan;
            return report.workflowResults.find((result) => result.ruleId === rule.id);
        }
        return await this.runAfterPreviousScan(targetVersion, async () => {
            const totalWorkflows = await this.workflowRepository.count();
            const scan = 'detectWorkflow' in rule
                ? await this.getAllWorkflowRulesResults([rule], [], totalWorkflows)
                : await this.getAllWorkflowRulesResults([], [rule], totalWorkflows);
            return scan.results[0];
        });
    }
    async runAfterPreviousScan(targetVersion, scan) {
        const previous = this.scanChains.get(targetVersion) ?? Promise.resolve();
        const run = previous.then(scan);
        const settled = run.then(() => { }, () => { });
        this.scanChains.set(targetVersion, settled);
        try {
            return await run;
        }
        finally {
            if (this.scanChains.get(targetVersion) === settled)
                this.scanChains.delete(targetVersion);
        }
    }
    async runScan(targetVersion) {
        const startTime = Date.now();
        this.logger.debug('Starting breaking change detection', { targetVersion });
        const rules = this.ruleRegistry.getRules(targetVersion);
        const workflowLevelRules = rules.filter((rule) => 'detectWorkflow' in rule);
        const batchWorkflowRules = rules.filter((rule) => 'collectWorkflowData' in rule);
        const instanceLevelRules = rules.filter((rule) => 'detect' in rule);
        const totalWorkflows = await this.workflowRepository.count();
        const [instanceLevelResults, workflowScan] = await Promise.all([
            this.getAllInstanceRulesResults(instanceLevelRules),
            this.getAllWorkflowRulesResults(workflowLevelRules, batchWorkflowRules, totalWorkflows),
        ]);
        const report = this.createDetectionReport(targetVersion, instanceLevelResults, workflowScan.results);
        const duration = Date.now() - startTime;
        this.logger.debug('Breaking change detection completed', {
            duration,
        });
        return {
            report,
            totalWorkflows,
            failedChecks: workflowScan.failedChecks,
        };
    }
    createDetectionReport(targetVersion, instanceResults, workflowResults) {
        return {
            generatedAt: new Date(),
            targetVersion,
            currentVersion: constants_1.N8N_VERSION,
            workflowResults,
            instanceResults,
        };
    }
};
exports.BreakingChangeService = BreakingChangeService;
exports.BreakingChangeService = BreakingChangeService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [breaking_changes_rule_registry_service_1.RuleRegistry, breaking_changes_migration_registry_service_1.MigrationRegistry, db_1.WorkflowRepository, db_1.WorkflowStatisticsRepository, backend_common_1.Logger, n8n_core_1.ErrorReporter])
], BreakingChangeService);
//# sourceMappingURL=breaking-changes.service.js.map