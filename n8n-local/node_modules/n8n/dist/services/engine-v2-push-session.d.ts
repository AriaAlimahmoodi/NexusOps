import type { INodeExecutionData } from 'n8n-workflow';
export declare class EngineV2StepRun {
    readonly executionIndex: number;
    readonly startTime: number;
    settled: boolean;
    constructor(executionIndex: number, startTime: number);
}
export declare class EngineV2PushSession {
    readonly pushRef: string;
    readonly workflowId: string;
    trigger?: {
        nodeName: string;
        outputs: INodeExecutionData[][];
    } | undefined;
    sequenceNumber: number;
    nextExecutionIndex: number;
    readonly steps: Map<string, EngineV2StepRun>;
    lastSeenAt: number;
    constructor(pushRef: string, workflowId: string, trigger?: {
        nodeName: string;
        outputs: INodeExecutionData[][];
    } | undefined);
}
