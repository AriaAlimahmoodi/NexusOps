import type { DataTableColumnType } from 'n8n-workflow';
import type { DataTableMatchingMode, DataTableMissingMode, DataTableSchemaConflictPolicy } from '../../n8n-packages.types';
import type { PackageDataTableRequirement } from '../../spec/requirements.schema';
import type { SerializedDataTable } from '../../spec/serialized/data-table.schema';
import type { RequirementSource } from '../requirement-source';
export type DataTableRequirement = RequirementSource & {
    dataTableId: string;
};
export interface WorkflowDataTableRequirement {
    workflowId: string;
    dataTableId: string;
}
export type DataTableResolutionFailureKind = 'missing' | 'id-conflict' | 'name-conflict' | 'schema-incompatible' | 'module-disabled' | 'permission-denied';
export type DataTableColumnTypeMismatch = {
    column: string;
    expectedType: string;
    actualType: string;
};
export type DataTableResolutionFailure = {
    kind: DataTableResolutionFailureKind;
    sourceId?: string;
    name?: string;
    existingProjectId?: string;
    missingColumns?: string[];
    typeMismatches?: DataTableColumnTypeMismatch[];
    extraColumns?: string[];
    overwriteChanges?: DataTableSchemaOperation[];
    missingScope?: 'dataTable:create' | 'dataTable:update';
    conflictingTableId?: string;
    currentName?: string;
};
export declare function createFailure(requirement: PackageDataTableRequirement, kind: DataTableResolutionFailureKind, details?: Partial<Pick<DataTableResolutionFailure, 'name' | 'existingProjectId' | 'missingColumns' | 'typeMismatches' | 'extraColumns' | 'overwriteChanges' | 'conflictingTableId' | 'currentName'>>): DataTableResolutionFailure;
export type DataTableSchemaOperation = {
    kind: 'add-column';
    column: string;
    type: DataTableColumnType;
    destructive: false;
} | {
    kind: 'remove-column';
    column: string;
    type: DataTableColumnType;
    destructive: true;
} | {
    kind: 'change-column-type';
    column: string;
    from: DataTableColumnType;
    to: DataTableColumnType;
    destructive: true;
} | {
    kind: 'rename-column';
    from: string;
    to: string;
    destructive: false;
} | {
    kind: 'reorder-columns';
    destructive: false;
} | {
    kind: 'rename-table';
    from: string;
    to: string;
    destructive: false;
};
export interface DataTableUpdate {
    table: SerializedDataTable;
    operations: DataTableSchemaOperation[];
}
export interface DataTableImportRequest {
    requirements: PackageDataTableRequirement[] | undefined;
    packageDataTables: SerializedDataTable[];
    matchingMode: DataTableMatchingMode;
    missingMode: DataTableMissingMode;
    schemaConflictPolicy: DataTableSchemaConflictPolicy;
}
export interface DataTableImportPlan {
    creations: SerializedDataTable[];
    updates: DataTableUpdate[];
    columnAlignments: SerializedDataTable[];
    failures: DataTableResolutionFailure[];
    matchedCount: number;
}
