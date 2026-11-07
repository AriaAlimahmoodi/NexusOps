import type { ExecutionSummary } from 'n8n-workflow';
import { type ExecutionCursor } from './execution-cursor';
export interface ExecutionPage {
    items: ExecutionSummary[];
    hasMore: boolean;
}
export declare function mergeExecutionPages(pages: ExecutionPage[], limit: number, cursor?: ExecutionCursor): {
    results: ExecutionSummary[];
    nextCursor: import("@n8n/api-types").SerializedCursor | null;
};
