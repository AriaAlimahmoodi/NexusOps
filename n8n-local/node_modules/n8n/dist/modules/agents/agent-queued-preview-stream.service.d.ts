import type { AgentSseEvent } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { InstanceSettings } from 'n8n-core';
import type { PubSubCommandMap } from '../../scaling/pubsub/pubsub.event-map';
import { Publisher } from '../../scaling/pubsub/publisher.service';
import { Subscriber } from '../../scaling/pubsub/subscriber.service';
import type { initSseStream } from './agent-sse-stream';
import { AgentMessageQueueRepository } from './repositories/agent-message-queue.repository';
type QueueStreamEvent = PubSubCommandMap['relay-agent-queued-chat'];
export declare class AgentQueuedPreviewStreamService {
    private readonly publisher;
    private readonly instanceSettings;
    private readonly repository;
    private readonly logger;
    private static readonly RECOVERY_GRACE_MS;
    private static readonly RELAY_HEARTBEAT_MS;
    private static readonly RELAY_TIMEOUT_MS;
    private readonly listeners;
    private readonly stopRelays;
    constructor(publisher: Publisher, instanceSettings: InstanceSettings, repository: AgentMessageQueueRepository, logger: Logger, subscriber: Subscriber);
    subscribe(queueId: string, stream: ReturnType<typeof initSseStream>): {
        done: Promise<void>;
        close: () => void;
        accepted: () => void;
    };
    createSender(queueId: string): {
        send: (event: AgentSseEvent) => void;
        close: () => Promise<void>;
    };
    handleRelay({ queueId, sequence, event }: QueueStreamEvent): void;
    closeSettledStreams(): Promise<void>;
}
export {};
