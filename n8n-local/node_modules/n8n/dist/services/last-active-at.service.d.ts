import { Logger } from '@n8n/backend-common';
import { AuthenticatedRequest, UserRepository } from '@n8n/db';
import type { NextFunction, Response } from 'express';
export declare class LastActiveAtService {
    private readonly userRepository;
    private readonly logger;
    private readonly lastActiveCache;
    constructor(userRepository: UserRepository, logger: Logger);
    middleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void>;
    updateLastActiveIfStale(userId: string): Promise<void>;
}
