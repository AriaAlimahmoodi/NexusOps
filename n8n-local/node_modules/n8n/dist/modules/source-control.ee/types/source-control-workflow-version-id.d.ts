import type { StatusResourceOwner } from './resource-owner';
export interface SourceControlWorkflowVersionId {
    id: string;
    versionId: string;
    filename: string;
    name?: string;
    description?: string | null;
    localId?: string;
    remoteId?: string;
    parentFolderId: string | null;
    updatedAt?: string;
    owner?: StatusResourceOwner;
    isRemoteArchived?: boolean;
}
