import type { CredentialMatcher } from './credential-matcher';
import { IdBasedCredentialMatcher } from './id-based-credential-matcher';
import { NameAndTypeCredentialMatcher } from './name-and-type-credential-matcher';
import { TypeOnlyCredentialMatcher } from './type-only-credential-matcher';
import type { CredentialMatchingMode } from '../../n8n-packages.types';
export declare class CredentialMatcherFactory {
    private readonly matchers;
    constructor(idBasedMatcher: IdBasedCredentialMatcher, nameAndTypeMatcher: NameAndTypeCredentialMatcher, typeOnlyMatcher: TypeOnlyCredentialMatcher);
    getMatcher(mode: CredentialMatchingMode): CredentialMatcher;
}
