import { WithTimestamps } from '@n8n/db';
import { MessageEventBusDestinationOptions } from 'n8n-workflow';
export declare class EventDestinations extends WithTimestamps {
    id: string;
    destination: MessageEventBusDestinationOptions;
}
