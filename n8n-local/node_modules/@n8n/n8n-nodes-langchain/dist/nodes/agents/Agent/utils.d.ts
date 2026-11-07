import { type INodeInputConfiguration, type NodeConnectionType } from 'n8n-workflow';
export declare function getInputs(hasMainInput?: boolean, hasOutputParser?: boolean, needsFallback?: boolean): Array<NodeConnectionType | INodeInputConfiguration>;
