import type { User } from '@n8n/db';
import type { PackageWriter } from '../../io/package-writer';
import type { VariableConflictPolicy, VariableMissingMode } from '../../n8n-packages.types';
import type { ManifestEntry } from '../../spec/manifest.schema';
import type { PackageVariableRequirement } from '../../spec/requirements.schema';
import type { RequirementSource } from '../requirement-source';
export type VariableRequirement = RequirementSource & {
    variableName: string;
};
export interface WorkflowVariableRequirement {
    workflowId: string;
    variableName: string;
}
export interface VariableExportRequest {
    user: User;
    requirements: VariableRequirement[];
    writer: PackageWriter;
    includeVariableValues: boolean;
    projectTargetsById?: Map<string, string>;
}
export interface VariableExportResult {
    entries: ManifestEntry[];
    requirements: PackageVariableRequirement[];
}
export type PlacedVariableRequirement = PackageVariableRequirement & {
    globalPlacement: boolean;
    packageValue?: string;
};
export interface VariableImportRequest {
    requirements: PlacedVariableRequirement[] | undefined;
    missingMode: VariableMissingMode;
    conflictPolicy: VariableConflictPolicy;
}
export interface VariableResolutionFailure {
    name: string;
}
export interface VariableCreation {
    name: string;
    projectId?: string;
    value?: string;
}
export interface VariableConflict {
    name: string;
    projectId?: string;
}
export interface VariableOverwrite {
    variableId: string;
    name: string;
    projectId?: string;
    value: string;
}
export interface VariableLimitFailure {
    limit: number;
    remaining: number;
    requested: number;
    names: string[];
}
export declare function destinationKey(destination: {
    name: string;
    projectId?: string;
}): string;
export declare function divergentOverwrites(overwrites: VariableOverwrite[]): VariableOverwrite[];
export declare function computeVariableLimitFailure(creations: VariableCreation[], quota: {
    limit: number;
    remaining: number;
} | null): VariableLimitFailure | undefined;
export interface VariableImportPlan {
    matched: string[];
    missing: VariableResolutionFailure[];
    creations: VariableCreation[];
    conflicts: VariableConflict[];
    overwrites: VariableOverwrite[];
}
export interface VariableApplyResult {
    created: string[];
    stubbed: string[];
    skippedExisting: string[];
    updated: string[];
}
