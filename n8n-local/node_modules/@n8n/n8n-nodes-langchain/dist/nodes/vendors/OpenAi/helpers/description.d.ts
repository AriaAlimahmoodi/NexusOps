import type { INodeInputConfiguration } from 'n8n-workflow';
export declare const prettifyOperation: (resource: string, operation: string) => string;
export declare const configureNodeInputs: (resource: string, operation: string, hideTools: string, memory: string | undefined) => string[] | INodeInputConfiguration[] | ({
    type: string;
    displayName?: undefined;
} | {
    type: string;
    displayName: string;
})[];
