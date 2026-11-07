import type { BreakingChangeLightReportResult, BreakingChangeRuleDetailResult, BreakingChangeVersion } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { SharedWorkflowRepository, UserRepository, WorkflowRepository, WorkflowStatisticsRepository } from '@n8n/db';
import { ErrorReporter } from 'n8n-core';
import { MigrationRegistry } from '../breaking-changes.migration-registry.service';
import { RuleRegistry } from '../breaking-changes.rule-registry.service';
import { BreakingChangeService } from '../breaking-changes.service';
import { MigrationFindingSyncRepository } from '../database/repositories/migration-finding-sync.repository';
import { MigrationFindingRepository } from '../database/repositories/migration-finding.repository';
import { MigrationWorkflowOwnerRepository } from '../database/repositories/migration-workflow-owner.repository';
export type ReportScope = {
    kind: 'instance';
} | {
    kind: 'workflows';
    workflowIds: string[];
};
export declare class MigrationFindingQueryService {
    private readonly ruleRegistry;
    private readonly migrationRegistry;
    private readonly breakingChangeService;
    private readonly workflowRepository;
    private readonly workflowStatisticsRepository;
    private readonly findingRepository;
    private readonly syncRepository;
    private readonly ownerRepository;
    private readonly userRepository;
    private readonly sharedWorkflowRepository;
    private readonly logger;
    private readonly errorReporter;
    constructor(ruleRegistry: RuleRegistry, migrationRegistry: MigrationRegistry, breakingChangeService: BreakingChangeService, workflowRepository: WorkflowRepository, workflowStatisticsRepository: WorkflowStatisticsRepository, findingRepository: MigrationFindingRepository, syncRepository: MigrationFindingSyncRepository, ownerRepository: MigrationWorkflowOwnerRepository, userRepository: UserRepository, sharedWorkflowRepository: SharedWorkflowRepository, logger: Logger, errorReporter: ErrorReporter);
    getLightReport(targetVersion: BreakingChangeVersion, scope: ReportScope): Promise<BreakingChangeLightReportResult>;
    getRuleFindings(targetVersion: BreakingChangeVersion, ruleId: string, scope: ReportScope): Promise<BreakingChangeRuleDetailResult>;
    private describeRule;
    private loadOwners;
    private issuesFromScan;
    private issuesFromRecheck;
}
