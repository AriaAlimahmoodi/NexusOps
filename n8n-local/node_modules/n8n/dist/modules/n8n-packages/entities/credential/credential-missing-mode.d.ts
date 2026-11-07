import type { CredentialResolution, CredentialResolutionFailure } from './credential.types';
import type { CredentialMissingMode } from '../../n8n-packages.types';
import type { PackageCredentialRequirement } from '../../spec/requirements.schema';
export declare function canStubNotFoundFailure(failure: CredentialResolutionFailure): boolean;
export declare function credentialBlockingFailures(mode: CredentialMissingMode, resolution: CredentialResolution): CredentialResolutionFailure[];
export declare function credentialsToStub(mode: CredentialMissingMode, resolution: CredentialResolution): CredentialResolutionFailure[];
export declare function credentialMissingModeCreates(mode: CredentialMissingMode): boolean;
export declare function credentialMissingModeUsesPackageData(mode: CredentialMissingMode): boolean;
export declare function workflowsBlockedFromPublish(requirements: PackageCredentialRequirement[] | undefined, sourceIds: ReadonlySet<string>): Set<string>;
