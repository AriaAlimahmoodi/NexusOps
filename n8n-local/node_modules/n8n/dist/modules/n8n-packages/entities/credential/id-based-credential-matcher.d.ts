import { CredentialTypes } from '../../../../credential-types';
import { CredentialsService } from '../../../../credentials/credentials.service';
import { CredentialMatcher, type ResolvedCredentialMatch, type UsableCredential } from './credential-matcher';
import type { PackageCredentialRequirement } from '../../spec/requirements.schema';
export declare class IdBasedCredentialMatcher extends CredentialMatcher {
    constructor(credentialTypes: CredentialTypes, credentialsService: CredentialsService);
    protected resolve(unbound: PackageCredentialRequirement[], usableCredentials: UsableCredential[]): Map<string, ResolvedCredentialMatch>;
}
