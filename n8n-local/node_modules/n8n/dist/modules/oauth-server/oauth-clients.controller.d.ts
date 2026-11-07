import { DeleteOAuthClientQueryDto, DeleteOAuthClientResponseDto, InstanceMcpClientStatsResponseDto, ListOAuthClientsQueryDto, ListOAuthClientsResponseDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import type { Response } from 'express';
import { OAuthServerService } from './oauth-server.service';
export declare class OAuthClientsController {
    private readonly oauthServerService;
    private readonly logger;
    constructor(oauthServerService: OAuthServerService, logger: Logger);
    getAllClients(req: AuthenticatedRequest, _res: Response, query: ListOAuthClientsQueryDto): Promise<ListOAuthClientsResponseDto>;
    getInstanceStats(): Promise<InstanceMcpClientStatsResponseDto>;
    deleteClient(req: AuthenticatedRequest, _res: Response, clientId: string, query: DeleteOAuthClientQueryDto): Promise<DeleteOAuthClientResponseDto>;
}
