import type { BaseChatMemory } from '@langchain/classic/memory';
import type { INodeExecutionData } from 'n8n-workflow';
import type { N8nOutputParser } from '../../../../../../../utils/output_parsers/N8nOutputParser';
import type { AgentResult } from '../types';
export declare function finalizeResult(result: AgentResult, itemIndex: number, memory: BaseChatMemory | undefined, outputParser: N8nOutputParser | undefined): INodeExecutionData;
