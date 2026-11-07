import type { MigrationFindingTriageStatus } from '@n8n/api-types';
import { RuleRegistry } from '../breaking-changes.rule-registry.service';
import { MigrationFindingRepository } from '../database/repositories/migration-finding.repository';
export declare class MigrationFindingTriageService {
    private readonly ruleRegistry;
    private readonly findingRepository;
    constructor(ruleRegistry: RuleRegistry, findingRepository: MigrationFindingRepository);
    setStatus(ruleId: string, workflowId: string, status: MigrationFindingTriageStatus): Promise<void>;
    setStatuses(ruleId: string, workflowIds: string[], status: MigrationFindingTriageStatus): Promise<void>;
    private getWorkflowRuleVersion;
}
