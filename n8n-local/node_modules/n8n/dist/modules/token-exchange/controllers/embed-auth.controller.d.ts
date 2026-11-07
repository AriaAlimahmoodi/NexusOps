import { EmbedLoginBodyDto, EmbedLoginQueryDto } from '@n8n/api-types';
import { EventService, UrlService } from '@n8n/backend-services';
import type { Response } from 'express';
import { AuthService } from '../../../auth/auth.service';
import { AuthlessRequest } from '../../../requests';
import { TokenExchangeService } from '../services/token-exchange.service';
import { TokenExchangeConfig } from '../token-exchange.config';
export declare class EmbedAuthController {
    private readonly config;
    private readonly tokenExchangeService;
    private readonly authService;
    private readonly urlService;
    private readonly eventService;
    constructor(config: TokenExchangeConfig, tokenExchangeService: TokenExchangeService, authService: AuthService, urlService: UrlService, eventService: EventService);
    getLogin(req: AuthlessRequest, res: Response, query: EmbedLoginQueryDto): Promise<void>;
    postLogin(req: AuthlessRequest, res: Response, body: EmbedLoginBodyDto): Promise<void>;
    private handleLogin;
}
