import type { OutboundHttp } from '@n8n/backend-network';
import type { MessageEventBusDestinationOptions } from 'n8n-workflow';
import type { MessageEventBus } from '../../eventbus/message-event-bus/message-event-bus';
import type { MessageEventBusDestination } from './destinations/message-event-bus-destination.ee';
export declare function createMessageEventBusDestination(eventBus: MessageEventBus, outboundHttp: OutboundHttp, options: MessageEventBusDestinationOptions): MessageEventBusDestination;
