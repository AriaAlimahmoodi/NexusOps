export type SubgraphPhase = 'discovery' | 'builder' | 'assistant' | 'state_management' | 'responder';
export declare function isSubgraphPhase(value: string): value is SubgraphPhase;
export interface CoordinationLogEntry {
    phase: SubgraphPhase;
    status: 'completed' | 'in_progress' | 'error';
    timestamp: number;
    summary: string;
    output?: string;
    metadata: CoordinationMetadata;
}
export type CoordinationMetadata = DiscoveryMetadata | BuilderMetadata | AssistantMetadata | StateManagementMetadata | ResponderMetadata | ErrorMetadata;
export interface DiscoveryMetadata {
    phase: 'discovery';
    nodesFound: number;
    nodeTypes: string[];
    hasBestPractices: boolean;
}
export interface BuilderMetadata {
    phase: 'builder';
    nodesCreated: number;
    connectionsCreated: number;
    nodeNames: string[];
}
export interface ErrorMetadata {
    phase: 'error';
    failedSubgraph: SubgraphPhase;
    errorMessage: string;
    partialBuilderData?: {
        nodeCount: number;
        connectionCount: number;
        nodeNames: string[];
    };
}
export interface StateManagementMetadata {
    phase: 'state_management';
    action: 'compact' | 'clear';
    messagesRemoved?: number;
}
export interface AssistantMetadata {
    phase: 'assistant';
    hasCodeDiff: boolean;
    suggestionCount: number;
}
export interface ResponderMetadata {
    phase: 'responder';
    responseLength: number;
}
export declare function createDiscoveryMetadata(data: Omit<DiscoveryMetadata, 'phase'>): DiscoveryMetadata;
export declare function createBuilderMetadata(data: Omit<BuilderMetadata, 'phase'>): BuilderMetadata;
export declare function createErrorMetadata(data: Omit<ErrorMetadata, 'phase'>): ErrorMetadata;
export declare function createStateManagementMetadata(data: Omit<StateManagementMetadata, 'phase'>): StateManagementMetadata;
export declare function createAssistantMetadata(data: Omit<AssistantMetadata, 'phase'>): AssistantMetadata;
export declare function createResponderMetadata(data: Omit<ResponderMetadata, 'phase'>): ResponderMetadata;
