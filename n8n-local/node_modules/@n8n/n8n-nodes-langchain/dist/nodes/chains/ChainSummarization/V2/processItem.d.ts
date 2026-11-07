import type { ChainValues } from '@langchain/core/utils/types';
import { type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';
export declare function processItem(ctx: IExecuteFunctions, itemIndex: number, item: INodeExecutionData, operationMode: string, chunkingMode: 'simple' | 'advanced' | 'none'): Promise<ChainValues | undefined>;
