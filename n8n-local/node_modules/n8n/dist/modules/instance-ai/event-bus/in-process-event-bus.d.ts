import type { InstanceAiEvent } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { InstanceAiEventBus, StoredEvent } from '@n8n/instance-ai';
import { InstanceSettings } from 'n8n-core';
import { Publisher } from '../../../scaling/pubsub/publisher.service';
import { DurableEventLog } from './durable-event-log';
export declare class InProcessEventBus implements InstanceAiEventBus {
    private readonly logger;
    private readonly instanceSettings;
    private readonly publisher;
    private readonly eventLog;
    private readonly emitter;
    constructor(logger: Logger, instanceSettings: InstanceSettings, publisher: Publisher, eventLog: DurableEventLog);
    publish(threadId: string, event: InstanceAiEvent): void;
    private onDrained;
    private relayToSiblings;
    handleRelayInstanceAiEvent({ threadId, storedEvent, }: {
        threadId: string;
        storedEvent: StoredEvent;
    }): void;
    subscribe(threadId: string, handler: (storedEvent: StoredEvent) => void): () => void;
    hasSubscribers(threadId: string): boolean;
    clearThread(threadId: string): void;
    clear(): void;
}
