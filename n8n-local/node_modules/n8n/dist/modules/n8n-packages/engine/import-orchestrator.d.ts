import { LicenseState } from '@n8n/backend-common';
import { NodeTypes } from '../../../node-types';
import { CredentialImporter } from '../entities/credential/credential-importer';
import type { CredentialApplyResult, CredentialBindingRequest, CredentialImportPlan } from '../entities/credential/credential.types';
import { DataTableImporter } from '../entities/data-table/data-table-importer';
import type { DataTableImportPlan, DataTableImportRequest } from '../entities/data-table/data-table.types';
import type { FolderImportContext, FolderImportPlan, PreparedFolder } from '../entities/folder/folder-import.types';
import { FolderImporter } from '../entities/folder/folder-importer';
import type { FolderRemovalPlan } from '../entities/folder/folder-removal.types';
import { FolderRemover } from '../entities/folder/folder-remover';
import { TagImporter } from '../entities/tag/tag-importer';
import type { TagImportPlan, TagImportRequest } from '../entities/tag/tag.types';
import { VariableImporter } from '../entities/variable/variable-importer';
import type { VariableApplyResult, VariableImportPlan, VariableImportRequest } from '../entities/variable/variable.types';
import { type MissingNodeTypeRequirement } from '../entities/workflow/missing-node-type-mode';
import type { PersistedWorkflowOutcome, PreparedWorkflow, WorkflowImportPlan } from '../entities/workflow/workflow-import.types';
import { WorkflowImporter } from '../entities/workflow/workflow-importer';
import type { WorkflowRemovalPlan } from '../entities/workflow/workflow-removal.types';
import { WorkflowRemover } from '../entities/workflow/workflow-remover';
import { WorkflowPublisher } from '../entities/workflow/workflow-publisher';
import type { BlockingIssue, ImportBindingMap, ImportContext, ImportedFolderSummary, ImportWorkflowProperties, PackageImportBindings, PackageImportSource, RemovedFolderSummary, RemovedWorkflowSummary, ResolvedImportFolderProperties } from '../n8n-packages.types';
import type { PackageWorkflowRequirement } from '../spec/requirements.schema';
import { ContentImportPolicyGate } from './content-import-policy';
import { CredentialSavePolicyGate } from './credential-save-policy';
export interface ImportOrchestrationInput {
    context: ImportContext;
    folders: PreparedFolder[];
    workflows: PreparedWorkflow[];
    credentialRequest: CredentialBindingRequest;
    dataTableRequest: DataTableImportRequest;
    variableRequest: VariableImportRequest;
    tagRequest: TagImportRequest;
    options: ImportWorkflowProperties & ResolvedImportFolderProperties;
    projectPendingCreation?: boolean;
    subWorkflowRequirements?: PackageWorkflowRequirement[];
    importSource?: PackageImportSource;
    explicitDeleteWorkflowIds?: string[];
}
export interface ImportContentResult {
    workflowOutcomes: PersistedWorkflowOutcome[];
    removedWorkflows: RemovedWorkflowSummary[];
    removedFolders: RemovedFolderSummary[];
    folderSummaries: ImportedFolderSummary[];
    bindings: PackageImportBindings;
    credentialResult: CredentialApplyResult;
    dataTablePlan: DataTableImportPlan;
    variablePlan: VariableImportPlan;
    variableResult: VariableApplyResult;
    tagPlan: TagImportPlan;
}
export interface ImportPlan {
    input: ImportOrchestrationInput;
    folderContext: FolderImportContext;
    credentialPlan: CredentialImportPlan;
    workflowPlan: WorkflowImportPlan;
    folderPlan: FolderImportPlan;
    dataTablePlan: DataTableImportPlan;
    variablePlan: VariableImportPlan;
    tagPlan: TagImportPlan;
    removalPlan: WorkflowRemovalPlan;
    folderRemovalPlan: FolderRemovalPlan;
    missingNodeTypes: MissingNodeTypeRequirement[];
    blockingIssues: BlockingIssue[];
}
export declare class ImportOrchestrator {
    private readonly credentialImporter;
    private readonly dataTableImporter;
    private readonly variableImporter;
    private readonly tagImporter;
    private readonly folderImporter;
    private readonly folderRemover;
    private readonly workflowImporter;
    private readonly workflowRemover;
    private readonly workflowPublisher;
    private readonly contentImportPolicyGate;
    private readonly credentialSavePolicyGate;
    private readonly nodeTypes;
    private readonly licenseState;
    constructor(credentialImporter: CredentialImporter, dataTableImporter: DataTableImporter, variableImporter: VariableImporter, tagImporter: TagImporter, folderImporter: FolderImporter, folderRemover: FolderRemover, workflowImporter: WorkflowImporter, workflowRemover: WorkflowRemover, workflowPublisher: WorkflowPublisher, contentImportPolicyGate: ContentImportPolicyGate, credentialSavePolicyGate: CredentialSavePolicyGate, nodeTypes: NodeTypes, licenseState: LicenseState);
    assertNotBlocked(plans: ImportPlan[], options: {
        apiKeyScopes: string[] | undefined;
    }): Promise<void>;
    private collectPackageBlockingIssues;
    plan(input: ImportOrchestrationInput): Promise<ImportPlan>;
    apply(plan: ImportPlan, seedWorkflowBindings?: ImportBindingMap): Promise<ImportContentResult>;
    private collectBlockingIssues;
}
