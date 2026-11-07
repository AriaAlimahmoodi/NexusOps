import type { PackageManifest } from '../../modules/n8n-packages/spec/manifest.schema';
export type BranchLayout = Pick<PackageManifest, 'projects' | 'folders' | 'workflows'>;
declare const CONTAINER_KINDS: readonly ['projects', 'folders'];
export type ContainerKind = (typeof CONTAINER_KINDS)[number];
export interface ContainerMove {
    kind: ContainerKind;
    from: string;
    to: string;
}
export declare const isUnder: (target: string, prefix: string) => boolean;
export declare function containerMoves(existing: BranchLayout, staging: PackageManifest): ContainerMove[];
export declare function remapPath(target: string, moves: readonly ContainerMove[]): string;
export declare function staleWorkflowTargets(existing: BranchLayout, staging: PackageManifest, deletedWorkflowIds: Set<string>): string[];
export {};
