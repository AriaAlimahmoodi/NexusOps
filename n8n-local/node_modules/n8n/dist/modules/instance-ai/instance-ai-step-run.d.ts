import type { AiAgentRequest, IConnections, INode, INodeExecutionData, IPinData, IRunData } from 'n8n-workflow';
export type StepRunInputMode = 'chain' | 'reused-execution' | 'mocked';
export interface StepRunPlan {
    runData?: IRunData;
    dirtyNodeNames?: string[];
    mockedNodeNames: string[];
    reusedNodeNames: string[];
    rootNodeNames?: string[];
    unhonoredInput?: {
        requested: 'reused-execution' | 'mocked';
        upstreamNodeNames: string[];
    };
}
export declare function resolveStepRunRoots(nodes: INode[], connections: IConnections, targetName: string): string[];
export declare function buildMockedStepRunData(args: {
    nodes: INode[];
    connections: IConnections;
    targetName: string;
    mockItems: INodeExecutionData[];
    rootNames?: string[];
}): {
    runData: IRunData;
    mockedNodeNames: string[];
};
export declare function collectAncestorNames(nodes: INode[], connections: IConnections, targetName: string, rootNames?: string[]): string[];
export declare function findRootsAboveOtherRoots(nodes: INode[], connections: IConnections, rootNames: string[]): string[];
export declare function findUncoveredAncestors(args: {
    nodes: INode[];
    connections: IConnections;
    targetName: string;
    rootNames: string[];
    runData: IRunData;
    pinnedNodeNames?: string[];
}): string[];
export declare function planStepRun(args: {
    nodes: INode[];
    connections: IConnections;
    targetName: string;
    mockItems?: INodeExecutionData[];
    priorRunData?: IRunData;
    pinnedNodeNames?: string[];
}): StepRunPlan & {
    inputMode: StepRunInputMode;
};
export declare function pinDataForStepRun(workflowPinData: IPinData | undefined, args: {
    targetName: string;
    mockedNodeNames: string[];
}): IPinData | undefined;
export declare function isToolkitNode(node: INode): boolean;
export declare function declaredToolArguments(node: INode): string[];
export declare function buildToolAgentRequest(args: {
    target: INode;
    toolArguments?: Record<string, unknown> | string;
}): AiAgentRequest;
export declare function toExecutionItems(items: Array<Record<string, unknown>>): INodeExecutionData[];
