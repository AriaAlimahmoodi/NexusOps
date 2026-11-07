import { Logger } from '@n8n/backend-common';
import type { DistributiveOmit } from '@n8n/utils/types';
import { InstanceSettings } from 'n8n-core';
import { Publisher } from '../../../scaling/pubsub/publisher.service';
import type { PubSubCommandMap } from '../../../scaling/pubsub/pubsub.event-map';
export declare const LEADER_CHANNEL_REQUEST_TIMEOUT_MS = 20000;
type LeaderChannelRequest = PubSubCommandMap['agent-chat-leader-channel-request'];
export type LeaderChannelRequestInput = DistributiveOmit<LeaderChannelRequest, 'requestId' | 'replyTo'>;
export declare class LeaderChannelRelayService {
    private readonly logger;
    private readonly publisher;
    private readonly instanceSettings;
    private readonly pending;
    constructor(logger: Logger, publisher: Publisher, instanceSettings: InstanceSettings);
    request(input: LeaderChannelRequestInput): Promise<void>;
    requestWithoutAck(input: LeaderChannelRequestInput): Promise<void>;
    respond(request: LeaderChannelRequest, error?: Error): Promise<void>;
    handleResult(payload: PubSubCommandMap['agent-chat-leader-channel-result']): void;
    rejectPendingOnTakeover(): void;
    rejectPendingOnShutdown(): void;
    private rejectPending;
    private publish;
    private describe;
}
export {};
