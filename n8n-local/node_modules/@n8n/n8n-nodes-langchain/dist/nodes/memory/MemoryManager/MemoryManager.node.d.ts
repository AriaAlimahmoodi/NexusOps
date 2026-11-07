import type { MessageContent, BaseMessage } from '@langchain/core/messages';
import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare function simplifyMessages(messages: BaseMessage[]): Array<Record<string, MessageContent>>;
export declare class MemoryManager implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
