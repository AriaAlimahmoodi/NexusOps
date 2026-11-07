import type { RequestResponseMetadata } from '../../../../../../utils/agent-execution';
import type { EngineRequest, EngineResponse, IExecuteFunctions, INodeExecutionData, ISupplyDataFunctions } from 'n8n-workflow';
export declare function toolsAgentExecute(this: IExecuteFunctions | ISupplyDataFunctions, response?: EngineResponse<RequestResponseMetadata>): Promise<INodeExecutionData[][] | EngineRequest<RequestResponseMetadata>>;
