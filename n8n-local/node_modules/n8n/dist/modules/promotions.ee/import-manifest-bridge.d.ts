import type { PackageManifest } from '../../modules/n8n-packages/spec/manifest.schema';
import { type ContainerMove } from './branch-placement';
export declare function readLeftoverManifest(exportFolder: string): Promise<PackageManifest | undefined>;
export declare function writeImportManifest(options: {
    exportFolder: string;
    staging: PackageManifest;
    sourceId: string;
    selectedWorkflowIds?: readonly string[];
    containerMoves?: readonly ContainerMove[];
}): Promise<void>;
