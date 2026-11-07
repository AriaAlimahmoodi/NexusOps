import type { INodeParameters } from 'n8n-workflow';
import type { NodeConfigurationsMap, NodeConfigurationEntry, WorkflowMetadata } from '../../types';
interface NodeForConfiguration {
    type: string;
    typeVersion: number;
    parameters: INodeParameters;
}
export declare function collectSingleNodeConfiguration(node: NodeForConfiguration): NodeConfigurationEntry | null;
export declare function addNodeConfigurationToMap(nodeType: string, config: NodeConfigurationEntry, configurationsMap: NodeConfigurationsMap): void;
export declare function collectNodeConfigurationsFromWorkflows(workflows: WorkflowMetadata[]): NodeConfigurationsMap;
export declare function getNodeConfigurationsFromTemplates(templates: WorkflowMetadata[], nodeType: string, nodeVersion?: number): NodeConfigurationEntry[];
export declare function formatNodeConfigurationExamples(nodeType: string, configurations: NodeConfigurationEntry[], nodeVersion?: number, maxExamples?: number, maxChars?: number): string;
export {};
