import type { CorsOptions } from '@n8n/decorators';
import type { Response, Request } from 'express';
export declare class CorsService {
    private readonly defaultOptions;
    applyCorsHeaders(req: Request, res: Response, options?: Partial<CorsOptions>): boolean;
    private isOriginAllowed;
}
