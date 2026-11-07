import type { ResolvedCredentialMatch, UsableCredential } from './credential-matcher';
import type { PackageCredentialRequirement } from '../../spec/requirements.schema';
export declare function resolveByCandidateFilter(known: PackageCredentialRequirement[], usableCredentials: UsableCredential[], projectId: string, isCandidate: (candidate: UsableCredential, reference: PackageCredentialRequirement) => boolean): Map<string, ResolvedCredentialMatch>;
