import type { INode } from 'n8n-workflow';
export interface HealNodeIdsReport {
    filled: Array<{
        name: string;
        newId: string;
    }>;
    reassigned: Array<{
        name: string;
        oldId: string;
        newId: string;
    }>;
    dropped: Array<{
        name: string;
        id: string;
    }>;
}
export type HealNodeIdsResult = {
    changed: false;
} | {
    changed: true;
    nodes: INode[];
    report: HealNodeIdsReport;
};
export declare function healNodeIds(nodes: INode[], { isTriggerLike }: {
    isTriggerLike: (node: INode) => boolean;
}): HealNodeIdsResult;
