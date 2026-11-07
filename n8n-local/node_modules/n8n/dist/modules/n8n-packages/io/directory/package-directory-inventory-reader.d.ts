import { WorkflowSerializer, type WorkflowPackageContent } from '../../entities/workflow/workflow.serializer';
import { type SerializedCredential } from '../../spec/serialized/credential.schema';
import { type SerializedDataTable } from '../../spec/serialized/data-table.schema';
import { type SerializedProject } from '../../spec/serialized/project.schema';
import { type SerializedVariable } from '../../spec/serialized/variable.schema';
import type { PackageReader } from '../package-reader';
export type PackageFileSource = Pick<PackageReader, 'listEntries' | 'readFile'>;
export interface InventoryProject extends SerializedProject {
    path: string;
}
export interface InventoryWorkflow {
    path: string;
    projectId: string;
    id: string;
    name: string;
    content: WorkflowPackageContent;
}
export interface InventoryCredential {
    path: string;
    projectId: string | null;
    credential: SerializedCredential;
}
export interface InventoryVariable {
    path: string;
    projectId: string | null;
    variable: SerializedVariable;
}
export interface InventoryDataTable {
    path: string;
    dataTable: SerializedDataTable;
}
export interface PackageDirectoryInventory {
    projects: InventoryProject[];
    workflows: InventoryWorkflow[];
    credentials: InventoryCredential[];
    variables: InventoryVariable[];
    dataTables: InventoryDataTable[];
}
export declare class PackageDirectoryInventoryReader {
    private readonly workflowSerializer;
    constructor(workflowSerializer: WorkflowSerializer);
    read(source: PackageFileSource): Promise<PackageDirectoryInventory>;
    private readProjects;
    private readWorkflows;
    private readCredentials;
    private readVariables;
    private readDataTables;
    private readEntity;
}
export declare function assertUnseen(seen: Set<string>, key: string, label: string, displayKey?: string): void;
