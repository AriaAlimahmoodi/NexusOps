import type { RequestResponseMetadata } from '../../utils/agent-execution/types';
import type { EngineResponse, IExecuteFunctions, INodeType, INodeTypeDescription, NodeOutput } from 'n8n-workflow';
export declare class ToolExecutor implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions, response?: EngineResponse<RequestResponseMetadata>): Promise<NodeOutput>;
}
