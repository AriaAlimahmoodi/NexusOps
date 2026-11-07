import type { CredentialUsageScope } from '@n8n/db';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import type { RemoteResourceOwner, StatusResourceOwner } from './resource-owner';
export interface ExportableCredential {
    id: string;
    name: string;
    type: string;
    data: ICredentialDataDecryptedObject;
    ownedBy: RemoteResourceOwner | null;
    isGlobal?: boolean;
    isResolvable?: boolean;
    resolvableAllowFallback?: boolean;
    usageScope?: CredentialUsageScope;
}
export type StatusExportableCredential = ExportableCredential & {
    filename: string;
    ownedBy?: StatusResourceOwner;
};
