import { WorkerStatus } from '@n8n/api-types';
import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { Push } from '../push';
import { JobProcessor } from './job-processor';
import { Publisher } from './pubsub/publisher.service';
export declare class WorkerStatusService {
    private readonly jobProcessor;
    private readonly globalConfig;
    private readonly instanceSettings;
    private readonly publisher;
    private readonly push;
    constructor(jobProcessor: JobProcessor, globalConfig: GlobalConfig, instanceSettings: InstanceSettings, publisher: Publisher, push: Push);
    requestWorkerStatus(requestingUserId: string): Promise<void>;
    handleWorkerStatusResponse(payload: WorkerStatus & {
        requestingUserId: string;
    }): void;
    publishWorkerResponse(command: {
        requestingUserId: string;
    }): Promise<void>;
    private generateStatus;
    private getOsCpuString;
}
