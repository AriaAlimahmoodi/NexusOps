import type { Tool } from '@langchain/core/tools';
import { type INodeExecutionData } from 'n8n-workflow';
export declare function executeTool(tool: Tool, query: string | object): Promise<INodeExecutionData>;
