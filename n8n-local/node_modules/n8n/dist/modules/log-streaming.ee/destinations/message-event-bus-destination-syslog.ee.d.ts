import type { SyslogClient } from '@n8n/syslog-client';
import { Facility } from '@n8n/syslog-client';
import type { MessageEventBusDestinationOptions, MessageEventBusDestinationSyslogOptions } from 'n8n-workflow';
import type { MessageEventBus, MessageWithCallback } from '../../../eventbus/message-event-bus/message-event-bus';
import { MessageEventBusDestination } from './message-event-bus-destination.ee';
export declare const isMessageEventBusDestinationSyslogOptions: (candidate: unknown) => candidate is MessageEventBusDestinationSyslogOptions;
export declare class MessageEventBusDestinationSyslog extends MessageEventBusDestination implements MessageEventBusDestinationSyslogOptions {
    client: SyslogClient;
    expectedStatusCode?: number;
    host: string;
    port: number;
    protocol: 'udp' | 'tcp' | 'tls';
    facility: Facility;
    app_name: string;
    eol: string;
    constructor(eventBusInstance: MessageEventBus, options: MessageEventBusDestinationSyslogOptions);
    receiveFromEventBus(emitterPayload: MessageWithCallback): Promise<boolean>;
    serialize(): MessageEventBusDestinationSyslogOptions;
    static deserialize(eventBusInstance: MessageEventBus, data: MessageEventBusDestinationOptions): MessageEventBusDestinationSyslog | null;
    toString(): string;
    close(): Promise<void>;
}
