import type { INode } from 'n8n-workflow';
export interface TriggerDiffOptions {
    versionChanged?: boolean;
}
export interface TriggerDiff {
    toAdd: Set<INode['id']>;
    toRemove: Set<INode['id']>;
}
export declare function computeTriggerDiff(oldTriggerNodes: INode[], newTriggerNodes: INode[], { versionChanged }?: TriggerDiffOptions): TriggerDiff;
