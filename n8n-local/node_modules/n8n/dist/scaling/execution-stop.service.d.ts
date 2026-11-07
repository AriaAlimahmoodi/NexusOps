import { Logger } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import { ActiveExecutions } from '../active-executions';
import { Publisher } from './pubsub/publisher.service';
export declare class ExecutionStopService {
    private readonly logger;
    private readonly instanceSettings;
    private readonly publisher;
    private readonly activeExecutions;
    constructor(logger: Logger, instanceSettings: InstanceSettings, publisher: Publisher, activeExecutions: ActiveExecutions);
    requestStop(executionId: string): Promise<void>;
    handleStopExecution({ executionId }: {
        executionId: string;
    }): void;
}
