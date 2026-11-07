import type { DynamicStructuredTool, Tool } from '@langchain/classic/tools';
import type { EngineRequest, IDataObject } from 'n8n-workflow';
import type { HitlMetadata, RequestResponseMetadata, ToolCallRequest, ToolMetadata } from './types';
export declare function hasGatedToolNodeName(metadata: unknown): metadata is ToolMetadata & {
    gatedToolNodeName: string;
};
export declare function extractHitlMetadata(metadata: ToolMetadata, toolName: string, toolInput: IDataObject): HitlMetadata | undefined;
export declare function createEngineRequests(toolCalls: ToolCallRequest[], itemIndex: number, tools: Array<DynamicStructuredTool | Tool>): EngineRequest<RequestResponseMetadata>['actions'];
