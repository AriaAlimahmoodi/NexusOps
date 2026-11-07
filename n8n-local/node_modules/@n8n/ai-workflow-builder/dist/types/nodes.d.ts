import type { INodeParameters, INodeProperties, INodeTypeDescription } from 'n8n-workflow';
export interface NodeDetails {
    name: string;
    displayName: string;
    description: string;
    properties: INodeProperties[];
    subtitle?: string;
    inputs: INodeTypeDescription['inputs'];
    outputs: INodeTypeDescription['outputs'];
}
export interface NodeSearchResult {
    name: string;
    displayName: string;
    description: string;
    version: number;
    score: number;
    inputs: INodeTypeDescription['inputs'];
    outputs: INodeTypeDescription['outputs'];
}
export interface AddedNode {
    id: string;
    name: string;
    type: string;
    displayName?: string;
    parameters?: INodeParameters;
    position: [number, number];
}
