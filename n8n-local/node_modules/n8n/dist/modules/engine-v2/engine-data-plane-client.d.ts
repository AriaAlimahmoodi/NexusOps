import { OutboundHttp } from '@n8n/backend-network';
import { EngineConfig } from '@n8n/config';
import type { ExecutionSnapshot, StartExecutionRequest, StartExecutionResult, SearchExecutionsRequest, SearchExecutionsResponse } from '@n8n/engine';
import { InstanceSettings } from 'n8n-core';
import type { ExecutionIdV2 } from '../../executions/execution-id';
import { type CancelExecutionOutcome, type EngineDataPlaneProvider } from '../../services/engine-data-plane-proxy.service';
export declare class EngineDataPlaneClient implements EngineDataPlaneProvider {
    private readonly engineConfig;
    private readonly instanceSettings;
    private readonly http;
    constructor(engineConfig: EngineConfig, outboundHttp: OutboundHttp, instanceSettings: InstanceSettings);
    private caller;
    startExecution(request: StartExecutionRequest): Promise<StartExecutionResult>;
    getExecution(id: ExecutionIdV2, options?: {
        includeSteps?: boolean;
    }): Promise<ExecutionSnapshot | undefined>;
    searchExecutions(request: SearchExecutionsRequest): Promise<SearchExecutionsResponse>;
    cancelExecution(id: ExecutionIdV2): Promise<CancelExecutionOutcome | undefined>;
    private endedStatus;
    private toError;
    private parseErrorResponse;
}
