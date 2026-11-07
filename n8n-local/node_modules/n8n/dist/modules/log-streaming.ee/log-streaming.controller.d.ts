import { DeleteDestinationQueryDto, GetDestinationQueryDto, TestDestinationQueryDto } from '@n8n/api-types';
import { OutboundHttp } from '@n8n/backend-network';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import type { AuthenticatedRequest } from '@n8n/db';
import type { MessageEventBusDestinationOptions } from 'n8n-workflow';
import { CredentialsFinderService } from '@n8n/backend-services';
import { MessageEventBus } from '../../eventbus/message-event-bus/message-event-bus';
import { LogStreamingDestinationService } from './log-streaming-destination.service';
export declare class EventBusController {
    private readonly eventBus;
    private readonly destinationService;
    private readonly instanceSettingsLoaderConfig;
    private readonly outboundHttp;
    private readonly credentialsFinderService;
    constructor(eventBus: MessageEventBus, destinationService: LogStreamingDestinationService, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig, outboundHttp: OutboundHttp, credentialsFinderService: CredentialsFinderService);
    private assertNotManagedByEnv;
    getEventNames(): Promise<string[]>;
    getDestination(_req: AuthenticatedRequest, _res: unknown, query: GetDestinationQueryDto): Promise<MessageEventBusDestinationOptions[]>;
    postDestination(req: AuthenticatedRequest): Promise<MessageEventBusDestinationOptions>;
    sendTestMessage(req: AuthenticatedRequest, _res: unknown, query: TestDestinationQueryDto): Promise<boolean>;
    deleteDestination(_req: AuthenticatedRequest, _res: unknown, query: DeleteDestinationQueryDto): Promise<void>;
}
