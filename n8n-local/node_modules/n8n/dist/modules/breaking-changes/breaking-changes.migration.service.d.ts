import type { WorkflowMigrationResult } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { NodeTypes } from '../../node-types';
import { WorkflowFinderService } from '../../workflows/workflow-finder.service';
import { WorkflowValidationService } from '../../workflows/workflow-validation.service';
import { WorkflowService } from '../../workflows/workflow.service';
import { MigrationRegistry } from './breaking-changes.migration-registry.service';
import { RuleRegistry } from './breaking-changes.rule-registry.service';
import { WorkflowMigrationNodeError } from './migrations/node-migration';
export { WorkflowMigrationNodeError };
export declare const WORKFLOW_NOT_EDITABLE_MESSAGE = "Workflow not found, or you do not have permission to update it.";
export declare class BreakingChangeMigrationService {
    private readonly ruleRegistry;
    private readonly migrationRegistry;
    private readonly workflowFinderService;
    private readonly workflowService;
    private readonly workflowValidationService;
    private readonly nodeTypes;
    private readonly logger;
    constructor(ruleRegistry: RuleRegistry, migrationRegistry: MigrationRegistry, workflowFinderService: WorkflowFinderService, workflowService: WorkflowService, workflowValidationService: WorkflowValidationService, nodeTypes: NodeTypes, logger: Logger);
    migrateWorkflow(ruleId: string, workflowId: string, user: User): Promise<WorkflowMigrationResult>;
    private applyNodeMigration;
    private applyWorkflowMigration;
}
