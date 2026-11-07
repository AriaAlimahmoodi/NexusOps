import { Logger } from '@n8n/backend-common';
import { PubSubMetadata } from '@n8n/decorators';
import { InstanceSettings } from 'n8n-core';
import { PubSubEventBus } from './pubsub.eventbus';
export declare class PubSubRegistry {
    private readonly logger;
    private readonly instanceSettings;
    private readonly pubSubMetadata;
    private readonly pubsubEventBus;
    constructor(logger: Logger, instanceSettings: InstanceSettings, pubSubMetadata: PubSubMetadata, pubsubEventBus: PubSubEventBus);
    private eventHandlers;
    init(): void;
}
