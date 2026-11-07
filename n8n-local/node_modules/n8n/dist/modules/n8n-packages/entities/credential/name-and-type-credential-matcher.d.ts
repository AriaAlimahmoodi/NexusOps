import { CredentialTypes } from '../../../../credential-types';
import { CredentialsService } from '../../../../credentials/credentials.service';
import { CredentialMatcher, type CredentialMatcherContext, type ResolvedCredentialMatch, type UsableCredential } from './credential-matcher';
import type { PackageCredentialRequirement } from '../../spec/requirements.schema';
export declare class NameAndTypeCredentialMatcher extends CredentialMatcher {
    constructor(credentialTypes: CredentialTypes, credentialsService: CredentialsService);
    protected resolve(unbound: PackageCredentialRequirement[], usableCredentials: UsableCredential[], context: CredentialMatcherContext): Map<string, ResolvedCredentialMatch>;
}
