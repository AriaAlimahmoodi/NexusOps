import type { PackageWriter } from './package-writer';
import type { ManifestEntry, PackageManifest } from '../spec/manifest.schema';
import type { SerializedWorkflowMetadata } from '../spec/serialized/workflow-metadata.schema';
import type { SerializedWorkflow } from '../spec/serialized/workflow.schema';
export type ManifestEntityCollection = {
    [K in keyof PackageManifest]-?: NonNullable<PackageManifest[K]> extends ManifestEntry[] ? K : never;
}[keyof PackageManifest];
export declare const PACKAGE_ENTITY_LAYOUT: {
    readonly projects: {
        readonly directory: 'projects';
        readonly fileName: 'project.json';
    };
    readonly folders: {
        readonly directory: 'folders';
        readonly fileName: 'folder.json';
    };
    readonly workflows: {
        readonly directory: 'workflows';
        readonly fileName: 'workflow.json';
    };
    readonly agents: {
        readonly directory: 'agents';
        readonly fileName: 'agent.json';
    };
    readonly credentials: {
        readonly directory: 'credentials';
        readonly fileName: 'credential.json';
    };
    readonly dataTables: {
        readonly directory: 'data-tables';
        readonly fileName: 'data-table.json';
    };
    readonly variables: {
        readonly directory: 'variables';
        readonly fileName: 'variable.json';
    };
    readonly tags: {
        readonly directory: 'tags';
        readonly fileName: 'tag.json';
    };
};
export declare function packageDirectory(collection: ManifestEntityCollection, basePrefix?: string): string;
export declare function projectScopedDirectory(collection: ManifestEntityCollection, ownerProjectId: string | undefined, projectTargetsById: Map<string, string> | undefined): string;
export declare function entityFilePath(collection: ManifestEntityCollection, target: string): string;
export declare const WORKFLOW_METADATA_FILE_NAME = "workflow-metadata.json";
export declare function workflowMetadataFilePath(target: string): string;
export declare function agentMetadataFilePath(target: string): string;
export declare function createManifestEntry(collection: ManifestEntityCollection, baseDir: string, entity: {
    id: string;
    name: string;
}): ManifestEntry;
export declare function writeManifestEntry(writer: PackageWriter, collection: ManifestEntityCollection, baseDir: string, entity: {
    id: string;
    name: string;
}, serialized: unknown): Promise<ManifestEntry>;
export declare function writeWorkflowManifestEntry(writer: PackageWriter, baseDir: string, workflow: {
    id: string;
    name: string;
}, content: SerializedWorkflow, metadata: SerializedWorkflowMetadata): Promise<ManifestEntry>;
