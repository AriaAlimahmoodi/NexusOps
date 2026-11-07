import { CreateLogStreamingDestinationPublicDto, UpdateLogStreamingDestinationPublicDto, LogStreamingDestinationListPublicDto, LogStreamingDestinationPublicDto, LogStreamingEventTypesPublicDto, LogStreamingTestResultPublicDto } from '@n8n/api-types';
import { OutboundHttp } from '@n8n/backend-network';
import { CredentialsFinderService } from '@n8n/backend-services';
import { InstanceSettingsLoaderConfig } from '@n8n/config';
import type { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { MessageEventBus } from '../../../eventbus/message-event-bus/message-event-bus';
import { LogStreamingDestinationService } from '../../../modules/log-streaming.ee/log-streaming-destination.service';
export declare class LogStreamingPublicController {
    private readonly destinationService;
    private readonly eventBus;
    private readonly instanceSettingsLoaderConfig;
    private readonly outboundHttp;
    private readonly credentialsFinderService;
    constructor(destinationService: LogStreamingDestinationService, eventBus: MessageEventBus, instanceSettingsLoaderConfig: InstanceSettingsLoaderConfig, outboundHttp: OutboundHttp, credentialsFinderService: CredentialsFinderService);
    getLogStreamingEventTypes(): Promise<LogStreamingEventTypesPublicDto>;
    getLogStreamingDestinations(): Promise<LogStreamingDestinationListPublicDto>;
    getLogStreamingDestination(_req: AuthenticatedRequest, _res: Response, destinationId: string): Promise<LogStreamingDestinationPublicDto>;
    createLogStreamingDestination(req: AuthenticatedRequest, _res: Response, body: CreateLogStreamingDestinationPublicDto): Promise<LogStreamingDestinationPublicDto>;
    updateLogStreamingDestination(req: AuthenticatedRequest, _res: Response, destinationId: string, body: UpdateLogStreamingDestinationPublicDto): Promise<LogStreamingDestinationPublicDto>;
    testLogStreamingDestination(req: AuthenticatedRequest, _res: Response, destinationId: string): Promise<LogStreamingTestResultPublicDto>;
    deleteLogStreamingDestination(_req: AuthenticatedRequest, _res: Response, destinationId: string): Promise<LogStreamingDestinationPublicDto>;
    private assertNotManagedByEnv;
    private saveDestination;
    private findDestinationOrFail;
}
