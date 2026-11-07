import type { RequestResponseMetadata } from '../../../../../../../utils/agent-execution';
import type { INode, EngineResponse } from 'n8n-workflow';
export declare function checkMaxIterations(response: EngineResponse<RequestResponseMetadata> | undefined, maxIterations: number, node: INode): void;
