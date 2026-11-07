import type { LicenseState } from '@n8n/backend-common';
import type { CredentialResolution } from '../entities/credential/credential.types';
import type { DataTableImportPlan } from '../entities/data-table/data-table.types';
import type { TagImportPlan } from '../entities/tag/tag.types';
import type { WorkflowImportPlan } from '../entities/workflow/workflow-import.types';
import type { CredentialMissingMode } from '../n8n-packages.types';
export declare function assertPackageImportApiKeyScopes(apiKeyScopes: string[] | undefined, required: string[]): void;
export declare function assertVariableWritesAllowed(options: {
    licenseState: LicenseState;
    apiKeyScopes: string[] | undefined;
    hasCreations: boolean;
    hasOverwrites: boolean;
}): void;
export declare function assertDataTableWritesAllowed(apiKeyScopes: string[] | undefined, dataTablePlans: DataTableImportPlan[]): void;
export declare function assertCredentialWritesAllowed(apiKeyScopes: string[] | undefined, credentialPlans: Array<{
    missingMode: CredentialMissingMode;
    resolution: CredentialResolution;
}>): void;
export declare function assertTagWritesAllowed(apiKeyScopes: string[] | undefined, tagPlans: TagImportPlan[]): void;
export declare function assertArchiveTransitionsAllowed(apiKeyScopes: string[] | undefined, workflowPlans: WorkflowImportPlan[]): void;
