import type { DisplayCondition, INodeProperties, NodeParameterValue } from 'n8n-workflow';
export declare const schemaTypeField: INodeProperties;
export declare const buildJsonSchemaExampleField: (props?: {
    showExtraProps?: Record<string, Array<NodeParameterValue | DisplayCondition> | undefined>;
}) => INodeProperties;
export declare const buildJsonSchemaExampleNotice: (props?: {
    showExtraProps?: Record<string, Array<NodeParameterValue | DisplayCondition> | undefined>;
}) => INodeProperties;
export declare const jsonSchemaExampleField: INodeProperties;
export declare const buildInputSchemaField: (props?: {
    showExtraProps?: Record<string, Array<NodeParameterValue | DisplayCondition> | undefined>;
}) => INodeProperties;
export declare const inputSchemaField: INodeProperties;
export declare const promptTypeOptionsDeprecated: INodeProperties;
export declare const promptTypeOptions: INodeProperties;
export declare const textInput: INodeProperties;
export declare const textFromPreviousNode: INodeProperties;
export declare const textFromGuardrailsNode: INodeProperties;
export declare const toolDescription: INodeProperties;
