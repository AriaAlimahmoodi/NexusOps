import { Logger } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import { z } from 'zod';
import type { PackageManifest } from '../../modules/n8n-packages/spec/manifest.schema';
import type { BranchLayout } from './branch-placement';
declare const selectivePushOptionsSchema: z.ZodObject<{
    projectId: z.ZodString;
    workflowIds: z.ZodArray<z.ZodString, "many">;
    deletedWorkflowIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    workflowIds: string[];
    deletedWorkflowIds: string[];
}, {
    projectId: string;
    workflowIds: string[];
    deletedWorkflowIds: string[];
}>;
export type SelectivePushOptions = z.infer<typeof selectivePushOptionsSchema>;
declare const DEPENDENCY_COLLECTIONS: readonly ['credentials', 'dataTables', 'tags'];
type DependencyCollection = (typeof DEPENDENCY_COLLECTIONS)[number];
interface DependencyRef {
    collection: DependencyCollection;
    id: string;
    target: string;
}
export type ScannedBranch = {
    state: BranchLayout;
    dependencies: DependencyRef[];
};
export declare class WorkingCopyUpdater {
    private readonly instanceSettings;
    private readonly logger;
    constructor(instanceSettings: InstanceSettings, logger: Logger);
    validateSelection(selection: SelectivePushOptions): void;
    assertStagingMatchesSelection(staging: PackageManifest, selection: SelectivePushOptions): void;
    readBranchLayout(exportFolder: string): Promise<BranchLayout>;
    private scanBranch;
    private assertUniqueEntityIds;
    private assertUniqueDependencyIds;
    private readEntityFile;
    assertSelectionFitsBranch(exportFolder: string, selection: SelectivePushOptions): Promise<ScannedBranch>;
    assertDeletionsOnBranch(branch: BranchLayout, selection: SelectivePushOptions): void;
    assertNoCrossProjectMoves(branch: BranchLayout, selection: SelectivePushOptions): void;
    private assertNoCrossProjectContainerMoves;
    applySelection(exportFolder: string, stagingFolder: string, staging: PackageManifest, selection: SelectivePushOptions, branch: ScannedBranch): Promise<void>;
    private assertRemovableLeafTarget;
    private partitionChangedDependencies;
    private readEntityId;
    private resolveLeafTarget;
    private relocateBranchContainers;
    private overlayDirectory;
    private resolveContained;
}
export {};
