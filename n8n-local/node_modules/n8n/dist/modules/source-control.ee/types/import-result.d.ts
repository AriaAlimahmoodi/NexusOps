import type { ContentImportPolicyResult, WorkflowPublishBlockedDetails } from '@n8n/api-types';
import type { TagEntity, WorkflowTagMapping } from '@n8n/db';
export interface WorkflowImportResult {
    id: string;
    name: string;
    publishingError?: string;
    publishingErrorDetails?: WorkflowPublishBlockedDetails;
    contentImportPolicy?: ContentImportPolicyResult;
}
export interface CredentialImportResult {
    id: string;
    name: string;
    type: string;
    contentImportPolicy?: ContentImportPolicyResult;
}
export interface ImportResult {
    workflows: WorkflowImportResult[];
    credentials: CredentialImportResult[];
    variables: {
        imported: string[];
    };
    tags: {
        tags: TagEntity[];
        mappings: WorkflowTagMapping[];
    };
    removedFiles?: string[];
}
