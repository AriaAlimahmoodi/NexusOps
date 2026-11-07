import type { User } from '@n8n/db';
import type { CredentialTypes } from '../../../../credential-types';
import type { CredentialsService } from '../../../../credentials/credentials.service';
import { type CredentialResolution } from './credential.types';
import type { ImportBindingMap } from '../../n8n-packages.types';
import type { PackageCredentialRequirement } from '../../spec/requirements.schema';
export interface CredentialMatcherContext {
    projectId: string;
    user: User;
    credentialBindings?: ImportBindingMap;
}
export type UsableCredential = Awaited<ReturnType<CredentialsService['getCredentialsAUserCanUseInAWorkflow']>>[number];
export interface ResolvedCredentialMatch {
    targetId: string;
    targetType: string;
}
export declare abstract class CredentialMatcher {
    protected readonly credentialTypes: CredentialTypes;
    protected readonly credentialsService: CredentialsService;
    constructor(credentialTypes: CredentialTypes, credentialsService: CredentialsService);
    match(requirements: PackageCredentialRequirement[] | undefined, context: CredentialMatcherContext): Promise<CredentialResolution>;
    protected abstract resolve(unbound: PackageCredentialRequirement[], usableCredentials: UsableCredential[], context: CredentialMatcherContext): Map<string, ResolvedCredentialMatch>;
}
