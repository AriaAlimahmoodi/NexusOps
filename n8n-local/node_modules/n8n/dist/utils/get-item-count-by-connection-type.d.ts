import type { NodeConnectionType, ITaskData } from 'n8n-workflow';
export declare function getItemCountByConnectionType(data: ITaskData['data']): Partial<Record<NodeConnectionType, number[]>>;
