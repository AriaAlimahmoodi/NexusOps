import type { Logger } from '@n8n/backend-common';
import type { BuilderTool, BuilderToolBase } from '../utils/stream-processor';
export interface GetWorkflowOverviewOutput {
    nodeCount: number;
    connectionCount: number;
    hasTrigger: boolean;
    format: 'mermaid' | 'summary';
    message: string;
}
export declare const GET_WORKFLOW_OVERVIEW_TOOL: BuilderToolBase;
export declare function createGetWorkflowOverviewTool(logger?: Logger): BuilderTool;
