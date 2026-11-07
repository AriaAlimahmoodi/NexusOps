import { Logger } from '@n8n/backend-common';
import type { Response } from 'express';
import { AuthlessRequest } from '../requests';
import { JwksRegistry } from '@n8n/backend-services/auth';
export declare class JwksController {
    private readonly jwksRegistry;
    private readonly logger;
    constructor(jwksRegistry: JwksRegistry, logger: Logger);
    getKeys(_req: AuthlessRequest, res: Response): Promise<void>;
}
