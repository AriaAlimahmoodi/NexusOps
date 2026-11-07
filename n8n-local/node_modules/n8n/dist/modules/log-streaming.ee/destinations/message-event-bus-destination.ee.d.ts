import { Logger } from '@n8n/backend-common';
import type { INodeCredentials, MessageEventBusDestinationOptions } from 'n8n-workflow';
import { MessageEventBusDestinationTypeNames } from 'n8n-workflow';
import type { AbstractEventMessage } from '../../../eventbus/event-message-classes/abstract-event-message';
import type { MessageEventBus, MessageWithCallback } from '../../../eventbus/message-event-bus/message-event-bus';
import { CircuitBreaker } from '../../../utils/circuit-breaker';
export declare abstract class MessageEventBusDestination implements MessageEventBusDestinationOptions {
    readonly id: string;
    readonly eventBusInstance: MessageEventBus;
    protected readonly logger: Logger;
    protected circuitBreakerInstance: CircuitBreaker;
    __type: MessageEventBusDestinationTypeNames;
    label: string;
    enabled: boolean;
    subscribedEvents: string[];
    credentials: INodeCredentials;
    anonymizeAuditMessages: boolean;
    readonly circuitBreakerOptions?: MessageEventBusDestinationOptions['circuitBreaker'];
    constructor(eventBusInstance: MessageEventBus, options: MessageEventBusDestinationOptions);
    getId(): string;
    hasSubscribedToEvent(msg: AbstractEventMessage): boolean;
    serialize(): MessageEventBusDestinationOptions;
    abstract receiveFromEventBus(emitterPayload: MessageWithCallback): Promise<boolean>;
    sendMessage(emitterPayload: MessageWithCallback): Promise<boolean>;
    toString(): string;
    close(): Promise<void>;
}
