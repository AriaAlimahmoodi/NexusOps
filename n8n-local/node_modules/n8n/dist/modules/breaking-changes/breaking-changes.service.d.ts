import { BreakingChangeInstanceRuleResult, BreakingChangeReportResult, BreakingChangeVersion, BreakingChangeWorkflowRuleResult } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { WorkflowRepository, WorkflowStatisticsRepository } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
import { MigrationRegistry } from './breaking-changes.migration-registry.service';
import { RuleRegistry } from './breaking-changes.rule-registry.service';
import type { IBreakingChangeBatchWorkflowRule, IBreakingChangeInstanceRule, IBreakingChangeWorkflowRule } from './types';
export interface FailedRuleCheck {
    ruleId: string;
    workflowId: string;
}
export interface BreakingChangeDetectionResult extends Omit<BreakingChangeReportResult, 'shouldCache'> {
    failedChecks: FailedRuleCheck[];
}
export interface WorkflowRuleHit {
    ruleId: string;
    workflowId: string;
}
export interface WorkflowHitsResult {
    hits: WorkflowRuleHit[];
    failedChecks: FailedRuleCheck[];
}
export declare class BreakingChangeService {
    private readonly ruleRegistry;
    private readonly migrationRegistry;
    private readonly workflowRepository;
    private readonly workflowStatisticsRepository;
    private readonly logger;
    private readonly errorReporter;
    private readonly batchSize;
    private readonly ongoingScans;
    private readonly scanChains;
    constructor(ruleRegistry: RuleRegistry, migrationRegistry: MigrationRegistry, workflowRepository: WorkflowRepository, workflowStatisticsRepository: WorkflowStatisticsRepository, logger: Logger, errorReporter: ErrorReporter);
    registerRules(): void;
    getAllInstanceRulesResults(instanceLevelRules: IBreakingChangeInstanceRule[]): Promise<BreakingChangeInstanceRuleResult[]>;
    private aggregateRegularRuleResults;
    private aggregateBatchRuleResults;
    private getAllWorkflowRulesResults;
    private shareInFlight;
    private runWorkflowRule;
    private reportRuleError;
    detectWorkflowHits(targetVersion: BreakingChangeVersion, workflowId: string): Promise<WorkflowHitsResult>;
    detect(targetVersion: BreakingChangeVersion): Promise<BreakingChangeDetectionResult>;
    detectRule(targetVersion: BreakingChangeVersion, rule: IBreakingChangeWorkflowRule | IBreakingChangeBatchWorkflowRule): Promise<BreakingChangeWorkflowRuleResult | undefined>;
    private runAfterPreviousScan;
    private runScan;
    private createDetectionReport;
}
