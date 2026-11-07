import { createIpRateLimit } from '@n8n/decorators';
import type { RequestHandler } from 'express';
export declare const scimRoute: {
    skipAuth: boolean;
    usesTemplates: boolean;
    allowBots: boolean;
    middlewares: RequestHandler[];
    ipRateLimit: ReturnType<typeof createIpRateLimit>;
};
