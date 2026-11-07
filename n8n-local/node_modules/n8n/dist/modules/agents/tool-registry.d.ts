import type { BuiltTool } from '@n8n/agents';
export interface ToolRegistryEntry {
    kind: 'tool' | 'workflow' | 'node';
    workflowId?: string;
    workflowName?: string;
    triggerType?: string;
    nodeType?: string;
    nodeTypeVersion?: number;
    nodeDisplayName?: string;
    nodeParameters?: Record<string, unknown>;
}
export type ToolRegistry = Map<string, ToolRegistryEntry>;
export type ReferencedToolKind = Exclude<ToolRegistryEntry['kind'], 'tool'>;
export declare function buildToolRegistry(tools: BuiltTool[]): ToolRegistry;
