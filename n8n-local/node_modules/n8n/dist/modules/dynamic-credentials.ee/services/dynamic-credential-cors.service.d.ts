import type { Method } from '@n8n/decorators';
import type { Request, Response } from 'express';
import { CorsService } from '../../../services/cors-service';
import { DynamicCredentialsConfig } from '../dynamic-credentials.config';
export declare class DynamicCredentialCorsService {
    private readonly corsService;
    private readonly dynamicCredentialConfig;
    private readonly defaultOptions;
    constructor(corsService: CorsService, dynamicCredentialConfig: DynamicCredentialsConfig);
    preflightHandler(req: Request, res: Response, allowedMethods: Method[]): void;
    applyCorsHeadersIfEnabled(req: Request, res: Response, allowedMethods: Method[]): boolean;
}
