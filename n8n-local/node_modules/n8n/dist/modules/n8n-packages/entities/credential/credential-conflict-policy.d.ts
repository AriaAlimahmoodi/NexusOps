import type { CredentialsEntity } from '@n8n/db';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import type { CredentialConflict, CredentialImportPlan, CredentialUpdateCandidate, CredentialUpdateForbidden, CredentialUpdateScope } from './credential.types';
import { CredentialConflictPolicy } from '../../n8n-packages.types';
import type { SerializedCredentialData } from '../../spec/serialized/credential.schema';
export declare function resolveCredentialConflictPolicy(policy: CredentialConflictPolicy | undefined): CredentialConflictPolicy;
export declare function credentialUpdateScope(destinationProjectIds: string[]): CredentialUpdateScope;
export type UpdatableCredential = Pick<CredentialsEntity, 'isManaged' | 'isResolvable' | 'usageScope' | 'shared'>;
export declare function isUpdateCandidate(credential: UpdatableCredential, scope: CredentialUpdateScope): boolean;
export declare function credentialDiffers(stored: {
    name: string;
    data: ICredentialDataDecryptedObject;
}, incoming: {
    name: string;
    data?: SerializedCredentialData;
}): boolean;
export declare function differingCredentials(updates: CredentialUpdateCandidate[]): CredentialConflict[];
export declare function divergentCredentials(candidates: CredentialUpdateCandidate[]): CredentialConflict[];
export declare function credentialConflicts(policy: CredentialConflictPolicy, plans: Array<Pick<CredentialImportPlan, 'candidates' | 'updates'>>): CredentialConflict[];
export declare function forbiddenCredentialUpdates(plans: Array<Pick<CredentialImportPlan, 'forbidden'>>): CredentialUpdateForbidden[];
