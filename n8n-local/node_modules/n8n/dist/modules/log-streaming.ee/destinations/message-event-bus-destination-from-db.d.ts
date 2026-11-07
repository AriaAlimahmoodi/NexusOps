import type { OutboundHttp } from '@n8n/backend-network';
import type { MessageEventBus } from '../../../eventbus/message-event-bus/message-event-bus';
import type { MessageEventBusDestination } from './message-event-bus-destination.ee';
import type { EventDestinations } from '../database/entities';
export declare function messageEventBusDestinationFromDb(eventBusInstance: MessageEventBus, dbData: EventDestinations, outboundHttp: OutboundHttp): MessageEventBusDestination | null;
