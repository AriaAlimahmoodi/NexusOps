import type { Response } from 'express';
import { AuthlessRequest } from '../../../requests';
export declare class TokenExchangeController {
    private readonly config;
    private readonly errorReporter;
    private readonly eventService;
    private readonly tokenExchangeService;
    exchangeToken(req: AuthlessRequest, res: Response): Promise<void>;
}
