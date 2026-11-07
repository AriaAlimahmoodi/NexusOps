import type { INodeParameters } from 'n8n-workflow';
export declare function asParameters(value: unknown): INodeParameters | undefined;
export declare const isExpression: (value: unknown) => boolean;
export declare function readInteger(parameters: INodeParameters, key: string, fallback: number, label: string, { min, max }?: {
    min?: number;
    max?: number;
}): number;
export declare function readString(parameters: INodeParameters, key: string, fallback: string, label: string): string;
export declare function readOptions(parameters: INodeParameters): INodeParameters;
export declare function pickDefined(parameters: INodeParameters, keys: string[]): INodeParameters;
