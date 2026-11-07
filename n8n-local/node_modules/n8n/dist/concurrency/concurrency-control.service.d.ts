import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import { ExecutionRepository } from '@n8n/db';
import type { WorkflowExecuteMode } from 'n8n-workflow';
import { License } from '../license';
import { Telemetry } from '../telemetry';
export declare const CLOUD_TEMP_PRODUCTION_LIMIT = 999;
export declare const CLOUD_TEMP_REPORTABLE_THRESHOLDS: number[];
export type ConcurrencyQueueType = 'production' | 'evaluation';
export interface CapacityTarget {
    executionId: string;
    mode: WorkflowExecuteMode;
}
export declare class ConcurrencyControlService {
    private readonly logger;
    private readonly executionRepository;
    private readonly telemetry;
    private readonly eventService;
    private readonly globalConfig;
    private readonly license;
    private isEnabled;
    private readonly limits;
    private readonly queues;
    private readonly limitsToReport;
    private evalQueueResolved;
    constructor(logger: Logger, executionRepository: ExecutionRepository, telemetry: Telemetry, eventService: EventService, globalConfig: GlobalConfig, license: License);
    private normaliseLimit;
    private ensureEvalQueueResolved;
    private wireQueue;
    has(executionId: string): boolean;
    throttle({ mode, executionId }: CapacityTarget): Promise<void>;
    release({ mode }: {
        mode: WorkflowExecuteMode;
    }): void;
    remove({ mode, executionId }: CapacityTarget): void;
    removeAll(executionIdsToCancel: string[]): Promise<void>;
    disable(): void;
    private isUnlimited;
    private shouldReport;
    private getQueue;
}
