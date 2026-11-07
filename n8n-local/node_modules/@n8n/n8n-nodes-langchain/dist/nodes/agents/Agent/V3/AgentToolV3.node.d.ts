import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, INodeTypeBaseDescription, ISupplyDataFunctions, EngineResponse, EngineRequest } from 'n8n-workflow';
import type { RequestResponseMetadata } from '../../../../utils/agent-execution';
export declare class AgentToolV3 implements INodeType {
    description: INodeTypeDescription;
    constructor(baseDescription: INodeTypeBaseDescription);
    execute(this: IExecuteFunctions | ISupplyDataFunctions, response?: EngineResponse<RequestResponseMetadata>): Promise<INodeExecutionData[][] | EngineRequest<RequestResponseMetadata>>;
}
