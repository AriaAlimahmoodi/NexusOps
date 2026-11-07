import { Logger } from '@n8n/backend-common';
import { SharedWorkflowRepository, CredentialsRepository, TagRepository, UserRepository, WorkflowRepository } from '@n8n/db';
import type { PolicyViolation } from '@n8n/decorators';
import { DataSource, EntityManager } from '@n8n/typeorm';
import { Cipher } from 'n8n-core';
import { type IWorkflowBase } from 'n8n-workflow';
import type { IWorkflowWithVersionMetadata } from '../interfaces';
import { DataTableDDLService } from '../modules/data-table/data-table-ddl.service';
import { WorkflowIndexService } from '../modules/workflow-index/workflow-index.service';
import { PolicyEnforcementService } from '../policy/policy-enforcement.service';
import { DeprecatedNodesValidationService } from '../workflows/deprecated-nodes-validation.service';
import { WorkflowService } from '../workflows/workflow.service';
export interface WorkflowImportViolations {
    workflowId: string | null;
    name: string;
    violations: PolicyViolation[];
}
export declare class ImportService {
    private readonly logger;
    private readonly credentialsRepository;
    private readonly tagRepository;
    private readonly dataSource;
    private readonly cipher;
    private readonly workflowIndexService;
    private readonly dataTableDDLService;
    private readonly userRepository;
    private readonly workflowService;
    private readonly policyEnforcementService;
    private readonly sharedWorkflowRepository;
    private readonly workflowRepository;
    private readonly deprecatedNodesValidationService;
    private dbCredentials;
    private dbTags;
    private foreignKeyCommands;
    constructor(logger: Logger, credentialsRepository: CredentialsRepository, tagRepository: TagRepository, dataSource: DataSource, cipher: Cipher, workflowIndexService: WorkflowIndexService, dataTableDDLService: DataTableDDLService, userRepository: UserRepository, workflowService: WorkflowService, policyEnforcementService: PolicyEnforcementService, sharedWorkflowRepository: SharedWorkflowRepository, workflowRepository: WorkflowRepository, deprecatedNodesValidationService: DeprecatedNodesValidationService);
    initRecords(): Promise<void>;
    importWorkflows(workflows: IWorkflowWithVersionMetadata[], projectId: string, userId: string, { activeState }: {
        activeState?: 'false' | 'fromJson';
    }): Promise<{
        violations: WorkflowImportViolations[];
    }>;
    private sortWorkflowsForActivation;
    private extractSubworkflowId;
    private activateWorkflow;
    replaceInvalidCreds(workflow: IWorkflowBase, projectId: string): Promise<void>;
    isTableEmpty(tableName: string): Promise<boolean>;
    areAllEntityTablesEmpty(tableNames: string[]): Promise<boolean>;
    truncateEntityTable(tableName: string, transactionManager: EntityManager): Promise<void>;
    getImportMetadata(inputDir: string): Promise<{
        tableNames: string[];
        entityFiles: Record<string, string[]>;
        dataTableFiles: Record<string, string[]>;
    }>;
    readEntityFile(filePath: string, customEncryptionKey?: string): Promise<Array<Record<string, unknown>>>;
    private decompressEntitiesZip;
    importEntities(inputDir: string, truncateTables: boolean, keyFilePath?: string, skipMigrationChecks?: boolean, skipTogglingForeignKeyConstraints?: boolean): Promise<void>;
    importEntitiesFromFiles(inputDir: string, transactionManager: EntityManager, entityNames: string[], entityFiles: Record<string, string[]>, customEncryptionKey?: string): Promise<void>;
    private toNewCredentialFormat;
    private normalizeEntityJsonColumns;
    dropExistingDataTableUserTables(transactionManager: EntityManager): Promise<void>;
    recreateDataTableUserTablesFromRegistry(transactionManager: EntityManager, dataTableFiles?: Record<string, string[]>, customEncryptionKey?: string): Promise<void>;
    advanceIdentitySequences(transactionManager: EntityManager, tableNames: string[]): Promise<void>;
    disableForeignKeyConstraints(transactionManager: EntityManager): Promise<void>;
    enableForeignKeyConstraints(transactionManager: EntityManager): Promise<void>;
    validateMigrations(inputDir: string, customEncryptionKey?: string): Promise<void>;
}
