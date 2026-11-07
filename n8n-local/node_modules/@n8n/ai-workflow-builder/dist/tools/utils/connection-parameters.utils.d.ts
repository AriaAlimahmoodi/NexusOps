import type { INodeParameters } from 'n8n-workflow';
export declare const CONNECTION_AFFECTING_PARAMETERS: Set<string>;
export declare function validateConnectionParameters(parameters: INodeParameters): {
    valid: boolean;
    filtered: INodeParameters;
    warnings: string[];
};
export declare function extractConnectionParameters(parameters: INodeParameters): INodeParameters;
