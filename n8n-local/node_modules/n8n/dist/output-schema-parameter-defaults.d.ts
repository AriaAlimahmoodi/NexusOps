import type { INodeProperties, NodeParameterValueType } from 'n8n-workflow';
interface SchemaContext {
    resource?: string;
    operation?: string;
}
export declare function getParameterDefaults(properties: INodeProperties[] | undefined, context: SchemaContext): Record<string, NodeParameterValueType>;
export {};
