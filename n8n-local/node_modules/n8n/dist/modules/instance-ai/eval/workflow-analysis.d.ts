import { isAiRootNodeType } from '@n8n/workflow-sdk';
import { type INode, type IPinData, type IWorkflowBase } from 'n8n-workflow';
export { isAiRootNodeType };
export declare function isVendorSdkSubNode(nodeType: string | undefined): boolean;
export declare function isDataTableRead(node: INode): boolean;
export declare function emitsDataTableRows(node: INode): boolean;
export declare function identifyNodesForPinData(workflow: IWorkflowBase, exclusionSet?: Set<string>, liveReads?: Set<string>): INode[];
export interface TriggerBinaryRequirement {
    propertyName: string;
    contentType: string;
    filename: string;
}
export declare function detectBinaryDependencies(workflow: IWorkflowBase): TriggerBinaryRequirement | undefined;
export type AutoPinReason = 'protocol_binary' | 'unsupported_vendor_llm' | 'unsupported_vendor_embeddings' | 'unsafe_baseurl_override' | 'shared_vendor_llm_subnode';
export interface AutoPinEntry {
    root: string;
    subNode: string;
    subNodeType: string;
    reason: AutoPinReason;
}
export interface VendorLlmRouting {
    subNodeToRoot: Map<string, string>;
    rootToSubNode: Map<string, INode>;
}
export declare function buildVendorLlmRouting(workflow: IWorkflowBase, unpinNodes: string[]): VendorLlmRouting;
export interface PartitionedAiRoots {
    unpinNodes: string[];
    pinNodes: string[];
    autoPinned: AutoPinEntry[];
}
export declare function partitionAiRoots(workflow: IWorkflowBase, explicitPinNodes?: string[]): PartitionedAiRoots;
export declare function identifyNodesForHints(workflow: IWorkflowBase): INode[];
export interface MockHints {
    globalContext: string;
    nodeHints: Record<string, string>;
    triggerContent: Record<string, unknown>;
    startNodeName?: string;
    triggerEmitsNoItems?: boolean;
    warnings: string[];
    bypassPinData: IPinData;
}
export interface GenerateMockHintsOptions {
    workflow: IWorkflowBase;
    nodeNames: string[];
    scenarioHints?: string;
    defaultStartNodeName?: string;
}
export declare const TRIGGER_CONTENT_CORRECTION = "The previous answer left \"triggerContent\" empty. The Test Scenario describes the event that fires the workflow's trigger or start node, so \"triggerContent\" must carry that event as the node's output object and must not be {}. Set \"triggerEmitsNoItems\": true only when the scenario says the trigger has nothing to emit.";
export declare function generateMockHints(options: GenerateMockHintsOptions): Promise<MockHints>;
