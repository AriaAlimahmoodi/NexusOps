import type { ExecutionStatus } from '@n8n/engine';
import { type ExecutionStatus as ExecutionStatusV1, type WorkflowExecuteMode } from 'n8n-workflow';
export declare function toV1Status(status: ExecutionStatus): ExecutionStatusV1;
export declare function toV1Mode(hostMode: string): WorkflowExecuteMode;
export declare function resolveV2Statuses(v1Statuses?: ExecutionStatusV1[]): ExecutionStatus[] | undefined;
