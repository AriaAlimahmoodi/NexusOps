import type { Request, Response } from 'express';
import { EngineCredentialsService } from './engine-credentials.service';
export declare class EngineCredentialsController {
    private readonly credentialsService;
    constructor(credentialsService: EngineCredentialsService);
    resolveCredential(req: Request, res: Response): Promise<void>;
}
