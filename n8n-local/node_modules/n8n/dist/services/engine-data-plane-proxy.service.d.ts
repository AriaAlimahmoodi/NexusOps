import type { ExecutionSnapshot, ExecutionStatus, StartExecutionRequest, StartExecutionResult, SearchExecutionsRequest, SearchExecutionsResponse } from '@n8n/engine';
import { OperationalError, UserError } from 'n8n-workflow';
import type { ExecutionIdV2 } from '../executions/execution-id';
export declare class EngineRejectedWorkflowError extends UserError {
}
export declare class EngineDidNotAdmitError extends OperationalError {
}
export declare const isStartRefusedBeforeSave: (error: unknown) => boolean;
export type CancelExecutionOutcome = {
    cancelled: true;
    finishedAt: Date;
} | {
    cancelled: false;
    status: ExecutionStatus;
};
export interface EngineDataPlaneProvider {
    searchExecutions(request: SearchExecutionsRequest): Promise<SearchExecutionsResponse>;
    startExecution(request: StartExecutionRequest): Promise<StartExecutionResult>;
    getExecution(id: ExecutionIdV2, options?: {
        includeSteps?: boolean;
    }): Promise<ExecutionSnapshot | undefined>;
    cancelExecution(id: ExecutionIdV2): Promise<CancelExecutionOutcome | undefined>;
}
export declare class EngineDataPlaneProxyService implements EngineDataPlaneProvider {
    private provider;
    registerProvider(provider: EngineDataPlaneProvider): void;
    isAvailable(): boolean;
    searchExecutions(request: SearchExecutionsRequest): Promise<SearchExecutionsResponse>;
    startExecution(request: StartExecutionRequest): Promise<StartExecutionResult>;
    getExecution(id: ExecutionIdV2, options?: {
        includeSteps?: boolean;
    }): Promise<ExecutionSnapshot | undefined>;
    cancelExecution(id: ExecutionIdV2): Promise<CancelExecutionOutcome | undefined>;
}
