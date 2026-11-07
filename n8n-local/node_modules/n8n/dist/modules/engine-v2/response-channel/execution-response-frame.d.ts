import type { Logger } from '@n8n/backend-common';
import { type ExecutionResponse } from '@n8n/engine';
import { type Result } from '@n8n/utils/result';
export type FrameResult = {
    ok: true;
    frame: string;
} | {
    ok: false;
    frame: string;
    error: Error;
};
export declare function serializeExecutionResponse(response: ExecutionResponse, logger: Logger, maxFrameBytes?: number): FrameResult;
export declare function deserializeExecutionResponse(frame: string, logger: Logger): Result<ExecutionResponse, Error>;
