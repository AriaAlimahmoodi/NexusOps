import type { ImportBindingMap, CredentialConflictPolicy, CredentialMatchingMode, CredentialMissingMode } from '../../n8n-packages.types';
import type { PackageCredentialRequirement, PackageRequirementConsumer } from '../../spec/requirements.schema';
import type { SerializedCredential, SerializedCredentialData } from '../../spec/serialized/credential.schema';
import type { AgentRequirementSource } from '../requirement-source';
export type PlacedCredentialRequirement = PackageCredentialRequirement & {
    packageData?: SerializedCredentialData;
    packageDataIsComplete?: boolean;
};
export interface CredentialReference {
    credentialId: string;
    credentialName?: string;
    credentialType?: string;
}
export interface WorkflowCredentialRequirement extends Required<CredentialReference> {
    workflowId: string;
}
export type CredentialRequirement = WorkflowCredentialRequirement | (AgentRequirementSource & CredentialReference);
export type CredentialResolutionFailureKind = 'not_found' | 'unknown_type' | 'source_not_found' | 'type_mismatch';
export type CredentialResolutionFailure = {
    kind: CredentialResolutionFailureKind;
    sourceId: string;
    name?: string;
    type?: string;
    targetId?: string;
    expectedType?: string;
    actualType?: string;
};
export interface CredentialResolution {
    successes: ImportBindingMap;
    failures: CredentialResolutionFailure[];
}
export interface CredentialMatch {
    sourceId: string;
    targetId: string;
    targetName: string;
    usedBy: PackageRequirementConsumer[];
}
export interface CredentialUpdateCandidate extends CredentialMatch {
    name: string;
    data?: SerializedCredentialData;
}
export interface CredentialImportPlan extends CredentialResolution {
    candidates: CredentialUpdateCandidate[];
    updates: CredentialUpdateCandidate[];
    forbidden: CredentialMatch[];
}
export interface CredentialConflict {
    kind: 'differs' | 'divergent';
    targetId: string;
    sourceIds: string[];
    name: string;
    usedBy: PackageRequirementConsumer[];
}
export type CredentialUpdateForbidden = Omit<CredentialConflict, 'kind'>;
export interface CredentialUpdateScope {
    projectIds: ReadonlySet<string>;
}
export interface CredentialApplyResult {
    bindings: ImportBindingMap;
    matched: string[];
    stubbed: string[];
    seeded: string[];
    incomplete: string[];
}
export interface CredentialBindingRequest {
    requirements: PlacedCredentialRequirement[] | undefined;
    matchingMode: CredentialMatchingMode;
    missingMode: CredentialMissingMode;
    credentialBindings?: ImportBindingMap;
    conflictPolicy: CredentialConflictPolicy;
    packageCredentials?: ReadonlyMap<string, SerializedCredential>;
    updateScope: CredentialUpdateScope;
}
export declare function createFailure(reference: PackageCredentialRequirement, kind: CredentialResolutionFailureKind): CredentialResolutionFailure;
