import { WorkflowsConfig } from '@n8n/config';
import { ErrorReporter, InstanceSettings } from 'n8n-core';
import { Publisher } from '../../scaling/pubsub/publisher.service';
export declare class WorkflowPublicationNotifier {
    private readonly errorReporter;
    private readonly instanceSettings;
    private readonly publisher;
    private readonly workflowsConfig;
    constructor(errorReporter: ErrorReporter, instanceSettings: InstanceSettings, publisher: Publisher, workflowsConfig: WorkflowsConfig);
    requestDrain(): void;
    private wakeLocalConsumer;
}
