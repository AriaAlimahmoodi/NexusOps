import type { INodeTypeDescription } from 'n8n-workflow';
export type NodeTypePattern = string;
export interface PromptContext {
    nodeType: string;
    nodeDefinition: INodeTypeDescription;
    requestedChanges: string[];
    hasResourceLocatorParams?: boolean;
}
export interface NodeTypeGuide {
    patterns: NodeTypePattern[];
    content: string;
    condition?: (context: PromptContext) => boolean;
}
export interface NodeTypeExamples {
    patterns: NodeTypePattern[];
    content: string;
    condition?: (context: PromptContext) => boolean;
}
