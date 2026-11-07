import { type INode, type IRunExecutionData, type IPinData, type WorkflowExecutionMockDataSource } from 'n8n-workflow';
export interface InstanceAiRunPinDataPlan {
    runPinData?: IPinData;
    nonVerificationPinData: IPinData;
    verificationPinData: IPinData;
    mockDataSources: WorkflowExecutionMockDataSource[];
    startNodeName?: string;
    triggerItems?: IPinData[string];
    triggerExecutionData?: IRunExecutionData;
}
export declare function buildInstanceAiRunPinDataPlan(args: {
    workflowPinData: IPinData;
    verificationPinData?: Record<string, unknown[]>;
    inputData?: Record<string, unknown>;
    triggerNode?: INode;
}): InstanceAiRunPinDataPlan;
export declare function sdkPinDataToRuntime(pinData: Record<string, unknown[]> | undefined): IPinData;
export declare function pruneUnreachedVerificationPinData(args: {
    executionId: string;
    verificationPinData: IPinData;
    nonVerificationPinData: IPinData;
    executedNodeNames?: string[];
}): Promise<void>;
export declare function getPrunedVerificationPinData(args: {
    persistedPinData: IPinData;
    verificationPinData: IPinData;
    nonVerificationPinData: IPinData;
    reachedNodeNames: string[];
}): IPinData | undefined;
