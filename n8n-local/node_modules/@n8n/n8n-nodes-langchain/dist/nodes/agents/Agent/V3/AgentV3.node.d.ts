import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, INodeTypeBaseDescription, EngineResponse, EngineRequest } from 'n8n-workflow';
import type { RequestResponseMetadata } from '../../../../utils/agent-execution';
export declare class AgentV3 implements INodeType {
    description: INodeTypeDescription;
    constructor(baseDescription: INodeTypeBaseDescription);
    execute(this: IExecuteFunctions, response?: EngineResponse<RequestResponseMetadata>): Promise<INodeExecutionData[][] | EngineRequest<RequestResponseMetadata>>;
}
