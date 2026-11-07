import type { PlacedCredentialRequirement } from '../entities/credential/credential.types';
import type { PlacedVariableRequirement } from '../entities/variable/variable.types';
import { VariableParentPolicy } from '../n8n-packages.types';
import type { ImportCredentialProperties, ImportVariableProperties } from '../n8n-packages.types';
import type { ManifestEntry } from '../spec/manifest.schema';
import type { PackageCredentialRequirement, PackageVariableRequirement } from '../spec/requirements.schema';
import type { SerializedCredential } from '../spec/serialized/credential.schema';
import type { SerializedVariable } from '../spec/serialized/variable.schema';
export declare function foldersInScope(entries: ManifestEntry[] | undefined, basePrefix?: string): ManifestEntry[];
export declare function workflowsInScope(entries: ManifestEntry[] | undefined, basePrefix?: string): ManifestEntry[];
export declare function needsBundledCredentialData(request: ImportCredentialProperties, hasRequirements: boolean): boolean;
export declare function placeCredentialData({ requirements, bundledCredentials, }: {
    requirements: PackageCredentialRequirement[] | undefined;
    bundledCredentials?: ReadonlyMap<string, SerializedCredential>;
}): PlacedCredentialRequirement[] | undefined;
export declare function needsBundledVariableValues(request: ImportVariableProperties, hasRequirements: boolean): boolean;
export declare function needsBundledCredentialFiles(request: Pick<ImportCredentialProperties, 'credentialConflictPolicy'>, hasRequirements: boolean): boolean;
interface VariableBundleLookup {
    requirements: PackageVariableRequirement[] | undefined;
    manifestVariables: ManifestEntry[] | undefined;
    bundledVariables?: Map<string, SerializedVariable>;
}
export declare function placeByPolicy(params: VariableBundleLookup & {
    policy: VariableParentPolicy;
}): PlacedVariableRequirement[] | undefined;
export declare function placeByLayout(params: VariableBundleLookup & {
    scopePrefix: string;
}): PlacedVariableRequirement[] | undefined;
export declare function deriveParentFolderId(workflowTarget: string, folderTargetToId: Map<string, string>): string | null;
export {};
